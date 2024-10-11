from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class WebhookRequest(Base):
    __tablename__ = "webhook_requests"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    payload = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DetectedIntent(Base):
    __tablename__ = "detected_intents"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    intent = Column(String)
    confidence = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OpenAIOutput(Base):
    __tablename__ = "openai_outputs"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, index=True)
    intent = Column(String)
    output = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
