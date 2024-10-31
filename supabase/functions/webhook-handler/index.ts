// Constants for intent types
const INTENT_TYPES = {
  FOLLOW_UP: 'follow-up',
  PROPOSAL: 'proposal',
  SOW: 'sow',
  CODING: 'coding',
  TECH_SPEC: 'technical-specification',
  FUNC_SPEC: 'functional-specification',
  DOCUMENTATION: 'documentation',
  PROJECT_MGMT: 'project-management',
  PRODUCT_FEATURES: 'product-features',
  TOOL_SELECTION: 'tool-selection',
} as const;

// Types for Fireflies webhook payload
interface WebhookPayload {
  meetingId: string;
  eventType: string;
  clientReferenceId?: string;
}

// Types for our intent detection
interface Intent {
  type: keyof typeof INTENT_TYPES;
  confidence: number;
  details: Record<string, any>;
}

// Types for transcript data
interface Sentence {
  text: string;
  speaker: string;
  startTime: number;
  endTime: number;
}

interface Transcript {
  sentences: Sentence[];
}

// Configuration and environment variables
const config = {
  fireflies: {
    apiKey: Deno.env.get("FF_API_KEY"),
    apiUrl: "https://api.fireflies.ai/graphql",
  },
  openai: {
    apiKey: Deno.env.get("OPENAI_API_KEY"),
    model: "gpt-4",
    apiUrl: "https://api.openai.com/v1/chat/completions",
  },
  supabase: {
    url: Deno.env.get("FF_URL"),
    anonKey: Deno.env.get("FF_ANON_KEY"),
    serviceRole: Deno.env.get("FF_SERVICE_ROLE"),
    jwtSecret: Deno.env.get("FF_JWT_SECRET"),
  },
};

// Validate environment variables
function validateConfig(): void {
  const required = [
    ["FF_API_KEY", config.fireflies.apiKey],
    ["OPENAI_API_KEY", config.openai.apiKey],
    ["FF_URL", config.supabase.url],
    ["FF_ANON_KEY", config.supabase.anonKey],
    ["FF_SERVICE_ROLE", config.supabase.serviceRole],
    ["FF_JWT_SECRET", config.supabase.jwtSecret],
  ];

  const missing = required.filter(([_, value]) => !value);
  if (missing.length > 0) {
    const missingVar = missing[0][0]; // Get first missing variable
    throw new Error(`Missing required environment variable: ${missingVar}`);
  }
}

async function fetchTranscript(meetingId: string): Promise<Transcript> {
  const query = `
    query GetTranscript($meetingId: String!) {
      transcript(meetingId: $meetingId) {
        sentences {
          text
          speaker
          startTime
          endTime
        }
      }
    }
  `;

  const response = await fetch(config.fireflies.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.fireflies.apiKey}`,
    },
    body: JSON.stringify({
      query,
      variables: { meetingId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL Error: ${result.errors[0].message}`);
  }

  return result.data.transcript;
}

async function detectIntents(transcript: Transcript): Promise<Intent[]> {
  // Handle empty transcript
  if (!transcript.sentences || transcript.sentences.length === 0) {
    console.log('Empty transcript detected, returning no intents');
    return [];
  }

  // Prepare transcript text for analysis
  const transcriptText = transcript.sentences
    .map(s => `${s.speaker}: ${s.text}`)
    .join('\n');

  // If transcript text is empty after processing, return no intents
  if (!transcriptText.trim()) {
    console.log('No valid text content in transcript, returning no intents');
    return [];
  }

  const response = await fetch(config.openai.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an intent detection system. Analyze the meeting transcript and identify the following intents:
            ${Object.values(INTENT_TYPES).map(type => `- ${type}`).join('\n')}
            
            For each detected intent, provide:
            1. The type of intent
            2. A confidence score (0-1)
            3. Supporting details including relevant quotes and context
            
            Return the results as a JSON array of objects with 'type', 'confidence', and 'details'.
            If no clear intents are detected, return an empty array.`
        },
        {
          role: 'user',
          content: transcriptText
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to detect intents: ${response.statusText}`);
  }

  const result = await response.json();
  const intents = JSON.parse(result.choices[0].message.content);

  // Validate intents structure and filter out low confidence scores
  return intents.filter((intent: Intent) => {
    return (
      typeof intent.type === 'string' &&
      typeof intent.confidence === 'number' &&
      intent.confidence >= 0.5 && // Filter out low confidence intents
      intent.details &&
      Object.prototype.hasOwnProperty.call(INTENT_TYPES, intent.type.toUpperCase().replace(/-/g, '_'))
    );
  });
}

async function storeData(data: {
  meeting_id: string;
  client_reference_id?: string;
  transcript: Transcript;
  intents: Intent[];
  processed_at: string;
}) {
  // Store data in Supabase using REST API
  const response = await fetch(`${config.supabase.url}/rest/v1/meeting_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.supabase.serviceRole!,
      'Authorization': `Bearer ${config.supabase.serviceRole!}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to store data: ${error.message || response.statusText}`);
  }
}

// Main webhook handler
export async function handler(req: Request): Promise<Response> {
  try {
    validateConfig();

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
        message: 'Invalid webhook payload'
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
    
    // Fetch transcript from Fireflies
    const transcript = await fetchTranscript(payload.meetingId);

    // Detect intents using OpenAI
    const intents = await detectIntents(transcript);

    // Store data in Supabase
    await storeData({
      meeting_id: payload.meetingId,
      client_reference_id: payload.clientReferenceId,
      transcript,
      intents,
      processed_at: new Date().toISOString(),
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed successfully',
      meeting_id: payload.meetingId,
      intents,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return new Response(JSON.stringify({
      success: false,
      message: errorMessage,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Start the server
Deno.serve(handler);
