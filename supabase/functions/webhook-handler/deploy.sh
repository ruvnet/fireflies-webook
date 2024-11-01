#!/bin/bash

# Ensure script exits on any error
set -e

# Store the root directory
ROOT_DIR="$(cd ../.. && pwd)"

echo "Deploying Fireflies Webhook Handler to Supabase..."

# Check if SUPABASE_PROJECT_REF is set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "Error: SUPABASE_PROJECT_REF environment variable is not set"
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
npx supabase functions deploy webhook-handler --no-verify-jwt

WEBHOOK_URL="https://$SUPABASE_PROJECT_REF.functions.supabase.co/webhook-handler"
echo "Deployment complete!"
echo "Your webhook endpoint is available at: $WEBHOOK_URL"

echo "Testing deployment..."
TEST_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d '{
      "meetingId": "ASxwZxCstx",
      "eventType": "Transcription completed",
      "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
    }')

if [ $? -eq 0 ]; then
    echo "Deployment verified successfully!"
    echo "API Response: $TEST_RESPONSE"
else
    echo "Warning: Could not verify deployment. Please check the endpoint manually."
fi

echo ""
echo "To test the webhook, you can use curl:"
echo "curl -X POST $WEBHOOK_URL \\"
echo "  -H 'Content-Type: application/json' \\"
echo '  -d '"'"'{
    "meetingId": "ASxwZxCstx",
    "eventType": "Transcription completed",
    "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
  }'"'"
