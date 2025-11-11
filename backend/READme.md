Backend Setup
1. Prerequisites
Before you begin, ensure you have the following installed:
Python (3.10+ recommended)
pip
MySQL 8.0.44 https://dev.mysql.com/downloads/installer/
2. Setup Instructions
Step 1: Clone the Repository
Step 2 (Optionally): Use venv to isolate dependencies.
# Create the virtual environment
python -m venv venv

# Activate it
# On Windows (cmd.exe):
.\venv\Scripts\activate
You will need to activate this environment every time you work on the project.

Step 3: Install Dependencies
Install all required Python packages from the requirements.txt file.
pip install -r requirements.txt

Step 4: Database Setup
This project uses MySQL. You need to create the database locally.
Log in to your MySQL server.
Create the database (it must match the name in the .env file):
CREATE DATABASE chatbot_db;
The Python application will automatically create all the necessary tables (users, sessions, messages) the first time it runs.

Step 5: Create Environment File

This is the most important step for connecting the app and its services.
In the root of the backend folder, create a new file named .env
Contact me for .env file

Step 6: Run the Server

Because this project uses relative imports, you must run it as a Python module from the parent directory (the one containing the app folder).
# From the /backend directory:
python -m app.app
You should see the server start up. It will be running at:
http://127.0.0.1:8000
The Next.js frontend will now be able to make requests to this backend.