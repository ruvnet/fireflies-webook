import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// Set test environment flag before any imports
Deno.env.set("DENO_TEST", "1");

// Mock data for testing
const MOCK_WEBHOOK_PAYLOAD = {
  meetingId: "test-meeting-id",
  eventType: "Transcription completed",
  clientReferenceId: "test-ref-123",
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
};

// Helper to create a new module import for each test
async function getHandler() {
  const mod = await import("./index.ts?t=" + Date.now());
  return mod.handler;
}

// Test suite for webhook handler
Deno.test({
  name: "Webhook Handler Tests",
  async fn(t) {
    // Get fresh handler instance
    const handler = await getHandler();

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
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_WEBHOOK_PAYLOAD)
      });

      const response = await handler(req);
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.success, true);
      assertEquals(data.message, "Webhook received successfully");
      assertEquals(data.data.meetingId, MOCK_WEBHOOK_PAYLOAD.meetingId);
      assertEquals(data.data.transcript.sentences.length, 2);
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
