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
from typing import List, Tuple
import openai
from app.config import settings

openai.api_key = settings.openai_api_key

INTENTS = [
    "follow-up", "proposal", "SOW", "coding", "technical specification",
    "functional specification", "documentation", "project management",
    "product features", "tool selection"
]

def detect_intents(transcript: str) -> List[Tuple[str, float]]:
    prompt = f"Analyze the following transcript and identify the most relevant intents from this list: {', '.join(INTENTS)}. Return the intents and their confidence scores.\n\nTranscript: {transcript}"
    
    response = openai.Completion.create(
        engine="gpt-4o-mini",
        prompt=prompt,
        max_tokens=100,
        n=1,
        stop=None,
        temperature=0.5,
    )

    # Parse the response and extract intents with confidence scores
    result = response.choices[0].text.strip().split("\n")
    intents = []
    for line in result:
        parts = line.split(":")
        if len(parts) == 2:
            intent = parts[0].strip()
            confidence = float(parts[1].strip())
            intents.append((intent, confidence))

    return intents
