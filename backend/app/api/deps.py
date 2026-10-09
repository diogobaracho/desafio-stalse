"""FastAPI dependency wiring. Tests override ``get_settings``, ``get_session`` and
``get_notifier`` through ``app.dependency_overrides``."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_engine, iter_session, session_factory
from app.integrations.n8n import HttpN8nNotifier, NullNotifier, TicketEventNotifier
from app.repositories.ticket_repository import TicketRepository
from app.services.metrics_service import MetricsService
from app.services.ticket_service import TicketService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_session(settings: SettingsDep) -> Iterator[Session]:
    yield from iter_session(session_factory(get_engine(settings.database_url)))


def get_notifier(settings: SettingsDep) -> TicketEventNotifier:
    if settings.n8n_webhook_url is None:
        return NullNotifier()
    return HttpN8nNotifier(str(settings.n8n_webhook_url), settings.n8n_webhook_timeout_seconds)


def get_ticket_service(
    settings: SettingsDep,
    session: Annotated[Session, Depends(get_session)],
    notifier: Annotated[TicketEventNotifier, Depends(get_notifier)],
) -> TicketService:
    return TicketService(TicketRepository(session), notifier, read_only=settings.read_only_mode)


def get_metrics_service(settings: SettingsDep) -> MetricsService:
    return MetricsService(settings.metrics_file_path)


TicketServiceDep = Annotated[TicketService, Depends(get_ticket_service)]
MetricsServiceDep = Annotated[MetricsService, Depends(get_metrics_service)]
