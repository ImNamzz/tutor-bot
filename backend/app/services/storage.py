import boto3
import uuid
import os
from botocore.exceptions import ClientError
from app.core.config import Config
import tempfile

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=Config.NCP_ENDPOINT,
            aws_access_key_id=Config.NCP_ACCESS_KEY,
            aws_secret_access_key=Config.NCP_SECRET_KEY
        )
        self.bucket_name = Config.NCP_BUCKET_NAME

    def upload_file(self, file_obj, original_filename: str) -> str:
        extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else "bin"
        unique_key = f"audio-storage/{uuid.uuid4().hex}.{extension}"

        content_type = "application/octet-stream"
        if extension in ["mp3", "m4a", "wav", "aac"]:
            content_type = f"audio/{extension}"

        temp_filename = f"{uuid.uuid4().hex}.{extension}"
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, temp_filename)

        try:
            file_obj.seek(0)
            file_obj.save(temp_path)

            print(f"Uploading {temp_path} to {unique_key}...")

            self.s3_client.upload_file(
                Filename=temp_path,
                Bucket=self.bucket_name,
                Key=unique_key,
                ExtraArgs={'ContentType': content_type}
            )
            
            print(f"Successfully uploaded to {self.bucket_name}/{unique_key}")
            return unique_key
            
        except ClientError as e:
            print(f"NCP Storage Error: {e}")
            raise Exception(f"Storage Error: {str(e)}")
        except Exception as e:
            print(f"General Error during upload: {e}")
            raise e
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"Cleaned up temp file {temp_path}")


    def delete_file(self, object_name: str):
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
        except ClientError as e:
            print(f"Warning: Failed to delete file {object_name}: {e}")