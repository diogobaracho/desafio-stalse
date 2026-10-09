"""Ticket business rules: listing, updating, and deciding when to notify automation."""

import logging
from collections.abc import Sequence

from app.core.errors import ReadOnlyModeError, TicketNotFoundError
from app.integrations.n8n import (
    NotificationError,
    TicketEvent,
    TicketEventNotifier,
    TriggerReason,
)
from app.models import Ticket, TicketPriority, TicketStatus
from app.repositories.ticket_repository import TicketRepository
from app.schemas.ticket import TicketUpdate

logger = logging.getLogger(__name__)


def detect_trigger_reasons(
    old_status: TicketStatus,
    old_priority: TicketPriority,
    new_status: TicketStatus,
    new_priority: TicketPriority,
) -> tuple[TriggerReason, ...]:
    """A trigger fires only on a *transition into* the triggering value (ADR-0004)."""
    reasons: list[TriggerReason] = []
    if old_status != TicketStatus.CLOSED and new_status == TicketStatus.CLOSED:
        reasons.append(TriggerReason.STATUS_CLOSED)
    if old_priority != TicketPriority.HIGH and new_priority == TicketPriority.HIGH:
        reasons.append(TriggerReason.PRIORITY_HIGH)
    return tuple(reasons)


class TicketService:
    def __init__(
        self,
        repository: TicketRepository,
        notifier: TicketEventNotifier,
        read_only: bool = False,
    ) -> None:
        self.repository = repository
        self.notifier = notifier
        self.read_only = read_only

    def list_tickets(self, search: str | None = None) -> Sequence[Ticket]:
        term = search.strip() if search else None
        return self.repository.list(term or None)

    def get_ticket(self, ticket_id: int) -> Ticket:
        ticket = self.repository.get(ticket_id)
        if ticket is None:
            raise TicketNotFoundError(ticket_id)
        return ticket

    def update_ticket(self, ticket_id: int, update: TicketUpdate) -> Ticket:
        if self.read_only:
            raise ReadOnlyModeError()

        ticket = self.get_ticket(ticket_id)
        old_status, old_priority = ticket.status, ticket.priority

        if update.status is not None:
            ticket.status = update.status
        if update.priority is not None:
            ticket.priority = update.priority

        # 1) Persist first: the update must never depend on the automation service.
        ticket = self.repository.save(ticket)
        logger.info(
            "Ticket updated",
            extra={
                "ticket_id": ticket.id,
                "changes": {k: str(v) for k, v in update.changes().items()},
            },
        )

        # 2) Then notify, at most once per update, with every reason.
        reasons = detect_trigger_reasons(old_status, old_priority, ticket.status, ticket.priority)
        if reasons:
            self._notify(ticket, reasons)
        return ticket

    def _notify(self, ticket: Ticket, reasons: tuple[TriggerReason, ...]) -> None:
        event = TicketEvent(
            ticket_id=ticket.id,
            status=ticket.status.value,
            priority=ticket.priority.value,
            customer_name=ticket.customer_name,
            subject=ticket.subject,
            updated_at=ticket.updated_at,
            trigger_reasons=reasons,
        )
        try:
            self.notifier.notify(event)
        except NotificationError as exc:
            # Best-effort delivery (ADR-0004): log with context, never fail the request.
            logger.warning(
                "Webhook delivery failed; ticket update kept",
                extra={
                    "ticket_id": ticket.id,
                    "trigger_reasons": [r.value for r in reasons],
                    "error": str(exc),
                },
            )
