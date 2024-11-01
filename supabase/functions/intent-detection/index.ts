// Types from spec
interface IntentDetectionPayload {
  meetingId: string;
  transcriptionText: string;
  participants: string[];
  metadata: {
    duration: number;
    date: string;
  }
}

interface DetectedIntent {
  type: string;
  confidence: number;
  segment: {
    text: string;
    timestamp: number;
    speaker: string;
  }
  metadata: {
    context: string[];
    entities: string[];
  }
}

// OpenAI prompt template from spec
const INTENT_DETECTION_PROMPT = `
Analyze the following meeting segment and identify any specific intents:
[SEGMENT]

Classify the intent into one of the following categories:
- Task Assignment
- Follow-up Required
- Decision Made
- Question Asked
- Commitment Made
- Meeting Scheduled

For each intent detected:
1. Specify the intent type
2. Extract relevant entities
3. Identify the key action items
4. Determine the level of confidence
5. Note any dependencies or context

Provide the analysis in a structured JSON format matching this TypeScript interface:

interface DetectedIntent {
  type: string;          // One of the categories above
  confidence: number;    // Between 0 and 1
  segment: {
    text: string;        // The relevant text segment
    timestamp: number;   // Set to 0 if not available
    speaker: string;     // Set to "unknown" if not available
  }
  metadata: {
    context: string[];   // Related context snippets
    entities: string[];  // Named entities involved
  }
}

Return an array of DetectedIntent objects.
`;

async function detectIntents(segment: string): Promise<DetectedIntent[]> {
  try {
    const prompt = INTENT_DETECTION_PROMPT.replace('[SEGMENT]', segment);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an AI trained to detect intents in meeting transcripts."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as DetectedIntent[];
  } catch (error) {
    if (!Deno.env.get("DENO_TEST")) {
      console.error('Error detecting intents:', error);
    }
    throw error;
  }
}

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

    // Validate request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse and validate payload
    const payload: IntentDetectionPayload = await req.json();
    if (!payload.meetingId || !payload.transcriptionText) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid payload: missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Split text into segments (simplified for example)
    const segments = payload.transcriptionText.split('\n\n').filter(Boolean);
    
    // Process each segment
    const allIntents: DetectedIntent[] = [];
    for (const segment of segments) {
      const intents = await detectIntents(segment);
      if (Array.isArray(intents)) {
        allIntents.push(...intents);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Intents detected successfully',
      data: {
        meetingId: payload.meetingId,
        intentsCount: allIntents.length,
        intents: allIntents
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    if (!Deno.env.get("DENO_TEST")) {
      console.error('Error in intent detection:', error);
    }
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Start server if not in test environment
if (!Deno.env.get("DENO_TEST")) {
  Deno.serve(handler);
}
