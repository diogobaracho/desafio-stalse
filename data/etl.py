"""Support metrics ETL: raw ticket export (CSV/JSON) -> deterministic ``metrics.json``.

Pipeline (each step is a pure, individually tested function)::

    load -> normalize_columns -> validate_schema -> parse_dates -> compute_metrics -> write_json

Run from the repository root::

    python data/etl.py                     # synthetic sample -> data/processed/metrics.json
    python data/etl.py --input data/raw/customer_support_tickets.csv \
                       --generated-at 2026-10-08T00:00:00Z

Determinism: identical input + identical ``generated_at`` => byte-identical output. When
``--generated-at`` is omitted, the latest valid ``created_at`` in the data is used ("data as of"),
never the wall clock.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger("etl")

DATA_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = DATA_DIR / "raw" / "sample_tickets.csv"
DEFAULT_OUTPUT = DATA_DIR / "processed" / "metrics.json"

REQUIRED_COLUMNS = ("ticket_id", "created_at", "category", "channel", "priority")
OPTIONAL_COLUMNS = ("status",)

# Source column (after normalization) -> canonical column. Lets the Kaggle export
# ("Customer Support Ticket Dataset") and the synthetic sample share one pipeline.
COLUMN_ALIASES = {
    "date_of_purchase": "created_at",
    "ticket_type": "category",
    "ticket_channel": "channel",
    "ticket_priority": "priority",
    "ticket_status": "status",
}

TOP_CATEGORIES_LIMIT = 5


class SchemaError(ValueError):
    """The input is missing required columns or cannot be read."""


def load(path: Path) -> pd.DataFrame:
    """Read a CSV or JSON (array of records) file. All values are read as strings."""
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, dtype=str, keep_default_na=False)
    if suffix == ".json":
        records = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(records, list):
            raise SchemaError("JSON input must be an array of records.")
        return pd.DataFrame.from_records(records).astype(str)
    raise SchemaError(f"Unsupported input format: {suffix!r} (expected .csv or .json)")


def _snake_case(name: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^0-9a-zA-Z]+", "_", ascii_name).strip("_").lower()


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """snake_case column names, apply known aliases, strip whitespace from values."""
    renamed = {col: _snake_case(str(col)) for col in df.columns}
    out = df.rename(columns=renamed)
    out = out.rename(columns={k: v for k, v in COLUMN_ALIASES.items() if k in out.columns})
    for col in out.columns:
        out[col] = out[col].astype(str).str.strip()
    return out


def validate_schema(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise SchemaError(f"Missing required columns: {', '.join(missing)}")


def parse_dates(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Parse ``created_at`` (ISO 8601, assumed UTC when naive).

    Invalid or empty dates are a deliberate policy: the row is dropped from every aggregate,
    counted in ``invalid_dates_dropped`` and logged - never silently guessed.
    """
    parsed = pd.to_datetime(df["created_at"], errors="coerce", utc=True, format="ISO8601")
    invalid_mask = parsed.isna()
    invalid = int(invalid_mask.sum())
    if invalid:
        logger.warning(
            "Dropping %d row(s) with invalid created_at; ticket_ids=%s",
            invalid,
            df.loc[invalid_mask, "ticket_id"].tolist()[:20],
        )
    out = df.loc[~invalid_mask].copy()
    out["created_at"] = parsed[~invalid_mask]
    return out, invalid


def _counts(series: pd.Series) -> dict[str, int]:
    counts = series[series != ""].value_counts()
    # Sort by count desc, then label asc -> deterministic ties.
    ordered = sorted(counts.items(), key=lambda kv: (-int(kv[1]), str(kv[0])))
    return {str(label): int(count) for label, count in ordered}


def compute_metrics(
    df: pd.DataFrame,
    *,
    rows_read: int,
    invalid_dates: int,
    source_name: str,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Aggregate parsed rows into the metrics document consumed by ``GET /metrics``."""
    days = df["created_at"].dt.strftime("%Y-%m-%d")
    records_by_day = {str(day): int(n) for day, n in days.value_counts().sort_index().items()}

    categories = _counts(df["category"])
    top_categories = [
        {"category": name, "count": count}
        for name, count in list(categories.items())[:TOP_CATEGORIES_LIMIT]
    ]

    if generated_at is None and not df.empty:
        generated_at = df["created_at"].max().to_pydatetime()

    metrics: dict[str, Any] = {
        "generated_at": generated_at.isoformat().replace("+00:00", "Z") if generated_at else None,
        "source": {"file": source_name, "rows_read": rows_read},
        "total_records": len(df),
        "invalid_dates_dropped": invalid_dates,
        "date_range": {
            "start": min(records_by_day) if records_by_day else None,
            "end": max(records_by_day) if records_by_day else None,
        },
        "records_by_day": records_by_day,
        "top_categories": top_categories,
        "by_channel": _counts(df["channel"]),
        "by_priority": _counts(df["priority"]),
    }
    if "status" in df.columns:
        metrics["by_status"] = _counts(df["status"])
    return metrics


def write_json(metrics: dict[str, Any], path: Path) -> None:
    """Atomic JSON write (stable key order from compute_metrics, UTF-8, trailing newline)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def run(
    input_path: Path, output_path: Path, generated_at: datetime | None = None
) -> dict[str, Any]:
    raw = load(input_path)
    df = normalize_columns(raw)
    validate_schema(df)
    parsed, invalid = parse_dates(df)
    metrics = compute_metrics(
        parsed,
        rows_read=len(raw),
        invalid_dates=invalid,
        source_name=input_path.name,
        generated_at=generated_at,
    )
    write_json(metrics, output_path)
    logger.info("Wrote %s (%d valid records, %d invalid dates)", output_path, len(parsed), invalid)
    return metrics


def _parse_generated_at(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise argparse.ArgumentTypeError("--generated-at must include a timezone (e.g. Z)")
    return parsed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--input", type=Path, default=Path(os.getenv("ETL_INPUT", DEFAULT_INPUT)))
    parser.add_argument(
        "--output", type=Path, default=Path(os.getenv("ETL_OUTPUT", DEFAULT_OUTPUT))
    )
    parser.add_argument(
        "--generated-at",
        default=os.getenv("ETL_GENERATED_AT"),
        help="ISO 8601 timestamp with timezone; defaults to the latest created_at in the data",
    )
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s etl: %(message)s")

    try:
        run(args.input, args.output, _parse_generated_at(args.generated_at))
    except (SchemaError, FileNotFoundError, argparse.ArgumentTypeError, ValueError) as exc:
        logger.error("ETL failed: %s", exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
