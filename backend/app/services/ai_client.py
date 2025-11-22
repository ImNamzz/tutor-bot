import requests
import json
import uuid
from app.core.config import Config
from app.services.storage import StorageService

class AIService:
    @staticmethod
    def generate_request_id():
        return str(uuid.uuid4()).replace("-", "")

    @staticmethod
    def format_messages_for_api(messages):
        api_messages = []
        for msg in messages:
            api_messages.append({
                "role": msg['role'],
                "content": [{"type": "text", "text": msg['content']}]
            })
        return api_messages

    @staticmethod
    def transcribe_audio(data_key: str, language: str = "en-US") -> str:

        if not Config.CLOVA_SPEECH_URL or not Config.CLOVA_SPEECH_SECRET:
            raise Exception("Clova Speech credentials are not configured.")

        invoke_url = Config.CLOVA_SPEECH_URL.rstrip('/')
        api_url = f"{invoke_url}/recognizer/object-storage"

        headers = {
            'Accept': 'application/json;UTF-8',
            'Content-Type': 'application/json;UTF-8',
            'X-CLOVASPEECH-API-KEY': Config.CLOVA_SPEECH_SECRET
        }

        request_body = {
            'dataKey': data_key,
            'language': language,
            'completion': 'async',
            'resultToObs': True,
            'wordAlignment': True,
            'fullText': True,
            'diarization': {'enable': False},
        }

        try:
            print(f"Triggering Async Clova Speech for: {data_key}...")
            response = requests.post(
                url=api_url,
                headers=headers,
                data=json.dumps(request_body).encode('UTF-8')
            )
            
            if response.status_code != 200:
                print(f"Clova Error: {response.status_code} - {response.text}")
                raise Exception(f"Clova API Error: {response.text}")
                
            result = response.json()
            if result.get('result') != 'SUCCEEDED':
                print(f"Warning: Clova trigger might have failed: {result}")
            return result.get('token', '')

        except requests.exceptions.RequestException as e:
            print(f"Clova Speech API Error: {e}")
            raise Exception(f"Audio transcription trigger failed: {e}")
        
    @staticmethod
    def check_transcription_result(data_key: str) -> str:
        storage = StorageService()
        
        try:
            response = storage.s3_client.list_objects_v2(
                Bucket=storage.bucket_name, 
                Prefix=data_key
            )
            
            if 'Contents' not in response:
                return None

            for obj in response['Contents']:
                file_key = obj['Key']
                
                if file_key.endswith('.json') and data_key in file_key:
                    
                    print(f"Found transcription result: {file_key}")
                    
                    file_obj = storage.s3_client.get_object(Bucket=storage.bucket_name, Key=file_key)
                    content = file_obj['Body'].read().decode('utf-8')
                    result_json = json.loads(content)

                    if 'text' in result_json:
                        return result_json['text']
            
            return None

        except Exception as e:
            print(f"Error checking transcription status: {e}")
            return None

    @staticmethod
    def analyze_transcript(transcript: str):
        url = f"{Config.CLOVA_API_HOST}/v3/chat-completions/{Config.CLOVA_MODEL}"
        headers = {
            "Authorization": f"Bearer {Config.CLOVA_API_KEY}",
            "X-NCP-CLOVASTUDIO-REQUEST-ID": AIService.generate_request_id(),
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json", 
        }

        messages = [
            {"role": "system", "content": Config.ANALYSIS_PROMPT},
            {"role": "user", "content": transcript}
        ]
        
        payload = {
            "messages": AIService.format_messages_for_api(messages),
            "maxTokens": 2048, 
            "temperature": 0.5,
            "includeAiFilters": True
        }

        default_response = {"summary": "Error: Could not generate analysis.", "action_items": []}

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            ai_content = data.get("result", {}).get("message", {}).get("content", "{}")
            
            if "```" in ai_content:
                ai_content = ai_content.replace("```json", "").replace("```", "").strip()
            start_index = ai_content.find('{')
            end_index = ai_content.rfind('}')
            if start_index != -1 and end_index != -1:
                ai_content = ai_content[start_index : end_index + 1]

            analysis_data = json.loads(ai_content, strict=False)            
            return analysis_data

        except Exception as e:
            print(f"Analysis Error: {e}")
            return {"summary": f"DEBUG ERROR: {str(e)}", "action_items": []}

    @staticmethod
    def get_socratic_response(messages: list):
        url = f"{Config.CLOVA_API_HOST}/v3/chat-completions/{Config.CLOVA_MODEL}"
        headers = {
            "Authorization": f"Bearer {Config.CLOVA_API_KEY}",
            "X-NCP-CLOVASTUDIO-REQUEST-ID": AIService.generate_request_id(),
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "text/event-stream",
        }

        payload = {
            "messages": AIService.format_messages_for_api(messages),
            "topP": 0.8,
            "topK": 0,
            "maxTokens": 553,
            "temperature": 0.5,
            "repetitionPenalty": 1.1,
            "includeAiFilters": True
        }

        output_text = ""
        try:
            with requests.post(url, headers=headers, json=payload, stream=True, timeout=30) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        decoded = line.decode("utf-8-sig").strip()
                        if decoded.startswith("data:"):
                            json_str = decoded[5:].strip()
                            if json_str == "[DONE]":
                                break
                            try:
                                data = json.loads(json_str)
                                message = data.get("message", {})
                                content = message.get("content", "")
                                if content:
                                    if not output_text.endswith(content):
                                        output_text += content
                                        
                            except json.JSONDecodeError as e:
                                print(f"JSON decode error: {e}, line: {json_str}")
                                continue
                            except Exception as e:
                                print(f"Error processing stream: {e}")
                                continue
                                
        except requests.exceptions.RequestException as e:
            print(f"Socratic Chat Error: {e}")
            return "Yeah bro, I'm dead"
        except Exception as e:
            print(f"Unexpected error: {e}")
            return "Yeah that's enough for me, going to my bed"

        return output_text.strip()