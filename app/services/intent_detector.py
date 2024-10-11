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
