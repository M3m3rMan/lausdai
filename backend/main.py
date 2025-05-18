from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import openai
import os
import uuid

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# MongoDB setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client.chatbot
dialogues = db.dialogues

# FastAPI app
app = FastAPI()

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    user_id: str
    content: str
    language: str = "en"

class UpdateMessage(BaseModel):
    content: str
    language: str = "en"

@app.post("/chat/")
async def chat_with_bot(message: Message):
    try:
        prompt = f"Translate to {message.language} and respond to: {message.content}"
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        reply = response.choices[0].message["content"].strip()

        chat_id = str(uuid.uuid4())
        entry = {
            "_id": chat_id,
            "user_id": message.user_id,
            "user_message": message.content,
            "bot_reply": reply,
            "language": message.language
        }
        dialogues.insert_one(entry)
        return {"id": chat_id, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/{chat_id}")
async def get_message(chat_id: str):
    result = dialogues.find_one({"_id": chat_id})
    if result:
        result["id"] = str(result.pop("_id"))
        return result
    raise HTTPException(status_code=404, detail="Message not found")

@app.put("/chat/{chat_id}")
async def update_message(chat_id: str, update: UpdateMessage):
    result = dialogues.update_one(
        {"_id": chat_id},
        {"$set": {"user_message": update.content, "language": update.language}}
    )
    if result.modified_count == 1:
        return {"status": "updated"}
    raise HTTPException(status_code=404, detail="Message not found")

@app.delete("/chat/{chat_id}")
async def delete_message(chat_id: str):
    result = dialogues.delete_one({"_id": chat_id})
    if result.deleted_count == 1:
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Message not found")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        audio_path = f"/tmp/{file.filename}"
        with open(audio_path, "wb") as f:
            f.write(contents)

        with open(audio_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)

        return {"transcription": transcript["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
