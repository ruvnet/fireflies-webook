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
import httpx
from app.config import settings

async def get_transcript(meeting_id: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.fireflies.ai/graphql",
            headers={"Authorization": f"Bearer {settings.fireflies_api_key}"},
            params={"query": f"query {{ transcript(id: \"{meeting_id}\") {{ text }} }}"}
        )
        response.raise_for_status()
        data = response.json()
        return data["data"]["transcript"]["text"]
