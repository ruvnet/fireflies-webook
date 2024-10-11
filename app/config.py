from pydantic import BaseSettings

class Settings(BaseSettings):
    FIREFLIES_API_KEY: str
    OPENAI_API_KEY: str
    DATABASE_URL: str = "sqlite:///./fireflies_webhook.db"
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
