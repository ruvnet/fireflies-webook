interface TranscriptSummary {
  keywords: string[];
  action_items: string[];
  outline: string[];
  shorthand_bullet: string[];
  overview: string;
  bullet_gist: string[];
  gist: string;
  short_summary: string;
}

interface TranscriptResponse {
  transcript?: {
    summary: TranscriptSummary;
  };
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

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from request header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing API key'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { meetingId } = await req.json();
    if (!meetingId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing meetingId'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query Fireflies GraphQL API
    const query = `
      query Transcript($transcriptId: String!) {
        transcript(id: $transcriptId) {
          summary {
            keywords
            action_items
            outline
            shorthand_bullet
            overview
            bullet_gist
            gist
            short_summary
          }
        }
      }
    `;

    console.log('Sending request to Fireflies API with:', {
      query,
      variables: { transcriptId: meetingId }
    });

    const response = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: { transcriptId: meetingId },
      }),
    });

    const result = await response.json();
    console.log('Fireflies API response:', result);

    if (result.errors) {
      return new Response(JSON.stringify({
        success: false,
        message: result.errors[0].message
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: unknown) {
    console.error('Error fetching transcript summary:', error);

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
