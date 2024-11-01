# Fireflies Webhook Integration API Documentation

## Overview

This API provides two main endpoints:
1. A webhook endpoint for receiving Fireflies.ai transcription events
2. A meeting info endpoint for retrieving detailed transcript summaries

## Base URLs

Both endpoints are available at: `https://[YOUR_PROJECT_REF].functions.supabase.co/`

## Endpoints

### 1. POST /webhook-handler

Receives webhook notifications from Fireflies when transcriptions are completed.

#### Request

- Method: POST
- Content-Type: application/json

##### Payload Structure

```json
{
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| meetingId | String | Yes | Identifier for the meeting/transcript |
| eventType | String | Yes | Type of event (e.g., "Transcription completed") |
| clientReferenceId | String | No | Custom identifier set during upload |

#### Response

```json
{
  "success": true,
  "message": "Webhook received successfully",
  "data": {
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
  }
}
```

### 2. POST /meeting-info

Retrieves detailed transcript summary for a specific meeting.

#### Request

- Method: POST
- Content-Type: application/json
- Authorization: Bearer YOUR_FIREFLIES_API_KEY

##### Payload Structure

```json
{
    "meetingId": "IQqVuslNBNQW0TIr"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| meetingId | String | Yes | Identifier for the meeting to retrieve |

#### Response

```json
{
  "success": true,
  "data": {
    "transcript": {
      "summary": {
        "keywords": ["AI models", "geo-arbitrage", "context windows"],
        "action_items": "**User1**\nAction 1 (timestamp)\n\n**User2**\nAction 2 (timestamp)",
        "outline": ["Section 1", "Section 2"],
        "shorthand_bullet": "🔹 Point 1\n🔹 Point 2",
        "overview": "Detailed meeting overview...",
        "bullet_gist": ["Key point 1", "Key point 2"],
        "gist": "Brief meeting summary",
        "short_summary": "Concise meeting summary"
      }
    }
  }
}
```

## Authentication

### Webhook Handler
No authentication required - designed to receive Fireflies webhooks.

### Meeting Info Endpoint
Requires Fireflies API key in Authorization header:
```
Authorization: Bearer YOUR_FIREFLIES_API_KEY
```

## Error Responses

Both endpoints use standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid payload or missing required fields |
| 401 | Unauthorized - Missing or invalid API key (meeting-info only) |
| 405 | Method Not Allowed - Only POST requests are supported |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Examples

### 1. Webhook Handler Example

```bash
curl -X POST "https://[YOUR_PROJECT_REF].functions.supabase.co/webhook-handler" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
  }'
```

### 2. Meeting Info Example

```bash
curl -X POST "https://[YOUR_PROJECT_REF].functions.supabase.co/meeting-info" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREFLIES_API_KEY" \
  -d '{
    "meetingId": "IQqVuslNBNQW0TIr"
  }'
```

## Rate Limiting

Both endpoints are subject to Supabase Edge Functions rate limits. Additionally, the meeting-info endpoint is subject to Fireflies API rate limits.

## Support

For additional support:
1. Check the [Tutorial](./tutorial.md) for detailed setup and usage instructions
2. Review the [Fireflies Webhook Documentation](https://docs.fireflies.ai/graphql-api/webhooks)
3. Review the [Fireflies GraphQL API Documentation](https://docs.fireflies.ai/graphql-api/query/transcript)
4. Open an issue on our GitHub repository
5. Contact our support team

## See Also

- [Tutorial](./tutorial.md) - Detailed guide on setting up and using both endpoints
- [Fireflies API Documentation](https://docs.fireflies.ai) - Official Fireflies API documentation
- [Supabase Documentation](https://supabase.com/docs) - Supabase platform documentation
