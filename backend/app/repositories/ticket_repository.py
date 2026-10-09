"""Persistence for tickets. No business rules live here."""

from collections.abc import Sequence

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Ticket


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class TicketRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self, search: str | None = None) -> Sequence[Ticket]:
        query = select(Ticket).order_by(Ticket.created_at.desc(), Ticket.id.desc())
        if search:
            pattern = f"%{_escape_like(search)}%"
            query = query.where(
                or_(
                    Ticket.customer_name.ilike(pattern, escape="\\"),
                    Ticket.subject.ilike(pattern, escape="\\"),
                )
            )
        return self.session.scalars(query).all()

    def get(self, ticket_id: int) -> Ticket | None:
        return self.session.get(Ticket, ticket_id)

    def save(self, ticket: Ticket) -> Ticket:
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket
