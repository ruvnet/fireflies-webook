import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// Set test environment flag before any imports
Deno.env.set("DENO_TEST", "1");

// Mock data for testing - matches Fireflies webhook format exactly
const MOCK_WEBHOOK_PAYLOAD = {
  meetingId: "ASxwZxCstx",
  eventType: "Transcription completed",
  clientReferenceId: "be582c46-4ac9-4565-9ba6-6ab4264496a8"
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

    await t.step("should validate webhook payload - missing fields", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const response = await handler(req);
      assertEquals(response.status, 400);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Invalid webhook payload: missing required fields");
    });

    await t.step("should validate webhook payload - missing eventType", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: "ASxwZxCstx"
        })
      });

      const response = await handler(req);
      assertEquals(response.status, 400);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Invalid webhook payload: missing required fields");
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
      assertEquals(data.data.eventType, MOCK_WEBHOOK_PAYLOAD.eventType);
      assertEquals(data.data.clientReferenceId, MOCK_WEBHOOK_PAYLOAD.clientReferenceId);
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
