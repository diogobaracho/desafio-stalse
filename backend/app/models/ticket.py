from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.db.base import Base
from app.models.enums import DEFAULT_PRIORITY, DEFAULT_STATUS, Channel, TicketPriority, TicketStatus


def utcnow() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator[datetime]):
    """Stores timezone-aware UTC datetimes; SQLite drops tzinfo, so restore it on read."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: object) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Naive datetimes are not allowed; use UTC-aware values.")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: object) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _string_enum(enum_cls: type, name: str) -> Enum:
    # Stored as VARCHAR + CHECK constraint (portable; adding a value is one migration).
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=16,
        values_callable=lambda members: [m.value for m in members],
        validate_strings=True,
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)
    customer_name: Mapped[str] = mapped_column(String(120))
    channel: Mapped[Channel] = mapped_column(_string_enum(Channel, "channel"))
    subject: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[TicketStatus] = mapped_column(
        _string_enum(TicketStatus, "status"), default=DEFAULT_STATUS
    )
    priority: Mapped[TicketPriority] = mapped_column(
        _string_enum(TicketPriority, "priority"), default=DEFAULT_PRIORITY
    )

    def __repr__(self) -> str:
        return f"Ticket(id={self.id}, status={self.status}, priority={self.priority})"
