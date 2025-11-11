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