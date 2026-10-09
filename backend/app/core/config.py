"""Centralized, validated application configuration.

All environment-specific values are read here and validated once at startup, so a
misconfigured deployment fails fast instead of at first use. Sources, highest priority first:
init arguments, environment variables, ``backend/.env``, then files in ``SECRETS_DIR`` (one file
per setting, e.g. ``database_url`` - the Azure Key Vault CSI mount in AKS).
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal, Self

from pydantic import AnyHttpUrl, Field, field_validator, model_validator
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
    # Path prefix for every route, e.g. "/api" behind the Kubernetes ingress ("" locally).
    api_prefix: str = Field(default="", pattern=r"^(/[A-Za-z0-9_-]+)*$")

    @field_validator("n8n_webhook_url", mode="before")
    @classmethod
    def _empty_url_disables_webhook(cls, value: object) -> object:
        # "" or "none" disables notifications ("none" because Key Vault secrets cannot be empty).
        if value is None or (isinstance(value, str) and value.strip().lower() in ("", "none")):
            return None
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _deployed_envs_require_postgres(self) -> Self:
        # Guard against silently running a cluster on an ephemeral SQLite file.
        if self.environment in ("dev", "prod") and self.database_url.startswith("sqlite"):
            raise ValueError(f"ENVIRONMENT={self.environment} requires a PostgreSQL DATABASE_URL")
        return self

    @field_validator("metrics_file_path", mode="after")
    @classmethod
    def _resolve_relative_to_backend(cls, value: Path) -> Path:
        return value if value.is_absolute() else (BACKEND_DIR / value).resolve()


@lru_cache
def get_settings() -> Settings:
    secrets_dir = os.getenv("SECRETS_DIR")
    if secrets_dir and Path(secrets_dir).is_dir():
        return Settings(_secrets_dir=secrets_dir)
    return Settings()
