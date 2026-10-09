from fastapi import APIRouter

from app.api.deps import SettingsDep
from app.schemas.health import HealthRead

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthRead, summary="Liveness/readiness and runtime flags")
def health(settings: SettingsDep) -> HealthRead:
    return HealthRead(
        service=settings.app_name,
        version=settings.version,
        environment=settings.environment,
        read_only=settings.read_only_mode,
    )
