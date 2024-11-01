#!/bin/bash

# Ensure script exits on any error
set -e

# Store the root directory
ROOT_DIR="$(cd ../.. && pwd)"

echo "Deploying Fireflies Meeting Info Handler to Supabase..."

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "Error: SUPABASE_PROJECT_REF environment variable is not set"
    exit 1
fi

if [ -z "$FIREFLIES_API_KEY" ]; then
    echo "Error: FIREFLIES_API_KEY environment variable is not set"
    exit 1
fi

echo "Running tests..."
deno test --allow-env --allow-net --allow-read test.ts

if [ $? -eq 0 ]; then
    echo "Tests passed successfully!"
else
    echo "Tests failed. Please fix the issues before deploying."
    exit 1
fi

echo "Deploying function..."
cd "$ROOT_DIR"
npx supabase functions deploy meeting-info --no-verify-jwt

FUNCTION_URL="https://$SUPABASE_PROJECT_REF.functions.supabase.co/meeting-info"
echo "Deployment complete!"
echo "Your function endpoint is available at: $FUNCTION_URL"

echo "Testing deployment with Fireflies API key..."
TEST_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $FIREFLIES_API_KEY" \
    -d '{
      "meetingId": "IQqVuslNBNQW0TIr"
    }')

if [ $? -eq 0 ]; then
    echo "Deployment verified successfully!"
    echo "API Response: $TEST_RESPONSE"
else
    echo "Warning: Could not verify deployment. Please check the endpoint manually."
fi

echo ""
echo "To test the function, you can use curl:"
echo "curl -X POST $FUNCTION_URL \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_FIREFLIES_API_KEY' \\"
echo '  -d '"'"'{
    "meetingId": "IQqVuslNBNQW0TIr"
  }'"'"

echo ""
echo "The function will return the transcript summary from Fireflies."
