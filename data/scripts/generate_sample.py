"""Generate the SYNTHETIC sample input ``data/raw/sample_tickets.csv``.

The file mimics the column layout of the Kaggle "Customer Support Ticket Dataset" so the real
export can be dropped in without code changes. Values are random (fixed seed) and do NOT come
from Kaggle. A few invalid dates are injected on purpose to exercise the ETL's validation.

Usage: ``uv run python scripts/generate_sample.py`` (from ``data/``).
"""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "raw" / "sample_tickets.csv"

TYPES = {
    "Technical issue": 0.30,
    "Billing inquiry": 0.24,
    "Refund request": 0.18,
    "Product inquiry": 0.16,
    "Cancellation request": 0.12,
}
CHANNELS = {"Email": 0.35, "Chat": 0.30, "Phone": 0.20, "Social media": 0.15}
PRIORITIES = {"Low": 0.30, "Medium": 0.35, "High": 0.25, "Critical": 0.10}
STATUSES = {"Closed": 0.45, "Open": 0.30, "Pending Customer Response": 0.25}
INVALID_DATES = ["not a date", "2026-02-30", ""]


def pick(rng: random.Random, weights: dict[str, float]) -> str:
    return rng.choices(list(weights), weights=list(weights.values()))[0]


def main() -> None:
    rng = random.Random(42)
    start = date(2026, 9, 1)
    rows = []
    for ticket_id in range(1, 151):
        created = (start + timedelta(days=rng.randint(0, 29))).isoformat()
        rows.append(
            {
                "Ticket ID": ticket_id,
                "Created At": created,
                "Ticket Type": pick(rng, TYPES),
                "Ticket Channel": pick(rng, CHANNELS),
                "Ticket Priority": pick(rng, PRIORITIES),
                "Ticket Status": pick(rng, STATUSES),
            }
        )
    for i, bad in enumerate(INVALID_DATES):
        rows[10 + i * 37]["Created At"] = bad

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} synthetic rows to {OUT}")


if __name__ == "__main__":
    main()
