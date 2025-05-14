# ========== IMPORTS ==========
import os
import shutil
import socket
import subprocess
import uuid
import atexit
import logging
from datetime import datetime
from typing import Any, Dict
import whisper # type: ignore
import numpy as np
import cv2 # type: ignore
from fastapi import FastAPI, UploadFile, File, Form, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
from deep_translator import GoogleTranslator # type: ignore

# ========== SETTINGS ==========
UPLOAD_DIR = "uploads"
DEBUG_DIR = "debug"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DEBUG_DIR, exist_ok=True)

# ========== LOGGING ==========
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SpeechTranslationAPI")

# ========== FASTAPI INIT ==========
app = FastAPI(
    title="Bridge - Speech Translation API",
    description="Upload a video, transcribe it, and translate between any languages!",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== LOAD WHISPER MODEL ==========
try:
    model = whisper.load_model("base")
    logger.info("✅ Whisper model loaded successfully!")
except Exception as e:
    logger.error(f"❌ Failed to load Whisper model: {e}")
    raise e

# ========== TEMP FILES ==========
temp_files = []

def register_temp_file(path: str):
    temp_files.append(path)

@atexit.register
def cleanup_temp_files():
    for path in temp_files:
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"🧹 Deleted temp file: {path}")

# ========== HELPERS ==========
class PredictionResponse(BaseModel):
    transcript: str
    translation: str

def save_upload(file: UploadFile) -> str:
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    register_temp_file(filepath)
    return filepath

# ========== ROUTES ==========
@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...), target_language: str = Form("es")):
    try:
        video_path = save_upload(file)

        # Transcribe
        result = model.transcribe(video_path)
        transcript = result["text"].strip()
        logger.info(f"📝 Transcript: {transcript}")

        if not transcript:
            raise HTTPException(status_code=400, detail="Could not extract any speech from the video.")

        # Normalize language name to code if needed
        try:
            language_code = GoogleTranslator().get_supported_languages(as_dict=True).get(target_language.lower())
            if not language_code:
                # If not found, assume it's already a code like 'es', 'en', 'tl'
                language_code = target_language.lower()
        except Exception as e:
            logger.error(f"Failed to find language code for '{target_language}': {e}")
            raise HTTPException(status_code=400, detail=f"Unsupported language '{target_language}'.")

        # Translate
        translated_text = GoogleTranslator(source='auto', target=language_code).translate(transcript)
        logger.info(f"🌍 Translation ({language_code}): {translated_text}")

        return PredictionResponse(
            transcript=transcript,
            translation=translated_text,
        )
    except Exception as e:
        logger.error(f"❌ Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "🗣️ Bridge Speech-to-Text & Translation API is live!"}