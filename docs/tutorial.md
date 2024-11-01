# Fireflies Integration Tutorial

This tutorial explains how to set up and use the ruv bounce webhook approach with Fireflies and Supabase. The integration consists of two main components:
1. A webhook handler that receives notifications from Fireflies
2. A meeting info endpoint that retrieves detailed transcript summaries

## Overview

The integration follows this workflow:
1. Fireflies sends a webhook when a transcription is complete
2. Webhook handler validates and acknowledges the notification
3. You can then use the meeting info endpoint to fetch the detailed transcript summary

## Prerequisites

- Supabase account and project
- Fireflies.ai account with API access
- Basic understanding of webhooks and REST APIs

## Setup

### 1. Environment Variables

Create a `.env` file with your configuration:

```env
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
FIREFLIES_API_KEY=your-fireflies-api-key
```

### 2. Deploy the Functions

Use the provided deploy scripts:

```bash
# Deploy webhook handler
cd supabase/functions/webhook-handler
./deploy.sh

# Deploy meeting info endpoint
cd supabase/functions/meeting-info
./deploy.sh
```

This will:
- Run tests to verify functionality
- Deploy both functions to Supabase Edge Functions
- Output the function URLs

## Component Details

### 1. Webhook Handler

The webhook handler implements the ruv bounce approach:

#### Request Format

```json
{
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
}
```

#### Key Features

1. **Immediate Response**: Responds quickly to prevent timeouts
```typescript
return new Response(JSON.stringify({
  success: true,
  message: 'Webhook received successfully',
  data: payload
}));
```

2. **Event Type Filtering**: Only processes relevant events
```typescript
if (payload.eventType !== 'Transcription completed') {
  return new Response(JSON.stringify({
    success: true,
    message: 'Event type not supported'
  }));
}
```

3. **CORS Support**: Built-in cross-origin support
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

### 2. Meeting Info Endpoint

The meeting info endpoint retrieves detailed transcript summaries:

#### Request Format

```json
{
    "meetingId": "IQqVuslNBNQW0TIr"
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "transcript": {
      "summary": {
        "keywords": ["keyword1", "keyword2"],
        "action_items": "**User1**\nAction 1\n**User2**\nAction 2",
        "outline": ["Section 1", "Section 2"],
        "shorthand_bullet": "🔹 Point 1\n🔹 Point 2",
        "overview": "Meeting overview...",
        "bullet_gist": ["Key point 1", "Key point 2"],
        "gist": "Brief summary",
        "short_summary": "Concise summary"
      }
    }
  }
}
```

## Complete Workflow Example

1. **Set Up Webhook in Fireflies**
   ```bash
   # Your webhook URL will be:
   https://[YOUR_PROJECT_REF].functions.supabase.co/webhook-handler
   ```

2. **Receive Webhook Notification**
   ```json
   {
     "meetingId": "IQqVuslNBNQW0TIr",
     "eventType": "Transcription completed"
   }
   ```

3. **Fetch Meeting Summary**
   ```bash
   curl -X POST "https://[YOUR_PROJECT_REF].functions.supabase.co/meeting-info" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_FIREFLIES_API_KEY" \
     -d '{
       "meetingId": "IQqVuslNBNQW0TIr"
     }'
   ```

## Testing

### 1. Testing Webhook Handler

```bash
curl -X POST "https://[YOUR_PROJECT_REF].functions.supabase.co/webhook-handler" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "test-123",
    "eventType": "Transcription completed"
  }'
```

### 2. Testing Meeting Info

```bash
curl -X POST "https://[YOUR_PROJECT_REF].functions.supabase.co/meeting-info" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREFLIES_API_KEY" \
  -d '{
    "meetingId": "IQqVuslNBNQW0TIr"
  }'
```

## Best Practices

1. **Webhook Handler**
   - Respond quickly to prevent timeouts
   - Validate payload before processing
   - Log important events for debugging

2. **Meeting Info Endpoint**
   - Always include Fireflies API key
   - Handle rate limits appropriately
   - Cache responses if needed

3. **General**
   - Keep environment variables secure
   - Monitor endpoint health
   - Implement proper error handling

## Troubleshooting

Common issues and solutions:

1. **Webhook Not Receiving Events**
   - Verify webhook URL in Fireflies settings
   - Check event type matches "Transcription completed"
   - Verify payload format

2. **Meeting Info Errors**
   - Verify Fireflies API key is correct
   - Check meeting ID exists
   - Ensure proper authorization header

3. **CORS Issues**
   - Check allowed origins configuration
   - Verify request headers
   - Check browser console for errors

## Next Steps

1. Add database integration to store transcripts
2. Implement additional event types
3. Add authentication middleware
4. Set up monitoring and alerting

## Support

For issues or questions:
1. Check the troubleshooting guide above
2. Review the API documentation
3. Open an issue on GitHub
4. Contact support team

Remember to keep your API keys secure and monitor your endpoint's performance regularly.
