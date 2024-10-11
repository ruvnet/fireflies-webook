from pydantic import BaseModel, Field
from typing import List, Dict

class WebhookPayload(BaseModel):
    meeting_id: str
    event_type: str

class IntentResponse(BaseModel):
    intent: str
    confidence: float

class OpenAIResponse(BaseModel):
    intent: str
    output: Dict

class WebhookResponse(BaseModel):
    detected_intents: List[IntentResponse] = Field(default_factory=list)
    openai_outputs: List[OpenAIResponse] = Field(default_factory=list)
