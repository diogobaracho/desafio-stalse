"""Centralized, validated application configuration.

All environment-specific values are read here (env vars or ``backend/.env``) and validated
once at startup, so a misconfigured deployment fails fast instead of at first use.
"""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    app_name: str = "stalse-mini-inbox-api"
    version: str = Field(default="0.1.0", validation_alias="VERSION")
    environment: Literal["local", "test", "dev", "prod"] = "local"

    database_url: str = f"sqlite:///{BACKEND_DIR / 'var' / 'stalse.db'}"
    metrics_file_path: Path = BACKEND_DIR.parent / "data" / "processed" / "metrics.json"

    n8n_webhook_url: AnyHttpUrl | None = None
    n8n_webhook_timeout_seconds: float = Field(default=3.0, gt=0, le=30)

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_format: Literal["json", "text"] = "text"

    read_only_mode: bool = False
    seed_on_startup: bool = False
    root_path: str = ""

    @field_validator("n8n_webhook_url", mode="before")
    @classmethod
    def _empty_url_disables_webhook(cls, value: object) -> object:
        return None if value in ("", None) else value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("metrics_file_path", mode="after")
    @classmethod
    def _resolve_relative_to_backend(cls, value: Path) -> Path:
        return value if value.is_absolute() else (BACKEND_DIR / value).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
