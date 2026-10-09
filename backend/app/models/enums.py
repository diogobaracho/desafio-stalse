"""Ticket enums - the single source of truth for allowed values."""

from enum import StrEnum


class TicketStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class TicketPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Channel(StrEnum):
    EMAIL = "email"
    CHAT = "chat"
    PHONE = "phone"
    WHATSAPP = "whatsapp"
    WEB = "web"


DEFAULT_STATUS = TicketStatus.OPEN
DEFAULT_PRIORITY = TicketPriority.MEDIUM
