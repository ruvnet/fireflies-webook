import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// Set test environment flag before any imports
Deno.env.set("DENO_TEST", "1");

// Mock data for testing
const MOCK_PAYLOAD = {
  meetingId: "test-meeting-123",
  transcriptionText: "Alice: Let's schedule a follow-up meeting next week.\nBob: I'll create a task to prepare the presentation.\nAlice: We've decided to proceed with the new feature.",
  participants: ["Alice", "Bob"],
  metadata: {
    duration: 1800,
    date: "2024-01-15T10:00:00Z"
  }
};

// Mock successful response from OpenAI
const MOCK_OPENAI_RESPONSE = {
  choices: [{
    message: {
      content: JSON.stringify([{
        type: "Meeting Scheduled",
        confidence: 0.95,
        segment: {
          text: "Let's schedule a follow-up meeting next week.",
          timestamp: 0,
          speaker: "Alice"
        },
        metadata: {
          context: ["Meeting planning"],
          entities: ["next week"]
        }
      }])
    }
  }]
};

// Mock error response from OpenAI
const MOCK_OPENAI_ERROR = {
  error: {
    message: "Invalid API key"
  }
};

// Mock fetch function
const createMockFetch = (success: boolean) => {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (input.toString().includes('openai.com')) {
      if (success) {
        return new Response(JSON.stringify(MOCK_OPENAI_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify(MOCK_OPENAI_ERROR), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
};

// Store original fetch for cleanup
const originalFetch = globalThis.fetch;

// Helper to create a new module import for each test
async function getHandler() {
  const mod = await import("./index.ts?t=" + Date.now());
  return mod.handler;
}

// Test suite
Deno.test({
  name: "Intent Detection Tests",
  async fn(t) {
    await t.step("should handle OPTIONS request for CORS", async () => {
      const handler = await getHandler();
      const req = new Request("http://localhost", {
        method: "OPTIONS"
      });

      const response = await handler(req);
      assertEquals(response.status, 200);
      assertExists(response.headers.get("Access-Control-Allow-Origin"));
    });

    await t.step("should reject non-POST requests", async () => {
      const handler = await getHandler();
      const req = new Request("http://localhost", {
        method: "GET"
      });

      const response = await handler(req);
      assertEquals(response.status, 405);
    });

    await t.step("should validate payload - missing fields", async () => {
      const handler = await getHandler();
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const response = await handler(req);
      assertEquals(response.status, 400);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Invalid payload: missing required fields");
    });

    await t.step("should handle successful intent detection", async () => {
      globalThis.fetch = createMockFetch(true);
      const handler = await getHandler();
      
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_PAYLOAD)
      });

      const response = await handler(req);
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertEquals(data.success, true);
      assertExists(data.data.intents);
      assertEquals(data.data.meetingId, MOCK_PAYLOAD.meetingId);
    });

    await t.step("should handle OpenAI API error", async () => {
      globalThis.fetch = createMockFetch(false);
      const handler = await getHandler();
      
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_PAYLOAD)
      });

      const response = await handler(req);
      assertEquals(response.status, 500);

      const data = await response.json();
      assertEquals(data.success, false);
    });

    // Reset fetch
    globalThis.fetch = originalFetch;
  }
});
