#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to verify prerequisites
verify_prerequisites() {
    # Check if Deno is installed and working
    if ! deno --version &> /dev/null; then
        if [ ! -f "/home/codespace/.deno/bin/deno" ]; then
            print_status "$YELLOW" "Deno is not installed"
            print_status "$GREEN" "Installing Deno..."
            curl -fsSL https://deno.land/x/install/install.sh | sh
            export DENO_INSTALL="/home/codespace/.deno"
            export PATH="$DENO_INSTALL/bin:$PATH"
            print_status "$GREEN" "Deno installed successfully"
        else
            # If deno binary exists but command fails, just add to PATH
            export DENO_INSTALL="/home/codespace/.deno"
            export PATH="$DENO_INSTALL/bin:$PATH"
        fi
    fi
}

# Function to load environment variables
load_env() {
    if [ ! -f .env ]; then
        print_status "$RED" "Error: .env file not found. Please run option 2 first to configure environment variables."
        return 1
    fi
    
    # Load environment variables
    set -a
    source .env
    set +a
    
    # Check required variables
    local required_vars=(
        "SUPABASE_ACCESS_TOKEN"
        "FIREFLIES_API_KEY"
        "OPENAI_API_KEY"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_PROJECT_REF"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_status "$RED" "Error: The following required environment variables are not set:"
        for var in "${missing_vars[@]}"; do
            print_status "$RED" "- $var"
        done
        print_status "$YELLOW" "Please update your .env file with these values"
        return 1
    fi
    
    # Export variables with FF_ prefix for function deployment
    export FF_API_KEY="$FIREFLIES_API_KEY"
    export FF_URL="$SUPABASE_URL"
    export FF_ANON_KEY="$SUPABASE_ANON_KEY"
    export FF_SERVICE_ROLE="$SUPABASE_SERVICE_ROLE_KEY"
    
    return 0
}

# Function to deploy webhook handler
deploy_webhook() {
    print_status "$YELLOW" "Deploying webhook handler..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    
    cd supabase/functions/webhook-handler
    
    # Deploy the function
    if ! ./deploy.sh; then
        print_status "$RED" "Deployment failed"
        cd ../../..
        return 1
    fi
    
    cd ../../..
    print_status "$GREEN" "Webhook handler deployed successfully"
}

# Function to deploy meeting info
deploy_meeting_info() {
    print_status "$YELLOW" "Deploying meeting info function..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    
    cd supabase/functions/meeting-info
    
    # Deploy the function
    if ! ./deploy.sh; then
        print_status "$RED" "Deployment failed"
        cd ../../..
        return 1
    fi
    
    cd ../../..
    print_status "$GREEN" "Meeting info function deployed successfully"
}

# Function to deploy intent detection
deploy_intent_detection() {
    print_status "$YELLOW" "Deploying intent detection function..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    
    cd supabase/functions/intent-detection
    
    # Deploy the function
    if ! ./deploy.sh; then
        print_status "$RED" "Deployment failed"
        cd ../../..
        return 1
    fi
    
    cd ../../..
    print_status "$GREEN" "Intent detection function deployed successfully"
}

# Function to deploy all functions
deploy_all_functions() {
    deploy_webhook || return 1
    deploy_meeting_info || return 1
    deploy_intent_detection || return 1
}

# Function to install prerequisites
install_prerequisites() {
    print_status "$YELLOW" "Installing prerequisites..."
    verify_prerequisites
    print_status "$GREEN" "Prerequisites installed successfully"
}

# Function to configure environment variables
configure_env() {
    print_status "$YELLOW" "Configuring environment variables..."
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "$GREEN" "Created .env file from .env.example"
            print_status "$YELLOW" "Please update the following values in .env file:"
            print_status "$YELLOW" "- SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens)"
            print_status "$YELLOW" "- FIREFLIES_API_KEY (from Fireflies.ai dashboard)"
            print_status "$YELLOW" "- OPENAI_API_KEY (from OpenAI dashboard)"
            print_status "$YELLOW" "- SUPABASE_URL (from your Supabase project settings)"
            print_status "$YELLOW" "- SUPABASE_ANON_KEY (from your Supabase project settings)"
            print_status "$YELLOW" "- SUPABASE_PROJECT_REF (from your Supabase project settings)"
            print_status "$YELLOW" "- SUPABASE_SERVICE_ROLE_KEY (from your Supabase project settings)"
        else
            print_status "$RED" "Error: .env.example file not found"
            exit 1
        fi
    else
        print_status "$GREEN" ".env file already exists"
        if ! load_env; then
            return 1
        fi
    fi
}

# Function to setup database
setup_database() {
    print_status "$YELLOW" "Setting up database..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    
    cd supabase
    npx supabase db push --linked
    cd ..
    print_status "$GREEN" "Database setup completed"
}

# Function to run all tests
run_all_tests() {
    print_status "$YELLOW" "Running all tests..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    # Run webhook handler tests
    cd supabase/functions/webhook-handler
    if ! deno test --allow-all; then
        print_status "$RED" "Webhook handler tests failed"
        cd ../../..
        return 1
    fi
    cd ../../..
    
    # Run meeting info tests
    cd supabase/functions/meeting-info
    if ! deno test --allow-all; then
        print_status "$RED" "Meeting info tests failed"
        cd ../../..
        return 1
    fi
    cd ../../..
    
    # Run intent detection tests
    cd supabase/functions/intent-detection
    if ! deno test --allow-all; then
        print_status "$RED" "Intent detection tests failed"
        cd ../../..
        return 1
    fi
    cd ../../..
    
    print_status "$GREEN" "All tests completed successfully"
}

# Function to perform full setup
full_setup() {
    install_prerequisites
    configure_env || return 1
    setup_database || return 1
    run_all_tests || return 1
    deploy_all_functions || return 1
}

# Function to view logs for a specific function
view_function_logs() {
    print_status "$YELLOW" "Select function to view logs:"
    echo "1. webhook-handler"
    echo "2. meeting-info"
    echo "3. intent-detection"
    echo "4. Back to main menu"
    read -p "Enter your choice (1-4): " log_choice
    
    case $log_choice in
        1) npx supabase functions logs webhook-handler ;;
        2) npx supabase functions logs meeting-info ;;
        3) npx supabase functions logs intent-detection ;;
        4) return ;;
        *) print_status "$RED" "Invalid option" ;;
    esac
}

