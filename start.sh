#!/bin/bash

# Function to print colorful messages with emojis
print_message() {
    local emoji=$1
    local message=$2
    echo -e "\n\033[1;34m$emoji $message\033[0m"
}

# Check for Python installation
print_message "🐍" "Checking for Python installation..."
if ! command -v python3 &> /dev/null; then
    print_message "❌" "Python is not installed. Please install Python 3 and try again."
    exit 1
fi

# Install pip if not already installed
print_message "📦" "Checking for pip installation..."
if ! command -v pip3 &> /dev/null; then
    print_message "🚀" "Installing pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi

# Install aider.chat
print_message "🤖" "Installing aider.chat..."
pip3 install aider.chat

# Install Poetry
print_message "📜" "Installing Poetry..."
curl -sSL https://install.python-poetry.org | python3 -

# Check for API keys
print_message "🔑" "Checking for API keys..."
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    print_message "⚠️" "Neither OpenAI nor Anthropic API key found in environment variables."
    print_message "💡" "Please set either OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment."
    exit 1
else
    if [ -n "$OPENAI_API_KEY" ]; then
        print_message "✅" "OpenAI API key found."
    fi
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        print_message "✅" "Anthropic API key found."
    fi
fi

# Execute aider command
print_message "🚀" "Launching aider..."
aider README.md init-prompt.md start.md --yes-always --message-file commands.md

print_message "🎉" "Script execution completed!"
#!/bin/bash

# Activate the virtual environment
poetry shell

# Start the FastAPI server
uvicorn app.main:app --reload
ai