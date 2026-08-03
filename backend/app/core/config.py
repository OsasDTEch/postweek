from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- Database ----
    DATABASE_URL: str        # Direct connection — no PgBouncer (port 5432)
    DIRECT_URL: str          # Same — kept for Alembic compatibility

    # ---- LLM: Ollama Cloud (primary) ----
    OLLAMA_API_KEY: str
    OLLAMA_MODEL: str = "gemma4:31b"

    # ---- LLM: Groq (fallback) ----
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ---- JWT ----
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ---- SMTP (Gmail) ----
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM: str                        # e.g. postweek.dev@gmail.com

    # ---- App ----
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    # ---- Password reset token TTL (minutes) ----
    RESET_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