# Function to show function URLs
show_function_urls() {
    print_status "$YELLOW" "Getting function URLs..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    print_status "$GREEN" "Webhook Handler URL: https://$SUPABASE_PROJECT_REF.functions.supabase.co/webhook-handler"
    print_status "$GREEN" "Meeting Info URL: https://$SUPABASE_PROJECT_REF.functions.supabase.co/meeting-info"
    print_status "$GREEN" "Intent Detection URL: https://$SUPABASE_PROJECT_REF.functions.supabase.co/intent-detection"
}

# Function to list functions and URLs
list_functions() {
    print_status "$YELLOW" "Listing deployed functions..."
    verify_prerequisites
    
    # Load environment variables first
    if ! load_env; then
        return 1
    fi
    
    print_status "$GREEN" "Using project ref: $SUPABASE_PROJECT_REF"
    echo ""
    npx supabase functions list
    
    # Show function URLs
    print_status "$YELLOW" "\nFunction URLs:"
    print_status "$GREEN" "webhook-handler: https://$SUPABASE_PROJECT_REF.functions.supabase.co/webhook-handler"
    print_status "$GREEN" "meeting-info: https://$SUPABASE_PROJECT_REF.functions.supabase.co/meeting-info"
    print_status "$GREEN" "intent-detection: https://$SUPABASE_PROJECT_REF.functions.supabase.co/intent-detection"
}

# Function deployment submenu
function_deployment_menu() {
    while true; do
        echo "==============================================="
        echo "Function Deployment Menu"
        echo "==============================================="
        echo "1. Deploy Webhook Handler"
        echo "2. Deploy Meeting Info"
        echo "3. Deploy Intent Detection"
        echo "4. Deploy All Functions"
        echo "5. View Function Logs"
        echo "6. Show Function URLs"
        echo "7. List All Functions"
        echo "8. Back to Main Menu"
        echo "==============================================="
        read -p "Enter your choice (1-8): " deploy_choice
        echo ""
        
        case $deploy_choice in
            1) deploy_webhook ;;
            2) deploy_meeting_info ;;
            3) deploy_intent_detection ;;
            4) deploy_all_functions ;;
            5) view_function_logs ;;
            6) show_function_urls ;;
            7) list_functions ;;
            8) return ;;
            *) print_status "$RED" "Invalid option" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Make deploy scripts executable
chmod +x supabase/functions/webhook-handler/deploy.sh
chmod +x supabase/functions/meeting-info/deploy.sh
chmod +x supabase/functions/intent-detection/deploy.sh

# Main menu
while true; do
    echo "==============================================="
    echo "Fireflies Integration - Setup and Deployment"
    echo "==============================================="
    echo "1. Install Prerequisites (Deno)"
    echo "2. Configure Environment Variables"
    echo "3. Setup Database"
    echo "4. Run All Tests"
    echo "5. Function Deployment Menu"
    echo "6. Full Setup (Steps 1-4 + Deploy All)"
    echo "7. Exit"
    echo "==============================================="
    read -p "Enter your choice (1-7): " choice
    echo ""
    
    case $choice in
        1) install_prerequisites ;;
        2) configure_env ;;
        3) setup_database ;;
        4) run_all_tests ;;
        5) function_deployment_menu ;;
        6) full_setup ;;
        7) exit 0 ;;
        *) print_status "$RED" "Invalid option" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
