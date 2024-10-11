# System Architecture

## Components

1. FastAPI Application
   - Handles incoming webhook requests
   - Manages API routes and middleware

2. Intent Detection Module
   - Processes transcripts to identify intents
   - Uses keyword matching and potentially ML-based classification

3. OpenAI Integration Module
   - Generates prompts based on detected intents
   - Processes OpenAI API responses

4. Database Module
   - Manages SQLite database connections
   - Handles data storage and retrieval

5. Fireflies API Client
   - Manages communication with Fireflies API
   - Handles authentication and error retry logic

6. Logging and Monitoring Module
   - Implements comprehensive logging
   - Provides debugging and monitoring capabilities

## Technology Stack

- Python 3.9+
- FastAPI
- Pydantic
- SQLAlchemy
- LiteLLM
- httpx (for async HTTP requests)
- python-dotenv (for environment variable management)
- uvicorn (ASGI server)
- alembic (for database migrations)

## Folder Structure

```
fireflies-webhook/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── fireflies.py
│   │   ├── openai.py
│   │   └── intent_detector.py
│   └── utils/
│       ├── __init__.py
│       └── logger.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_services.py
│   └── test_utils.py
├── .env
├── .gitignore
├── alembic.ini
├── pyproject.toml
├── README.md
├── SPECIFICATION.md
├── ARCHITECTURE.md
└── install.sh
```

## Architectural Decisions

1. FastAPI: Chosen for its high performance, easy-to-use async capabilities, and built-in OpenAPI documentation.

2. SQLAlchemy with SQLite: Provides a lightweight, file-based database solution that's easy to set up and maintain. SQLAlchemy offers an ORM for database interactions and supports migrations through Alembic.

3. Pydantic: Used for data validation and settings management, integrating well with FastAPI.

4. LiteLLM: Provides a unified interface for working with various LLM providers, making it easier to switch between models if needed.

5. Modular Structure: The application is divided into modules (api, services, utils) to promote separation of concerns and maintainability.

6. Environment Variables: Sensitive information like API keys is stored in a .env file, which is not version-controlled.

7. Alembic: Used for database migrations, allowing for easy schema updates and version control of the database structure.

8. Poetry: Chosen for dependency management due to its deterministic builds and easy-to-use CLI.

This architecture provides a scalable and maintainable structure for the Fireflies webhook application, with clear separation of concerns and room for future expansion.
