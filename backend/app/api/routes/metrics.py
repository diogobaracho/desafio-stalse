from typing import Any

from fastapi import APIRouter

from app.api.deps import MetricsServiceDep
from app.schemas.error import ErrorResponse

router = APIRouter(tags=["metrics"])


@router.get(
    "/metrics",
    responses={503: {"model": ErrorResponse, "description": "Metrics file missing or invalid"}},
    summary="Pre-computed support metrics produced by the ETL pipeline",
)
def get_metrics(service: MetricsServiceDep) -> dict[str, Any]:
    return service.read()
