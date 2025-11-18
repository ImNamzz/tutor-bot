import os
import requests
import json
import uuid
import re
import requests.exceptions

CLOVA_API_KEY = os.getenv("CLOVA_API_KEY")
CLOVA_REQUEST_ID = os.getenv("CLOVA_REQUEST_ID")
CLOVA_HOST = os.getenv("CLOVA_API_HOST", "https://clovastudio.stream.ntruss.com")
CLOVA_MODEL = "HCX-005"
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT")
ANALYSIS_PROMPT = os.getenv("ANALYSIS_PROMPT") 
CLOVA_SPEECH_URL = os.getenv("CLOVA_SPEECH_URL")
CLOVA_SPEECH_SECRET = os.getenv("CLOVA_SPEECH_SECRET")

def generate_request_id():
    return str(uuid.uuid4()).replace("-", "")

def format_messages_for_api(messages):
    api_messages = []
    for msg in messages:
        role = msg['role']
        content = msg['content']
        api_messages.append({
            "role": role,
            "content": [{"type": "text", "text": content}]
        })
    return api_messages

def transcribe_audio(file_path: str, language: str):
    if not CLOVA_SPEECH_URL or not CLOVA_SPEECH_SECRET:
        print("Error: Clova Speech credentials are not set in .env")
        raise Exception("Speech transcription service is not configured.")

    request_body = {
        'language': language,
        'completion': 'sync', 
        'wordAlignment': True,
        'fullText': True,
    }
    
    headers = {
        'Accept': 'application/json;UTF-8',
        'X-CLOVASPEECH-API-KEY': CLOVA_SPEECH_SECRET
    }

    try:
        with open(file_path, 'rb') as audio_file:
            files = {
                'media': audio_file,
                'params': (None, json.dumps(request_body, ensure_ascii=False).encode('UTF-8'), 'application/json')
            }
            
            print(f"Sending audio to Clova Speech API (Language: {language})...")
            response = requests.post(headers=headers, url=CLOVA_SPEECH_URL + '/recognizer/upload', files=files)
        
        response.raise_for_status() 
        
        response_json = response.json()
        transcript_text = response_json.get('text')
        
        if transcript_text is None:
            print(f"Clova Speech API response did not contain 'text': {response_json}")
            raise Exception("Transcription failed: invalid API response.")
            
        print("Transcription successful.")
        return transcript_text
        
    except requests.exceptions.RequestException as e:
        print(f"CANT GET API REQ: {e}")
        if e.response is not None:
            print(f"RES BODY: {e.response.text}")
        raise Exception(f"Audio transcription failed: {e}")
    except json.JSONDecodeError:
        print(f"Clova Speech API did not return valid JSON: {response.text}")
        raise Exception("Transcription failed: server returned invalid JSON.")
    except FileNotFoundError:
        print(f"Error: The file was not found at {file_path}")
        raise Exception(f"Transcription failed: file not found.")


def analyze_transcript(transcript: str):
    if not ANALYSIS_PROMPT:
        print("Error: ANALYSIS_PROMPT is not set in .env")
        raise Exception("AI analysis service is not configured.")

    url = f"{CLOVA_HOST}/v3/chat-completions/{CLOVA_MODEL}"
    headers = {
        "Authorization": f"Bearer {CLOVA_API_KEY}",
        "X-NCP-CLOVASTUDIO-REQUEST-ID": generate_request_id(),
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json", 
    }

    messages = [
        {"role": "system", "content": ANALYSIS_PROMPT},
        {"role": "user", "content": transcript}
    ]
    
    api_formatted_messages = format_messages_for_api(messages)
    payload = {
        "messages": api_formatted_messages,
        "maxTokens": 2048, 
        "temperature": 0.5,
        "includeAiFilters": True
    }

    default_response = {"summary": "Error: Could not generate analysis.", "action_items": []}

    try:
        response = requests.post(url, headers=headers, json=payload, stream=False)
        response.raise_for_status()
        data = response.json()
        
        
        ai_message_content = data.get("result", {}).get("message", {}).get("content", "{}")
        
        
        analysis_data = json.loads(ai_message_content)
        
        if not isinstance(analysis_data, dict) or "summary" not in analysis_data or "action_items" not in analysis_data:
             print(f"AI returned malformed JSON: {analysis_data}")
             return default_response
        
        return analysis_data

    except requests.exceptions.RequestException as e:
        print(f"Error calling Analysis API: {e}")
        if e.response is not None:
            print(f"Response Body: {e.response.text}")
        return default_response
    except json.JSONDecodeError as e:
        print(f"Error decoding AI response as JSON: {e}")
        print(f"Received content: {ai_message_content}")
        return default_response
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return default_response

def get_socratic_response(messages: list):
    url = f"{CLOVA_HOST}/v3/chat-completions/{CLOVA_MODEL}"
    headers = {
        "Authorization": f"Bearer {CLOVA_API_KEY}",
        "X-NCP-CLOVASTUDIO-REQUEST-ID": generate_request_id(),
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "text/event-stream",
    }
    api_formatted_messages = format_messages_for_api(messages)
    payload = {
        "messages": api_formatted_messages,
        "topP": 0.8,
        "topK": 0,
        "maxTokens": 553,
        "temperature": 0.5,
        "repetitionPenalty": 1.1,
        "stop": [],
        "seed": 0,
        "includeAiFilters": True
    }
    output_text = ""
    print("\nPARSING AI REQ")
    try:
        with requests.post(url, headers=headers, json=payload, stream=True) as r:
            r.raise_for_status()
            
            for line in r.iter_lines():
                if line:
                    decoded = line.decode("utf-8-sig").strip()
                    json_start_index = decoded.find('{')
                    if json_start_index == -1:
                        print(f"NO JSON DETECTED: {decoded}")
                        continue
                    data_json = decoded[json_start_index:]
                    try:
                        data = json.loads(data_json)
                        if data.get("data") == "[DONE]":
                            break
                        finishReason = data.get("finishReason")
                        if finishReason is not None:
                            print(f"FINISH REASON: {finishReason}")
                            continue
                        message = data.get("message", {})
                        if "content" in message:
                            content = message.get("content")
                            
                            if content and isinstance(content, str):
                                print(f"STRING: {content}")
                                output_text += content
                            
                            elif content and isinstance(content, list):
                                print(f"LIST: {content}")
                                for c in content:
                                    if c.get("type") == "text":
                                        output_text += c.get("text", "")
                            else:
                                print(f"ERROR")
                        else:
                            print("ERROR")
                            
                    except json.JSONDecodeError:
                        if data_json.strip() == "[DONE]":
                            break
                        print(f"CANT DECODE JSON: {data_json}")
                        continue
                    except Exception as e:
                        print(f"PARSING ERROR: {e}") 
                        continue
    
    except requests.exceptions.RequestException as e:
        print(f"CANT GET API REQ")
        if e.response is not None:
            print(f"RES BODY: {e.response.text}")
        return "NO RES FROM AI"

    print(f"{output_text}\n")
    return output_text