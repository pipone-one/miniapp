from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Cartel Command"
    environment: str = "local"
    api_base_url: str = "http://localhost:8000"

    openai_api_key: str | None = None
    xai_api_key: str | None = None
    telegram_bot_token: str | None = None
    admin_chat_id: str | None = None
    openai_model: str = "gpt-4o"
    grok_model: str = "xai/grok-4-1-fast-reasoning"
    whisper_model: str = "whisper-1"
    mini_app_link: str | None = None
    timezone: str = "Europe/Kyiv"
    posting_timezone: str = "Europe/Kyiv"

    sqlite_path: str = "./data/cartel.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
