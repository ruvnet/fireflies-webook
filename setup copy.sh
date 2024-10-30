#!/bin/bash

[Previous content until list_functions function]

# Function to list functions and URLs
list_functions() {
    print_status "$YELLOW" "Listing deployed functions..."
    verify_prerequisites
    load_env
    
    # Get the list of functions
    print_status "$GREEN" "$(SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase functions list)"
    
    # Get URL for webhook-handler
    print_status "$YELLOW" "\nWebhook URL:"
    webhook_url=$(SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx supabase functions url webhook-handler)
    print_status "$GREEN" "webhook-handler: $webhook_url"
}

[Rest of the file remains the same]
