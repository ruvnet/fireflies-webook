import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// Set test environment flag before any imports
Deno.env.set("DENO_TEST", "1");

// Mock successful response from Fireflies API
const MOCK_FIREFLIES_RESPONSE = {
  data: {
    transcript: {
      summary: {
        keywords: ["meeting", "discussion", "project"],
        action_items: ["Schedule follow-up", "Review documentation"],
        outline: ["Introduction", "Project Updates", "Next Steps"],
        shorthand_bullet: ["Intro", "Updates", "Next"],
        overview: "Team meeting to discuss project progress",
        bullet_gist: ["Project status reviewed", "Action items assigned"],
        gist: "Comprehensive project review meeting",
        short_summary: "Project status update and planning"
      }
    }
  }
};

// Mock error response from Fireflies API
const MOCK_FIREFLIES_ERROR = {
  errors: [
    {
      message: "Transcript not found"
    }
  ]
};

// Mock fetch function
const createMockFetch = (success: boolean) => {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    // Verify the GraphQL query structure
    if (init?.body) {
      const body = JSON.parse(init.body.toString());
      if (!body.variables?.transcriptId) {
        return new Response(JSON.stringify({
          errors: [{ message: "Missing required parameter: transcriptId" }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (success) {
      return new Response(JSON.stringify(MOCK_FIREFLIES_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify(MOCK_FIREFLIES_ERROR), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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
  name: "Meeting Info Handler Tests",
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

    await t.step("should require API key", async () => {
      const handler = await getHandler();
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: "test-id" })
      });

      const response = await handler(req);
      assertEquals(response.status, 401);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Missing API key");
    });

    await t.step("should require meetingId", async () => {
      const handler = await getHandler();
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer test-key"
        },
        body: JSON.stringify({})
      });

      const response = await handler(req);
      assertEquals(response.status, 400);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Missing meetingId");
    });

    await t.step("should handle successful API response", async () => {
      globalThis.fetch = createMockFetch(true);
      const handler = await getHandler();
      
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer test-key"
        },
        body: JSON.stringify({ meetingId: "test-id" })
      });

      const response = await handler(req);
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.success, true);
      assertExists(data.data.transcript);
      assertExists(data.data.transcript.summary);
      assertEquals(data.data.transcript.summary.keywords.length, 3);
      assertEquals(data.data.transcript.summary.action_items.length, 2);
      assertEquals(data.data.transcript.summary.overview, "Team meeting to discuss project progress");
    });

    await t.step("should handle API error response", async () => {
      globalThis.fetch = createMockFetch(false);
      const handler = await getHandler();
      
      const req = new Request("http://localhost", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer test-key"
        },
        body: JSON.stringify({ meetingId: "test-id" })
      });

      const response = await handler(req);
      assertEquals(response.status, 400);

      const data = await response.json();
      assertEquals(data.success, false);
      assertEquals(data.message, "Transcript not found");
    });

    // Reset fetch
    globalThis.fetch = originalFetch;
  }
});
