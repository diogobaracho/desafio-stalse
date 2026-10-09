from typing import Literal

from pydantic import BaseModel


class HealthRead(BaseModel):
    status: Literal["ok"] = "ok"
    service: str
    version: str
    environment: str
    read_only: bool
