import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock data for testing
const MOCK_WEBHOOK_PAYLOAD = {
  meetingId: "test-meeting-id",
  eventType: "Transcription completed",
  clientReferenceId: "test-reference-id"
};

// Mock transcript with clear intents
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

// Mock empty transcript
const MOCK_EMPTY_TRANSCRIPT_RESPONSE = {
  data: {
    transcript: {
      sentences: []
    }
  }
};

const MOCK_OPENAI_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            type: "TECH_SPEC",
            confidence: 0.9,
            details: {
              quotes: ["Let's discuss the technical requirements for the new feature."],
              context: "Discussion about technical requirements"
            }
          }
        ])
      }
    }
  ]
};

// Mock empty transcript OpenAI response
const MOCK_EMPTY_OPENAI_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify([])
      }
    }
  ]
};

// Required environment variables
const REQUIRED_ENV_VARS = [
  'FF_API_KEY',
  'OPENAI_API_KEY',
  'FF_URL',
  'FF_ANON_KEY',
  'FF_SERVICE_ROLE',
  'FF_JWT_SECRET'
] as const;

// Mock environment variables
const ENV_VARS: Record<string, string> = {
  FF_API_KEY: "test_fireflies_key",
  OPENAI_API_KEY: "test_openai_key",
  FF_URL: "http://localhost:54321",
  FF_ANON_KEY: "test_anon_key",
  FF_SERVICE_ROLE: "test_service_role",
  FF_JWT_SECRET: "test_jwt_secret"
};

// Helper function to set environment variables
const setEnvVars = (vars: Record<string, string>) => {
  for (const [key, value] of Object.entries(vars)) {
    Deno.env.set(key, value);
  }
};

// Helper function to clear environment variables
const clearEnvVars = () => {
  for (const key of REQUIRED_ENV_VARS) {
    Deno.env.delete(key);
  }
};

// Mock fetch function with transcript type parameter
const createMockFetch = (transcriptType: 'valid' | 'empty') => {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('fireflies.ai')) {
      return new Response(JSON.stringify(
        transcriptType === 'valid' ? MOCK_TRANSCRIPT_RESPONSE : MOCK_EMPTY_TRANSCRIPT_RESPONSE
      ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('openai.com')) {
      return new Response(JSON.stringify(
        transcriptType === 'valid' ? MOCK_OPENAI_RESPONSE : MOCK_EMPTY_OPENAI_RESPONSE
      ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('rest/v1/meeting_data')) {
      return new Response(JSON.stringify({ id: 1 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(null, { status: 404 });
  };
};

// Store original fetch for cleanup
const originalFetch = globalThis.fetch;

// Test suite for environment configuration
Deno.test({
  name: "Environment Configuration Tests",
  async fn(t) {
    await t.step("should validate all required environment variables are present", async () => {
      // Set all required environment variables
      setEnvVars(ENV_VARS);

      // Set up mock fetch
      globalThis.fetch = createMockFetch('valid');

      try {
        // Import handler after setting environment variables
        const { handler } = await import("./index.ts");

        const req = new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(MOCK_WEBHOOK_PAYLOAD)
        });

        const response = await handler(req);
        assertEquals(response.status, 200);
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
        // Clean up
        clearEnvVars();
      }
    });

    await t.step("should throw error when environment variables are missing", async () => {
      // Set only some variables, omitting FF_API_KEY
      const partialEnvVars: Record<string, string> = {};
      Object.entries(ENV_VARS).forEach(([key, value]) => {
        if (key !== 'FF_API_KEY') {
          partialEnvVars[key] = value;
        }
      });
      setEnvVars(partialEnvVars);

      try {
        // Import handler after setting environment variables
        const { handler } = await import("./index.ts");

        const req = new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(MOCK_WEBHOOK_PAYLOAD)
        });

        const response = await handler(req);
        assertEquals(response.status, 500);

        const data = await response.json();
        assertEquals(data.success, false);
        assertEquals(data.message, "Missing required environment variable: FF_API_KEY");
      } finally {
        // Clean up
        clearEnvVars();
      }
    });
  }
});

// Test suite for webhook handler
Deno.test({
  name: "Webhook Handler Tests",
  async fn(t) {
    // Set up environment variables before all tests
    setEnvVars(ENV_VARS);

    // Import handler after setting environment variables
    const { handler } = await import("./index.ts");

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

    await t.step("should process valid transcript with clear intents", async () => {
      // Replace global fetch with mock for valid transcript
      globalThis.fetch = createMockFetch('valid');

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
        assertEquals(data.intents.length, 1);
        assertEquals(data.intents[0].type, "TECH_SPEC");
        assertEquals(data.intents[0].confidence, 0.9);
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
      }
    });

    await t.step("should handle empty transcript with no intents", async () => {
      // Replace global fetch with mock for empty transcript
      globalThis.fetch = createMockFetch('empty');

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
        assertEquals(data.intents.length, 0, "Empty transcript should return no intents");
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

    // Clean up environment variables after all tests
    clearEnvVars();
  }
});
