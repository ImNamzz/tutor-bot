import requests
import json
import os

class ClovaSpeechClient:
    invoke_url = 'https://clovaspeech-gw.ncloud.com/external/v1/13477/a7cc4dff39f5b0be30aa1633d7018d166cb92dbe77299286a6163e0415dcf9fa'
    secret = '6cda3b346408460b91e6a166a7c95a9e'

    def req_upload(self, file, completion, callback=None, userdata=None, forbiddens=None, boostings=None,
                   wordAlignment=True, fullText=True, diarization=None, sed=None):

        request_body = {
            'language': 'en-US', 
            'completion': completion,
            'callback': callback,
            'userdata': userdata,
            'wordAlignment': wordAlignment,
            'fullText': fullText,
            'forbiddens': forbiddens,
            'boostings': boostings,
            'diarization': diarization,
            'sed': sed,
        }
        headers = {
            'Accept': 'application/json;UTF-8',
            'X-CLOVASPEECH-API-KEY': self.secret
        }
        print("Sending request with body:", json.dumps(request_body, ensure_ascii=False))
        
        files = {
            'media': open(file, 'rb'),
            'params': (None, json.dumps(request_body, ensure_ascii=False).encode('UTF-8'), 'application/json')
        }
        response = requests.post(headers=headers, url=self.invoke_url + '/recognizer/upload', files=files)
        return response

if __name__ == '__main__':
    script_dir = os.path.dirname(__file__) 
    file_path = os.path.join(script_dir, 'allquietonthewesternfront_10_remarque_64kb.mp3')
    
    print(f"Testing with file: {file_path}")
    
    res = ClovaSpeechClient().req_upload(file=file_path, completion='sync')
    
    print("\n--- API Response ---")
    print(res.text)

    try:
        json_res = json.loads(res.text)
        print("\n--- Formatted JSON ---")
        print(json.dumps(json_res, indent=4, ensure_ascii=False))
    except json.JSONDecodeError:
        print("Could not parse JSON response.")