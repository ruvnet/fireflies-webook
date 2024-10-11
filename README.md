# Fireflies Webhook

This specification provides a comprehensive structure for the webhook endpoint system, including intent detection, OpenAI integration, and database management. The modular design allows for easy extension and maintenance of the system.

```
fireflies-webhook/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── intents.py
│   ├── database.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints.py
│   │   └── dependencies.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── fireflies.py
│   │   ├── openai_service.py
│   │   └── intent_processor.py
│   └── utils/
│       ├── __init__.py
│       └── logger.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── __init__.py
│   ├── test_main.py
│   ├── test_intents.py
│   └── test_services.py
├── .env.example
├── alembic.ini
├── pyproject.toml
├── README.md
└── setup.py
```

Now, let's break down the key components and their functionalities:

## 1. app/main.py

This is the entry point of the FastAPI application. It sets up the FastAPI app, includes router from `api/endpoints.py`, and configures middleware for security and logging.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.config import settings
from app.database import engine, Base

app = FastAPI(title="Fireflies Webhook", version="1.0.0")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

# Create database tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 2. app/models.py

Define Pydantic models for request/response schemas and SQLAlchemy models for database tables.

```python
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from datetime import datetime

Base = declarative_base()

class WebhookRequest(Base):
    __tablename__ = "webhook_requests"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    payload = Column(JSON)

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    content = Column(String)
    processed_at = Column(DateTime, default=datetime.utcnow)

class DetectedIntent(Base):
    __tablename__ = "detected_intents"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    intent = Column(String)
    confidence = Column(Float)
    detected_at = Column(DateTime, default=datetime.utcnow)

class OpenAIOutput(Base):
    __tablename__ = "openai_outputs"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    intent = Column(String)
    output = Column(JSON)
    generated_at = Column(DateTime, default=datetime.utcnow)

# Pydantic models for request/response
class WebhookPayload(BaseModel):
    meeting_id: str
    event_type: str
    client_reference_id: str

class IntentResponse(BaseModel):
    intent: str
    confidence: float

class OpenAIResponse(BaseModel):
    intent: str
    output: dict
```

## 3. app/intents.py

Define the intent detection logic and dictionary of intents.

```python
from typing import List, Tuple

INTENT_DICTIONARY = {
    "follow-up": ["follow up", "check in", "touch base"],
    "proposal": ["proposal", "offer", "quote"],
    "sow": ["statement of work", "scope of work", "SOW"],
    "coding": ["code", "programming", "development"],
    "technical_specification": ["technical spec", "tech spec", "architecture"],
    "functional_specification": ["functional spec", "requirements", "user stories"],
    "documentation": ["document", "manual", "guide"],
    "project_management": ["project plan", "timeline", "milestones"],
    "product_features": ["feature", "functionality", "capability"],
    "tool_selection": ["tool", "software", "platform"]
}

def detect_intents(transcript: str) -> List[Tuple[str, float]]:
    detected_intents = []
    for intent, keywords in INTENT_DICTIONARY.items():
        confidence = sum(keyword.lower() in transcript.lower() for keyword in keywords) / len(keywords)
        if confidence > 0:
            detected_intents.append((intent, confidence))
    return sorted(detected_intents, key=lambda x: x[1], reverse=True)
```

## 4. app/database.py

Set up SQLAlchemy engine and session management.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = f"sqlite:///{settings.DATABASE_NAME}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## 5. app/config.py

Configuration management using Pydantic BaseSettings.

```python
from pydantic import BaseSettings

class Settings(BaseSettings):
    FIREFLIES_API_KEY: str
    OPENAI_API_KEY: str
    DATABASE_NAME: str = "fireflies_webhook.db"
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
```

## 6. app/api/endpoints.py

Define the FastAPI routes for the webhook endpoint.

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import WebhookPayload, IntentResponse, OpenAIResponse
from app.services import fireflies, openai_service, intent_processor
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
        detected_intents = intent_processor.detect_intents(transcript)
        for intent, confidence in detected_intents:
            db_intent = models.DetectedIntent(meeting_id=payload.meeting_id, intent=intent, confidence=confidence)
            db.add(db_intent)
        db.commit()

        # Process with OpenAI for each detected intent
        openai_responses = []
        for intent, _ in detected_intents:
            openai_output = await openai_service.process_intent(intent, transcript)
            db_output = models.OpenAIOutput(meeting_id=payload.meeting_id, intent=intent, output=openai_output)
            db.add(db_output)
            openai_responses.append(OpenAIResponse(intent=intent, output=openai_output))
        db.commit()

        return openai_responses

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## 7. app/services/fireflies.py

Service to interact with the Fireflies API.

```python
import httpx
from app.config import settings
from app.utils.logger import logger

async def get_transcript(meeting_id: str) -> str:
    url = f"https://api.fireflies.ai/graphql"
    headers = {
        "Authorization": f"Bearer {settings.FIREFLIES_API_KEY}",
        "Content-Type": "application/json"
    }
    query = """
    query ($meetingId: ID!) {
        transcript(id: $meetingId) {
            text
        }
    }
    """
    variables = {"meetingId": meeting_id}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json={"query": query, "variables": variables}, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["data"]["transcript"]["text"]
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred while fetching transcript: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error occurred while fetching transcript: {str(e)}")
            raise
```

## 8. app/services/openai_service.py

Service to interact with OpenAI API using LiteLLM.

```python
from litellm import completion
from app.config import settings
from app.utils.logger import logger

async def process_intent(intent: str, transcript: str) -> dict:
    prompt = f"Based on the following transcript and detected intent '{intent}', generate a structured output:\n\n{transcript}"
    
    try:
        response = completion(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error processing intent with OpenAI: {str(e)}")
        raise
```

## 9. app/utils/logger.py

Set up logging configuration.

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

## 10. alembic/env.py and alembic/versions/

Set up Alembic for database migrations. Initialize with:

```
alembic init alembic
```

Then modify `alembic/env.py` to use your SQLAlchemy models.

## 11. tests/

Create unit tests for your application components.

## 12. .env.example

```
FIREFLIES_API_KEY=your_fireflies_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_NAME=fireflies_webhook.db
```

## 13. pyproject.toml

```toml
[tool.poetry]
name = "fireflies-webhook"
version = "0.1.0"
description = "Webhook endpoint for Fireflies transcripts with intent detection"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.68.0"
uvicorn = "^0.15.0"
sqlalchemy = "^1.4.23"
alembic = "^1.7.1"
httpx = "^0.19.0"
python-dotenv = "^0.19.0"
litellm = "^0.1.1"

[tool.poetry.dev-dependencies]
pytest = "^6.2.5"
pytest-asyncio = "^0.15.1"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

## 14. README.md

```markdown
# Fireflies Webhook

This project implements a webhook endpoint for processing Fireflies transcripts, detecting intents, and generating structured outputs using OpenAI.

## Setup

1. Clone the repository
2. Install dependencies: `poetry install`
3. Copy `.env.example` to `.env` and fill in your API keys
4. Run database migrations: `alembic upgrade head`
5. Start the server: `uvicorn app.main:app --reload`

## Usage

Send POST requests to `/api/webhook` with the following payload:

```json
{
  "meeting_id": "your_meeting_id",
  "event_type": "transcription_complete",
  "client_reference_id": "your_reference_id"
}
```

## Development

- Add new intents in `app/intents.py`
- Extend OpenAI processing in `app/services/openai_service.py`
- Run tests: `pytest`

## Deployment

- Set up a production-grade ASGI server (e.g., Gunicorn)
- Use a reverse proxy (e.g., Nginx)
- Set up proper authentication and rate limiting
 
