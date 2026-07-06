"""App configuration via pydantic-settings."""
from pathlib import Path
from typing import Any
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, list):
        return value
    return []


class Settings(BaseSettings):
    # Load the project root .env so backend launched from `backend/` still sees root env vars.
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[3] / ".env"),
        extra="ignore",
    )

    # App
    APP_NAME: str = "DataMind AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "datamind"

    # JWT
    SECRET_KEY: str = "change-me-in-production-at-least-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it:free"
    AI_PROVIDER: str = "openrouter"

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./uploads"

    # CORS
    ALLOWED_ORIGINS: Any = "http://localhost:5173,http://localhost:3000"

    @property
    def ALLOWED_ORIGINS_LIST(self) -> list[str]:
        return parse_list(self.ALLOWED_ORIGINS)

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "noreply@datamind.ai"


settings = Settings()
