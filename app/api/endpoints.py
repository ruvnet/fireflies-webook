from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models
from app.schemas import WebhookPayload, IntentResponse, OpenAIResponse
from app.services import fireflies, openai, intent_detector
from app.database import get_db
from app.utils.logger import logger

router = APIRouter()

@router.post("/webhook", response_model=List[OpenAIResponse])
async def webhook_endpoint(payload: WebhookPayload, db: Session = Depends(get_db)):
    try:
        # Log and save webhook request
        logger.info(f"Received webhook for meeting: {payload.meeting_id}")
        db_request = models.WebhookRequest(meeting_id=payload.meeting_id, payload=payload.dict())
        db.add(db_request)
        db.commit()

        # Fetch transcript from Fireflies API
        transcript = await fireflies.get_transcript(payload.meeting_id)
        db_transcript = models.Transcript(meeting_id=payload.meeting_id, content=transcript)
        db.add(db_transcript)
        db.commit()

        # Detect intents
        detected_intents = intent_detector.detect_intents(transcript)
        for intent, confidence in detected_intents:
            db_intent = models.DetectedIntent(meeting_id=payload.meeting_id, intent=intent, confidence=confidence)
            db.add(db_intent)
        db.commit()

        # Process with OpenAI for each detected intent
        openai_responses = []
        for intent, _ in detected_intents:
            openai_output = await openai.process_intent(intent, transcript)
            db_output = models.OpenAIOutput(meeting_id=payload.meeting_id, intent=intent, output=openai_output)
            db.add(db_output)
            openai_responses.append(OpenAIResponse(intent=intent, output=openai_output))
        db.commit()

        return openai_responses

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
