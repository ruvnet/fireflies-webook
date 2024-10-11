# Project Specification

## Functional Requirements

1. Webhook Endpoint:
   - Receive requests from Fireflies
   - Query Fireflies API for transcripts
   - Implement error handling (retries, timeouts, API failures)
   - Ensure security (API keys or OAuth)

2. Intent Detection:
   - Process transcripts to detect intents:
     - Follow-up
     - Proposal
     - SOW
     - Coding
     - Technical specification
     - Functional specification
     - Documentation
     - Project management
     - Product features
     - Tool selection
   - Use OpenAI for processing transcript sections
   - Implement a dictionary of intents for matching

3. Data Storage:
   - Use SQLite database via SQLAlchemy
   - Store data for each step:
     - Initial webhook request
     - Transcript
     - Detected intents
     - Final OpenAI output
   - Implement database migrations

4. OpenAI Integration:
   - Use GPT-4o-mini for structured outputs
   - Ensure flexibility to switch models if needed
   - Generate outputs formatted to match identified intents

5. Tool Selection/Execution:
   - Trigger appropriate tools/services based on detected intent
   - Provide an expandable execution framework

## Non-Functional Requirements

1. Technology Stack:
   - Python
   - Pydantic
   - FastAPI
   - SQLAlchemy
   - LiteLLM
   - Poetry for dependency management

2. Security:
   - Store credentials securely in .env file
   - Implement API key or OAuth authentication

3. Logging and Debugging:
   - Implement comprehensive logging
   - Provide guidance on debugging common issues

4. Documentation:
   - Clear README.md with setup and run instructions
   - API documentation
   - Guidance on extending the system (new intents, APIs, output formats)

5. Environment:
   - Use Poetry for dependency management
   - Provide setup script or instructions

## User Scenarios

1. Receiving a Fireflies webhook:
   - System receives webhook request
   - Validates request and extracts meeting ID
   - Queries Fireflies API for transcript
   - Processes transcript for intent detection
   - Generates structured output based on intent
   - Stores all data in database
   - Returns response to webhook sender

2. Adding a new intent:
   - Developer updates intent dictionary
   - Implements new processing logic if required
   - Updates OpenAI prompt to handle new intent
   - Tests new intent with sample transcripts

3. Debugging a failed webhook:
   - Admin checks logs for error messages
   - Verifies API credentials and connectivity
   - Checks database for partial data storage
   - Reviews OpenAI response for any issues

## UI/UX Guidelines

As this is primarily a backend service, there is no direct user interface. However, for any potential admin interface or API documentation:

- Use clear, concise language
- Provide examples for API requests and responses
- Use consistent formatting and structure
- Implement proper error messages and status codes
# Fireflies Webhook Specification

## Functional Requirements

1. Webhook Endpoint:
   - Receive POST requests from Fireflies
   - Authenticate incoming requests
   - Query Fireflies API for transcripts
   - Handle errors, retries, and timeouts

2. Intent Detection:
   - Process transcripts to detect intents
   - Use OpenAI for intent detection
   - Implement a dictionary of intents for matching

3. Action Execution:
   - Execute actions based on detected intents
   - Use OpenAI for structured output generation
   - Support various output formats based on intent

4. Data Storage:
   - Save webhook requests, transcripts, intents, and outputs in SQLite database
   - Implement database migrations

## Non-Functional Requirements

1. Security:
   - Implement API key authentication
   - Store credentials securely in .env file

2. Performance:
   - Handle concurrent requests efficiently
   - Optimize database queries

3. Scalability:
   - Design for potential future growth
   - Allow easy addition of new intents and actions

4. Maintainability:
   - Use clear code structure and documentation
   - Implement logging for monitoring and debugging

## Technology Stack

- Python 3.9+
- FastAPI
- Pydantic
- SQLAlchemy
- LiteLLM
- GPT-4o-mini (via OpenAI)
- Poetry for dependency management

## User Scenarios

1. Fireflies sends a webhook request with a meeting ID
2. System retrieves transcript from Fireflies API
3. System detects intents in the transcript
4. System generates structured output based on intents
5. System stores all data and responds to the webhook request

## UI/UX Guidelines

As this is an API-based system, there is no direct user interface. However, the API responses should be:

- Clear and consistent in format
- Well-documented for ease of integration
- Provide meaningful error messages
