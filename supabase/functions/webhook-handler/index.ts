// Types for Fireflies webhook payload
interface WebhookPayload {
  meetingId: string;
  eventType: string;
  clientReferenceId?: string;
}

// Main webhook handler
export async function handler(req: Request): Promise<Response> {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate webhook payload
    const payload: WebhookPayload = await req.json();

    if (!payload.meetingId || !payload.eventType) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid webhook payload: missing required fields'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only process completed transcriptions
    if (payload.eventType !== 'Transcription completed') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Event type not supported for processing',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process the webhook
    console.log(`Processing meeting: ${payload.meetingId}`);
    
    // For now, just echo back the received data
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook received successfully',
      data: payload
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);

    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Only start the server if we're not in a test environment
if (!Deno.env.get("DENO_TEST")) {
  Deno.serve(handler);
}
