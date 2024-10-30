#!/bin/bash

# Ensure script exits on any error
set -e

# Store the root directory
ROOT_DIR="$(cd ../.. && pwd)"

echo "Deploying Fireflies Webhook Handler to Supabase..."

# Check if required environment variables are set
required_vars=(
    "FIREFLIES_API_KEY"
    "OPENAI_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_ACCESS_TOKEN"
    "SUPABASE_PROJECT_REF"
    "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var environment variable is not set"
        exit 1
    fi
done

echo "Running tests..."
deno test --allow-env --allow-net test.ts

if [ $? -eq 0 ]; then
    echo "Tests passed successfully!"
else
    echo "Tests failed. Please fix the issues before deploying."
    exit 1
fi

echo "Deploying function..."
cd "$ROOT_DIR"
npx supabase functions deploy webhook-handler --no-verify-jwt

echo "Setting environment variables..."
npx supabase secrets set \
    FF_API_KEY="$FIREFLIES_API_KEY" \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    FF_URL="$SUPABASE_URL" \
    FF_ANON_KEY="$SUPABASE_ANON_KEY" \
    FF_SERVICE_ROLE="$SUPABASE_SERVICE_ROLE_KEY"

WEBHOOK_URL="https://$SUPABASE_PROJECT_REF.functions.supabase.co/webhook-handler"
echo "Deployment complete!"
echo "Your webhook endpoint is available at: $WEBHOOK_URL"

echo "Testing deployment..."
TEST_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d '{"meetingId": "test-meeting-id", "eventType": "Transcription completed"}')

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
echo "  -d '{\"meetingId\": \"your-meeting-id\", \"eventType\": \"Transcription completed\"}'"
