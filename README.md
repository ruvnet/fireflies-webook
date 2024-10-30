# Fireflies Webhook Handler

## Edge Function Management via CLI

### Basic Commands

```bash
# List all deployed functions
npx supabase functions list

# Get URL for a specific function
npx supabase functions url webhook-handler

# Delete a function
npx supabase functions delete webhook-handler

# Deploy a function
# Deploy a function
npx supabase functions deploy webhook-handler --no-verify-jwt

# Delete a function
npx supabase functions delete webhook-handler

# Download a deployed function
npx supabase functions download webhook-handler

# Create a new function
npx supabase functions new my-new-function
```

### Serving Functions Locally
```bash
# Serve all functions
npx supabase functions serve

# Serve specific function
npx supabase functions serve webhook-handler

# Serve with environment variables
npx supabase functions serve webhook-handler --env-file .env
```

### Debugging Functions
```bash
# View function logs
npx supabase functions logs webhook-handler

# View logs with debug info
FIREFLIES_API_KEY=your_fireflies_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase Project Details
SUPABASE_URL=your_supabase_project_url
SUPABASE_PROJECT_REF=your_project_ref

# Supabase Keys/Tokens
SUPABASE_ACCESS_TOKEN=your_access_token        # For CLI operations
SUPABASE_ANON_KEY=your_anon_public_key        # For client-side
SUPABASE_SERVICE_ROLE_KEY=your_service_role    # For server-side
SUPABASE_JWT_SECRET=your_jwt_secret           # For auth verification
```

If any variable is missing, the setup script will prompt you to enter it.

### Running the Setup

1. Make the setup script executable:
   ```bash
   chmod +x setup.sh
   ```

2. Run the setup CLI:
   ```bash
   ./setup.sh
   ```

3. Choose from the following options in the interactive menu:
   ```
   ===============================================
   Fireflies Webhook Handler - Setup and Deployment
   ===============================================
   1. Install Prerequisites (Deno)
   2. Configure Environment Variables
   3. Setup Database
   4. Run Tests
   5. Deploy Function
   6. Full Setup (Steps 1-5)
   7. View Logs
   8. Show Webhook URL
   9. Exit
   ===============================================
   ```

### Automated Setup (Recommended)

1. Choose option 6 for full automated setup:
   - Installs prerequisites (Deno)
   - Loads or prompts for environment variables
   - Sets up the database using `npx supabase`
   - Runs tests
   - Deploys the function
   - Displays the webhook URL

2. After deployment, the CLI will display the webhook URL and configuration instructions:
   ```
   =================================================================
   Fireflies Webhook Configuration Instructions
   =================================================================
   1. Go to Fireflies Dashboard: https://app.fireflies.ai/settings
   2. Navigate to Developer settings
   3. Add this Webhook URL: https://your-project.functions.supabase.co/webhook-handler
   4. Save the settings

   This webhook will be notified when:
   - Transcription Completed (Triggered when transcription is completed)
   =================================================================
   ```

### Manual Supabase Commands

If you need to run Supabase commands manually:

```bash
# Set access token for CLI operations
export SUPABASE_ACCESS_TOKEN=your_access_token

# Link project
npx supabase link --project-ref your-project-ref

# Deploy function
npx supabase functions deploy webhook-handler --no-verify-jwt

# Set environment variables (using service role for backend operations)
npx supabase secrets set \
  FIREFLIES_API_KEY=your-key \
  OPENAI_API_KEY=your-key \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# View logs
npx supabase functions logs webhook-handler

# Get function URL
npx supabase functions url webhook-handler
```

### Viewing Webhook URL

At any time, you can:
1. Run `./setup.sh`
2. Choose option 8 to display:
   - Webhook URL
   - Fireflies configuration instructions
   - Test command

### Monitoring

1. View Logs (Option 7):
   - Shows function execution logs using `npx supabase functions logs`
   - Helps with monitoring and debugging

2. Test the webhook:
   ```bash
   curl -X POST https://your-project.functions.supabase.co/webhook-handler \
     -H 'Content-Type: application/json' \
     -d '{
       "meetingId": "your-meeting-id",
       "eventType": "Transcription completed"
     }'
   ```

## Features

- Receives webhook notifications from Fireflies.ai
- Fetches complete transcript data using Fireflies GraphQL API
- Detects intents in meeting transcripts using OpenAI GPT-4
- Stores processed data in Supabase database
- Handles errors and retries gracefully
- CORS-enabled for cross-origin requests

## Troubleshooting

### Common Issues

1. Missing Supabase credentials:
   ```bash
   # Get your credentials from Supabase dashboard:
   # - Access Token: Account > Access Tokens
   # - Anon Key: Project Settings > API > anon public
   # - Service Role: Project Settings > API > service_role secret
   # - JWT Secret: Project Settings > API > JWT Settings
   
   ./setup.sh
   # Choose option 2 to configure
   ```

2. Environment variables not loaded:
   ```bash
   # Check .env file exists and has all required variables
   cat .env
   # If missing, run setup
   ./setup.sh
   # Choose option 2
   ```

3. Database issues:
   ```bash
   # Ensure SUPABASE_ACCESS_TOKEN and SUPABASE_SERVICE_ROLE_KEY are set
   echo $SUPABASE_ACCESS_TOKEN
   echo $SUPABASE_SERVICE_ROLE_KEY
   # Then run setup
   ./setup.sh
   # Choose option 3
   ```

4. Deployment problems:
   ```bash
   ./setup.sh
   # Choose option 7 to view logs
   ```

### Verification Steps

1. Check environment:
   ```bash
   # Verify variables are set
   cat .env
   ```

2. Test Supabase access:
   ```bash
   # Test CLI access
   SUPABASE_ACCESS_TOKEN=your_token npx supabase projects list

   # Test API access
   curl -X GET \
     -H "apikey: your_anon_key" \
     -H "Authorization: Bearer your_service_role_key" \
     "https://your-project.supabase.co/rest/v1/"
   ```

3. Verify webhook URL:
   ```bash
   ./setup.sh
   # Choose option 8
   ```

## Security

- JWT verification is disabled to allow Fireflies.ai webhooks
- API keys are stored securely as environment variables
- Database access is controlled via RLS policies
- CORS is configured for specific origins
- Service role key used for backend operations
- Anon key used for client-side operations

## Support

For issues and feature requests:
1. Check the [issues page](https://github.com/yourusername/fireflies-webhook/issues)
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Environment details
   - Expected vs actual behavior

## License

MIT License - see LICENSE file for details
