"""
PharmaAssist AI - AI Microservice
==================================
Standalone Python service that hosts the computer-vision medicine
recognition model (and, eventually, OCR + prescription parsing).

This is intentionally decoupled from the Spring Boot backend so the two
teams (Java full-stack vs. Python/ML) can work independently. The backend
calls this service over HTTP (see AiRecognitionClient.java).

Currently this ships with a MOCK recognizer so the full pipeline
(React -> Spring Boot -> AI service -> DB match -> response) is wired
end-to-end. Swap `mock_recognize()` for a real model (YOLO / a fine-tuned
classifier) without changing the API contract below.

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import random
from typing import Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="PharmaAssist AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mock "known medicines" the vision model has been trained on.
# Replace this with your actual trained model + label list.
# ---------------------------------------------------------------------------
KNOWN_MEDICINES = ["Amoxil 500", "Paracet 650", "Gasnil 20"]


class RecognitionResponse(BaseModel):
    medicineName: str
    confidence: float


class OcrResponse(BaseModel):
    extractedText: str
    detectedMedicines: list[str]


def mock_recognize(image_bytes: bytes) -> RecognitionResponse:
    """
    Placeholder for the real CV pipeline:
        preprocess -> model.predict(image) -> top-1 label + confidence

    TODO(ML team): replace with a real model, e.g.:
        image = preprocess(image_bytes)
        logits = model(image)
        label, confidence = postprocess(logits)
    """
    label = random.choice(KNOWN_MEDICINES)
    confidence = round(random.uniform(0.85, 0.99), 2)
    return RecognitionResponse(medicineName=label, confidence=confidence)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recognize", response_model=RecognitionResponse)
async def recognize(file: UploadFile = File(...)):
    """Core Feature 1: AI Medicine Recognition."""
    image_bytes = await file.read()
    return mock_recognize(image_bytes)


@app.post("/ocr", response_model=OcrResponse)
async def ocr(file: UploadFile = File(...)):
    """
    Core Feature 2/7: Strip OCR + Prescription OCR.
    TODO(ML team): plug in a real OCR engine (e.g. Tesseract, PaddleOCR,
    or a cloud OCR API) here. Currently returns a mock extraction.
    """
    await file.read()
    return OcrResponse(
        extractedText="Amoxil 500mg - Take 1 tablet twice daily",
        detectedMedicines=["Amoxil 500"],
    )
