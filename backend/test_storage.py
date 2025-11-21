import sys
import os
import requests
import json

# 1. SETUP YOUR CREDENTIALS HERE MANUALLY FOR TESTING
# (Copy these exactly from your .env file to rule out loading errors)
INVOKE_URL = "https://clovaspeech-gw.ncloud.com/external/v1/13477/a7cc4dff39f5b0be30aa1633d7018d166cb92dbe77299286a6163e0415dcf9fa"  # e.g., https://clovaspeech-gw.ncloud.com/...
SECRET_KEY = "ff0034108c9b414d9c53ebb6303ca80d" 
BUCKET_FILE_KEY = "audio-storage/Download.mp4" # Change this to exactly match your file (e.g. 'speech-input/Download.mp4')

def debug_request():
    print(f"--- Debugging Clova Speech ---")
    print(f"Target File: {BUCKET_FILE_KEY}")
    
    # Ensure URL ends with object-storage
    url = INVOKE_URL.rstrip('/') + '/recognizer/object-storage'
    
    headers = {
        'Accept': 'application/json;UTF-8',
        'Content-Type': 'application/json;UTF-8',
        'X-CLOVASPEECH-API-KEY': SECRET_KEY
    }
    
    body = {
        'dataKey': BUCKET_FILE_KEY,
        'language': 'en-US',
        'completion': 'sync',
        'wordAlignment': True,
        'fullText': True
    }

    try:
        print(f"Sending request to: {url}")
        response = requests.post(url, headers=headers, data=json.dumps(body))
        
        print(f"Status Code: {response.status_code}")
        print("--- SERVER RESPONSE (Read this carefully) ---")
        print(response.text)  # <--- This contains the real error reason
        print("-------------------------------------------")
        
    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    debug_request()