# Fireflies Webhook

This project implements a webhook endpoint for processing Fireflies transcripts, detecting intents, and generating structured outputs using OpenAI.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fireflies-webhook.git
   cd fireflies-webhook
   ```

2. Run the installation script:
   ```
   chmod +x install.sh
   ./install.sh
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Fireflies and OpenAI API keys

4. Start the server:
   ```
   chmod +x start.sh
   ./start.sh
   ```

## Usage

Send POST requests to `/api/webhook` with the following payload:

```json
{
  "meeting_id": "your_meeting_id",
  "event_type": "transcription_complete"
}
```

## Development

- Add new intents in `app/services/intent_detector.py`
- Extend OpenAI processing in `app/services/openai.py`
- Run tests: `poetry run pytest`

## Deployment

- Set up a production-grade ASGI server (e.g., Gunicorn)
- Use a reverse proxy (e.g., Nginx)
- Set up proper authentication and rate limiting

## Documentation

For more detailed documentation, please refer to the `/docs` folder.
