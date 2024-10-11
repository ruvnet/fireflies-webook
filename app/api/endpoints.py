from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app import models
from app.schemas import WebhookPayload, WebhookResponse, IntentResponse, OpenAIResponse
from app.services import fireflies, openai, intent_detector
from app.database import get_db
from app.utils.logger import logger

router = APIRouter()

async def process_webhook(payload: WebhookPayload, db: Session):
    try:
        # Fetch transcript from Fireflies API
        transcript = await fireflies.get_transcript(payload.meeting_id)
        db_transcript = models.Transcript(meeting_id=payload.meeting_id, content=transcript)
        db.add(db_transcript)
        db.commit()

        # Detect intents
        detected_intents = intent_detector.detect_intents(transcript)
        intent_responses = []
        for intent, confidence in detected_intents:
            db_intent = models.DetectedIntent(meeting_id=payload.meeting_id, intent=intent, confidence=confidence)
            db.add(db_intent)
            intent_responses.append(IntentResponse(intent=intent, confidence=confidence))
        db.commit()

        # Process with OpenAI for each detected intent
        openai_responses = []
        for intent, _ in detected_intents:
            openai_output = await openai.process_intent(intent, transcript)
            db_output = models.OpenAIOutput(meeting_id=payload.meeting_id, intent=intent, output=openai_output)
            db.add(db_output)
            openai_responses.append(OpenAIResponse(intent=intent, output=openai_output))
        db.commit()

        logger.info(f"Webhook processing completed for meeting: {payload.meeting_id}")
        return WebhookResponse(detected_intents=intent_responses, openai_outputs=openai_responses)

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        db.rollback()
        raise

@router.post("/webhook", response_model=WebhookResponse)
async def webhook_endpoint(payload: WebhookPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        # Log and save webhook request
        logger.info(f"Received webhook for meeting: {payload.meeting_id}")
        db_request = models.WebhookRequest(meeting_id=payload.meeting_id, payload=payload.dict())
        db.add(db_request)
        db.commit()

        # Process webhook in the background
        background_tasks.add_task(process_webhook, payload, db)

        return WebhookResponse(detected_intents=[], openai_outputs=[])

    except Exception as e:
        logger.error(f"Error initiating webhook process: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import WebhookRequest, WebhookResponse
from app.services import fireflies, intent_detector, openai
from app.models import WebhookRequest as DBWebhookRequest, Transcript, DetectedIntent, OpenAIOutput

router = APIRouter()

@router.post("/webhook", response_model=WebhookResponse)
async def webhook(request: WebhookRequest, db: Session = Depends(get_db)):
    # Save webhook request
    db_request = DBWebhookRequest(meeting_id=request.meeting_id, event_type=request.event_type)
    db.add(db_request)
    db.commit()

    # Get transcript
    transcript = await fireflies.get_transcript(request.meeting_id)
    db_transcript = Transcript(meeting_id=request.meeting_id, content=transcript)
    db.add(db_transcript)
    db.commit()

    # Detect intents
    intents = intent_detector.detect_intents(transcript)
    db_intents = [DetectedIntent(meeting_id=request.meeting_id, intent=intent, confidence=confidence)
                  for intent, confidence in intents]
    db.add_all(db_intents)
    db.commit()

    # Generate OpenAI outputs
    outputs = []
    for intent, _ in intents:
        output = await openai.process_intent(intent, transcript)
        db_output = OpenAIOutput(meeting_id=request.meeting_id, intent=intent, output=str(output))
        db.add(db_output)
        outputs.append(OpenAIResponse(intent=intent, output=str(output)))
    db.commit()

    return WebhookResponse(
        meeting_id=request.meeting_id,
        intents=[IntentResponse(intent=intent, confidence=confidence) for intent, confidence in intents],
        outputs=outputs
    )
