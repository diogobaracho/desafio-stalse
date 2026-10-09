from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import Channel, TicketPriority, TicketStatus


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    customer_name: str
    channel: Channel
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority


class TicketUpdate(BaseModel):
    """Partial update. Only status/priority may change; unknown fields are rejected."""

    model_config = ConfigDict(extra="forbid")

    status: TicketStatus | None = Field(default=None, description="New status")
    priority: TicketPriority | None = Field(default=None, description="New priority")

    @model_validator(mode="after")
    def _require_at_least_one_field(self) -> Self:
        if self.status is None and self.priority is None:
            raise ValueError("Provide at least one of: status, priority.")
        return self

    def changes(self) -> dict[str, TicketStatus | TicketPriority]:
        return self.model_dump(exclude_none=True)
