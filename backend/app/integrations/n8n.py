"""Outbound notifications to n8n.

The service layer depends on the ``TicketEventNotifier`` protocol, not on HTTP. This keeps
the business rule ("notify on transition") testable with a fake and lets an empty
``N8N_WEBHOOK_URL`` disable notifications cleanly (``NullNotifier``).
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any, Protocol

import httpx

logger = logging.getLogger(__name__)


class TriggerReason(StrEnum):
    STATUS_CLOSED = "status_closed"
    PRIORITY_HIGH = "priority_high"


@dataclass(frozen=True)
class TicketEvent:
    ticket_id: int
    status: str
    priority: str
    customer_name: str
    subject: str
    updated_at: datetime
    trigger_reasons: tuple[TriggerReason, ...]
    event: str = field(default="ticket.updated")

    def to_payload(self) -> dict[str, Any]:
        return {
            "event": self.event,
            "trigger_reasons": [r.value for r in self.trigger_reasons],
            "ticket": {
                "id": self.ticket_id,
                "status": self.status,
                "priority": self.priority,
                "customer_name": self.customer_name,
                "subject": self.subject,
                "updated_at": self.updated_at.isoformat(),
            },
        }


class NotificationError(Exception):
    """Raised when an event could not be delivered."""


class TicketEventNotifier(Protocol):
    def notify(self, event: TicketEvent) -> None: ...


class NullNotifier:
    """Used when no webhook URL is configured."""

    def notify(self, event: TicketEvent) -> None:
        logger.debug("Webhook disabled; event not sent", extra={"ticket_id": event.ticket_id})


class HttpN8nNotifier:
    def __init__(self, url: str, timeout_seconds: float, client: httpx.Client | None = None):
        self.url = url
        self.timeout = timeout_seconds
        self.client = client or httpx.Client(timeout=timeout_seconds)

    def notify(self, event: TicketEvent) -> None:
        try:
            response = self.client.post(self.url, json=event.to_payload(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise NotificationError(f"{type(exc).__name__}: {exc}") from exc
        logger.info(
            "Webhook delivered",
            extra={
                "ticket_id": event.ticket_id,
                "trigger_reasons": [r.value for r in event.trigger_reasons],
                "status_code": response.status_code,
            },
        )
