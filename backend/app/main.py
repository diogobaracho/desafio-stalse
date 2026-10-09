"""FastAPI application factory."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, metrics, tickets
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.db.session import get_engine

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level, settings.log_format)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        if settings.seed_on_startup:
            from app.db.init import init_database

            init_database(get_engine(settings.database_url))
        logger.info(
            "API started",
            extra={
                "environment": settings.environment,
                "read_only": settings.read_only_mode,
                "webhook_enabled": settings.n8n_webhook_url is not None,
            },
        )
        yield

    app = FastAPI(
        title="Stalse Mini Inbox API",
        version=settings.version,
        description="Customer-support ticket inbox: tickets, triage, ETL metrics.",
        root_path=settings.root_path,
        lifespan=lifespan,
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )
    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(tickets.router)
    app.include_router(metrics.router)
    return app


app = create_app()
