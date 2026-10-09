from typing import Annotated

from fastapi import APIRouter, Path, Query

from app.api.deps import TicketServiceDep
from app.schemas.error import ErrorResponse
from app.schemas.ticket import TicketRead, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])

TicketId = Annotated[int, Path(ge=1, description="Ticket id")]


@router.get("", response_model=list[TicketRead], summary="List tickets (newest first)")
def list_tickets(
    service: TicketServiceDep,
    search: Annotated[
        str | None,
        Query(max_length=100, description="Case-insensitive match on customer name or subject"),
    ] = None,
) -> list[TicketRead]:
    return [TicketRead.model_validate(t) for t in service.list_tickets(search)]


@router.get(
    "/{ticket_id}",
    response_model=TicketRead,
    responses={404: {"model": ErrorResponse}},
    summary="Get one ticket",
)
def get_ticket(ticket_id: TicketId, service: TicketServiceDep) -> TicketRead:
    return TicketRead.model_validate(service.get_ticket(ticket_id))


@router.patch(
    "/{ticket_id}",
    response_model=TicketRead,
    responses={
        403: {"model": ErrorResponse, "description": "Read-only environment"},
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
    summary="Update ticket status and/or priority",
)
def update_ticket(
    ticket_id: TicketId, update: TicketUpdate, service: TicketServiceDep
) -> TicketRead:
    return TicketRead.model_validate(service.update_ticket(ticket_id, update))
