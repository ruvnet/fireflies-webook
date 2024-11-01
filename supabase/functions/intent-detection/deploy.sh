#!/bin/bash

# Ensure script exits on any error
set -e

# Store the root directory and function directory
ROOT_DIR="$(cd ../.. && pwd)"
FUNCTION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Intent Detection Function locally..."

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "Error: SUPABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
    exit 1
fi

# Kill any existing process using port 8000
echo "Cleaning up any existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "Running tests..."
cd "$FUNCTION_DIR"
deno test --allow-env --allow-net --allow-read test.ts

if [ $? -eq 0 ]; then
    echo "Tests passed successfully!"
else
    echo "Tests failed. Please fix the issues before starting."
    exit 1
fi

echo "Starting function in the background..."
cd "$FUNCTION_DIR"
deno run --allow-net --allow-env index.ts &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "Testing the function..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:8000 \
    -H "Content-Type: application/json" \
    -d '{
      "meetingId": "test-meeting-123",
      "transcriptionText": "Let'\''s schedule a follow-up meeting next week.",
      "participants": ["Alice", "Bob"],
      "metadata": {
        "duration": 1800,
        "date": "2024-01-15T10:00:00Z"
      }
    }')

if [ $? -eq 0 ]; then
    echo "Function is running successfully!"
    echo "API Response: $TEST_RESPONSE"
else
    echo "Warning: Could not verify function. Please check manually."
fi

echo ""
echo "Function is running at http://localhost:8000"
echo ""
echo "To test the function, you can use curl:"
echo "curl -X POST http://localhost:8000 \\"
echo "  -H 'Content-Type: application/json' \\"
echo '  -d '"'"'{
    "meetingId": "test-meeting-123",
    "transcriptionText": "Let'\''s schedule a follow-up meeting next week.",
    "participants": ["Alice", "Bob"],
    "metadata": {
      "duration": 1800,
      "date": "2024-01-15T10:00:00Z"
    }
  }'"'"
echo ""
echo "To stop the function, run: kill $SERVER_PID"

# Create a trap to clean up the server process on script exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
