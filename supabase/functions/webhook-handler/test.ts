import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock data for testing
const MOCK_WEBHOOK_PAYLOAD = {
  meetingId: "test-meeting-id",
  eventType: "Transcription completed",
  clientReferenceId: "test-reference-id"
};

const MOCK_TRANSCRIPT_RESPONSE = {
  data: {
    transcript: {
      sentences: [
        {
          text: "Let's discuss the technical requirements for the new feature.",
          speaker: "John",
          startTime: 0,
          endTime: 5
        },
        {
          text: "We need to implement a new API endpoint and update the documentation.",
          speaker: "Alice",
          startTime: 6,
          endTime: 10
        }
      ]
    }
  }
};

const MOCK_OPENAI_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            type: "technical-specification",
            confidence: 0.9,
            details: {
              quotes: ["Let's discuss the technical requirements for the new feature."],
              context: "Discussion about technical requirements"
            }
          },
          {
            type: "documentation",
            confidence: 0.8,
            details: {
              quotes: ["We need to implement a new API endpoint and update the documentation."],
              context: "Documentation update required"
            }
          }
        ])
      }
    }
  ]
};

// Mock environment variables
const ENV_VARS = {
  FF_API_KEY: "test_fireflies_key",
  OPENAI_API_KEY: "test_openai_key",
  FF_URL: "http://localhost:54321",
  FF_ANON_KEY: "test_anon_key",
  FF_SERVICE_ROLE: "test_service_role",
  FF_JWT_SECRET: "test_jwt_secret"
};

// Set up environment variables before tests
for (const [key, value] of Object.entries(ENV_VARS)) {
  Deno.env.set(key, value);
}

// Mock fetch function
const originalFetch = globalThis.fetch;
const mockFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes('fireflies.ai')) {
    return new Response(JSON.stringify(MOCK_TRANSCRIPT_RESPONSE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('openai.com')) {
    return new Response(JSON.stringify(MOCK_OPENAI_RESPONSE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  // Mock Supabase response
  if (url.includes('rest/v1/meeting_data')) {
    return new Response(JSON.stringify({ id: 1 }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(null, { status: 404 });
};

// Import the handler function
const { handler } = await import("./index.ts");

// Test suite
Deno.test({
  name: "Webhook Handler Tests",
  async fn(t) {
    await t.step("should handle OPTIONS request for CORS", async () => {
      const req = new Request("http://localhost", {
        method: "OPTIONS"
      });

      const response = await handler(req);
      assertEquals(response.status, 200);
      assertExists(response.headers.get("Access-Control-Allow-Origin"));
    });

    await t.step("should reject non-POST requests", async () => {
      const req = new Request("http://localhost", {
        method: "GET"
      });

      const response = await handler(req);
      assertEquals(response.status, 405);
    });

    await t.step("should validate webhook payload", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const response = await handler(req);
      assertEquals(response.status, 400);
    });

    await t.step("should process valid webhook payload", async () => {
      // Replace global fetch with mock
      globalThis.fetch = mockFetch;

      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_WEBHOOK_PAYLOAD)
      });

      try {
        const response = await handler(req);
        assertEquals(response.status, 200);

        const data = await response.json();
        assertEquals(data.success, true);
        assertEquals(data.meeting_id, MOCK_WEBHOOK_PAYLOAD.meetingId);
        assertExists(data.intents);
        assertEquals(data.intents.length, 2);
        assertEquals(data.intents[0].type, "technical-specification");
        assertEquals(data.intents[1].type, "documentation");
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
      }
    });

    await t.step("should handle unsupported event types", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...MOCK_WEBHOOK_PAYLOAD,
          eventType: "unsupported"
        })
      });

      const response = await handler(req);
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.success, true);
      assertEquals(data.message, "Event type not supported for processing");
    });
  }
});
