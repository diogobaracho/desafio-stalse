"""Serves the pre-computed ETL output. Nothing is calculated at request time (ADR-0003)."""

import json
import logging
from pathlib import Path
from typing import Any

from app.core.errors import MetricsUnavailableError

logger = logging.getLogger(__name__)


class MetricsService:
    def __init__(self, metrics_path: Path) -> None:
        self.metrics_path = metrics_path

    def read(self) -> dict[str, Any]:
        try:
            raw = self.metrics_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.error("Metrics file not found", extra={"path": str(self.metrics_path)})
            raise MetricsUnavailableError() from None
        except OSError as exc:
            logger.error(
                "Metrics file unreadable", extra={"path": str(self.metrics_path), "error": str(exc)}
            )
            raise MetricsUnavailableError() from None

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error(
                "Metrics file is not valid JSON",
                extra={"path": str(self.metrics_path), "error": str(exc)},
            )
            raise MetricsUnavailableError("Metrics file is malformed.") from None

        if not isinstance(data, dict):
            logger.error(
                "Metrics file must contain a JSON object", extra={"path": str(self.metrics_path)}
            )
            raise MetricsUnavailableError("Metrics file is malformed.")
        return data
