Create a complete specification, including files and folder structure, for a webhook endpoint that:

1. **Receives requests** from Fireflies and queries the Fireflies API for transcripts.
2. **Processes the transcript** to detect intents such as follow-up, proposal, SOW, coding, technical specification, functional specification, documentation, project management, product features, and tool selection. 
3. **Executes actions** based on the detected intent using OpenAI's structured output with Python, Pydantic, FastAPI, SQLite (via SQLAlchemy), LiteLLM, and GPT-4o-mini.

### Requirements:
- **Webhook Endpoint**:
  - Must include error handling for retries, timeouts, and failed Fireflies API queries.
  - Implement security measures (e.g., API keys or OAuth) and store credentials securely in a `.env` file.
  
- **Intent Detection**:
  - Use OpenAI to process transcript sections for intent detection.
  - Implement a dictionary of intents for matching common phrases or topics (follow-up, proposal, etc.). Provide guidance on how this dictionary should be structured or updated.
  
- **SQLite Database**:
  - Save each step of the process (initial webhook request, transcript, detected intents, and final OpenAI output) in separate tables.
  - Ensure database transactions are secure, and include migration support via SQLAlchemy.

- **OpenAI Integration**:
  - Use GPT-4o-mini for structured outputs and ensure flexibility in switching to other models if needed.
  - OpenAI output should be clearly formatted to match the identified intent (e.g., for coding, generate Python code; for proposals, generate text content).

- **Tool Selection/Execution**:
  - Based on the detected intent, the webhook should trigger the appropriate tools or services. For instance, if coding is detected, generate Python code; if project management is detected, create a task list.
  - Provide an execution framework that can be expanded to integrate other tools and services.

- **Environment and Dependencies**:
  - Use Poetry for dependency management and ensure the `.env` file securely handles sensitive keys (API keys for Fireflies and OpenAI).
  - The project should include a setup script or instructions for environment configuration, including how to install and run the service.

- **Logging and Debugging**:
  - Implement logging throughout the process for monitoring and error tracking. Ensure logs capture webhook requests, API responses, detected intents, and execution steps.
  - Provide guidance on debugging common issues, such as failed API queries or incorrect intent detection.

### Output:
Provide a comprehensive folder structure, including:
- **app.py** or similar for the main FastAPI app.
- **models.py** for defining Pydantic models and SQLAlchemy database models.
- **intents.py** for defining the intent detection logic.
- **database.py** for SQLite connection and management.
- A `.env` template and `poetry.lock` for dependencies.
- SQLAlchemy migrations or setup for managing the database schema.
- A clear `README.md` that explains how to set up and run the application, along with API documentation.
- detailed documentation in /docs folder with installation, user guide, configuration. 
- create install.sh in root folder that installs poetry, and python application.
   
Ensure robust documentation for extending the system, especially for adding new intents, integrating other APIs, and handling different output formats from OpenAI.
