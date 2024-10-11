import pytest
from app.services import fireflies, openai, intent_detector

@pytest.mark.asyncio
async def test_get_transcript():
    # Mock the Fireflies API response
    meeting_id = "test_meeting"
    transcript = await fireflies.get_transcript(meeting_id)
    assert isinstance(transcript, str)
    assert len(transcript) > 0

@pytest.mark.asyncio
async def test_process_intent():
    intent = "follow-up"
    transcript = "Let's schedule a follow-up meeting next week."
    result = await openai.process_intent(intent, transcript)
    assert isinstance(result, dict)
    assert "content" in result

def test_detect_intents():
    transcript = "We need to create a project plan and timeline for the new feature development."
    intents = intent_detector.detect_intents(transcript)
    assert isinstance(intents, list)
    assert len(intents) > 0
    assert isinstance(intents[0], tuple)
    assert len(intents[0]) == 2
    assert isinstance(intents[0][0], str)
    assert isinstance(intents[0][1], float)

# Add more tests as needed
