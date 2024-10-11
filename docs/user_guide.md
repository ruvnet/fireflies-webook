# Fireflies Webhook User Guide

## Introduction

This guide provides instructions on how to use and interact with the Fireflies Webhook application. The webhook processes Fireflies transcripts, detects intents, and generates structured outputs using OpenAI.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fireflies-webhook.git
   cd fireflies-webhook
   ```

2. Install dependencies:
   ```
   ./install.sh
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Fireflies and OpenAI API keys

4. Start the server:
   ```
   uvicorn app.main:app --reload
   ```

## Using the Webhook

The main endpoint for the webhook is `/api/webhook`. To use it:

1. Send a POST request to `http://your-server-address/api/webhook`
2. Include the following JSON payload:
   ```json
   {
     "meeting_id": "your_meeting_id",
     "event_type": "transcription_complete"
   }
   ```

3. The webhook will process the request and return a response with detected intents and OpenAI outputs.

## Interpreting Results

The webhook response will include:

1. Detected intents: A list of intents found in the transcript, along with confidence scores.
2. OpenAI outputs: Structured data generated based on the detected intents.

## Troubleshooting

If you encounter issues:

1. Check the logs for error messages
2. Verify your API keys are correct in the `.env` file
3. Ensure your database is properly set up and migrated

For more detailed information, refer to the API documentation.

## Extending the Webhook

To add new intents or modify existing ones, edit the `INTENT_DICTIONARY` in `app/services/intent_detector.py`.

To change the OpenAI model or modify the prompt, update the `process_intent` function in `app/services/openai.py`.

Remember to run tests after making changes:
```
pytest
```

## Support

For additional support or to report issues, please open an issue on the GitHub repository.
# User Guide

## Getting Started

1. Ensure you have set up your environment variables in the `.env` file.
2. Start the server using the `start.sh` script.

## Sending Webhook Requests

To process a transcript, send a POST request to the `/api/webhook` endpoint with the following JSON payload:

```json
{
  "meeting_id": "your_meeting_id",
  "event_type": "transcription_complete"
}
```

Replace `your_meeting_id` with the actual meeting ID from Fireflies.

## Interpreting the Response

The webhook will respond with detected intents and generated outputs:

```json
{
  "meeting_id": "your_meeting_id",
  "intents": [
    {
      "intent": "follow-up",
      "confidence": 0.85
    },
    {
      "intent": "project management",
      "confidence": 0.72
    }
  ],
  "outputs": [
    {
      "intent": "follow-up",
      "output": "Generated follow-up content..."
    },
    {
      "intent": "project management",
      "output": "Generated project management content..."
    }
  ]
}
```

## Troubleshooting

- If you encounter authentication errors, ensure your API key is correctly set in the `.env` file.
- For other issues, check the `app.log` file for detailed error messages.

## Extending the Application

To add new intents or modify existing ones, edit the `INTENTS` list in `app/services/intent_detector.py`.

To customize the OpenAI output generation, modify the `process_intent` function in `app/services/openai.py`.
