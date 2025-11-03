from fastapi import FastAPI

app = FastAPI(title="tutor bot backend")

@app.get("/ping")
async def ping():
    return {"status": "good"}