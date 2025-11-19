import requests
import json
import uuid
from app.core.config import Config

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
    def transcribe_audio(data_key: str, language: str = "ko-KR") -> str:
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
            'completion': 'sync',
            'wordAlignment': True,
            'fullText': True,
            'diarization': {'enable': False},
        }

        try:
            print(f"Triggering Clova Speech for Object Key: {data_key}...")
            response = requests.post(
                url=api_url,
                headers=headers,
                data=json.dumps(request_body).encode('UTF-8')
            )
            
            if response.status_code != 200:
                print(f"Clova Error: {response.status_code} - {response.text}")
                
            response.raise_for_status()
            result = response.json()
            
            if 'text' in result:
                return result['text']
            else:
                print(f"Unexpected Speech Response: {result}")
                raise Exception("Transcription completed but no text found.")

        except requests.exceptions.RequestException as e:
            print(f"Clova Speech API Error: {e}")
            raise Exception(f"Audio transcription failed: {e}")

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

            analysis_data = json.loads(ai_content)
            return analysis_data

        except Exception as e:
            print(f"Analysis Error: {e}")
            return default_response

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
            with requests.post(url, headers=headers, json=payload, stream=True) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        decoded = line.decode("utf-8-sig").strip()
                        if "data:" in decoded:
                            json_str = decoded.split("data:", 1)[1].strip()
                            if json_str == "[DONE]": break
                            try:
                                data = json.loads(json_str)
                                content = data.get("message", {}).get("content")
                                if content: output_text += content
                            except: continue
        except Exception as e:
            print(f"Socratic Chat Error: {e}")
            return "I'm sorry, I am dumb and cannot respond right now."

        return output_text