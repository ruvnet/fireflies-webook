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
import openai
from app.config import settings

openai.api_key = settings.openai_api_key

async def process_intent(intent: str, transcript: str) -> dict:
    prompt = f"Based on the following intent and transcript, generate a structured output:\n\nIntent: {intent}\n\nTranscript: {transcript}\n\nStructured output:"
    
    response = openai.Completion.create(
        engine="gpt-4o-mini",
        prompt=prompt,
        max_tokens=500,
        n=1,
        stop=None,
        temperature=0.7,
    )

    return response.choices[0].text.strip()
