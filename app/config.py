from pydantic import BaseSettings

class Settings(BaseSettings):
    FIREFLIES_API_KEY: str
    OPENAI_API_KEY: str
    DATABASE_URL: str = "sqlite:///./fireflies_webhook.db"
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
from pydantic import BaseSettings

class Settings(BaseSettings):
    fireflies_api_key: str
    openai_api_key: str
    database_url: str = "sqlite:///./sql_app.db"

    class Config:
        env_file = ".env"

settings = Settings()
