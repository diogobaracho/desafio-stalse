"""Database initialization: ``python -m app.db.init``.

1. ``alembic upgrade head`` - the schema is owned by migrations (SQLite and PostgreSQL).
2. Idempotent seed - tickets from ``seeds/tickets.json`` are inserted only if their fixed id is
   not already present, so re-running never duplicates rows nor overwrites agent changes.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

from alembic.config import Config
from sqlalchemy import Engine, select, text
from sqlalchemy.orm import Session

from alembic import command
from app.core.config import BACKEND_DIR, get_settings
from app.core.logging import configure_logging
from app.db.session import build_engine
from app.models import Channel, Ticket, TicketPriority, TicketStatus

logger = logging.getLogger(__name__)

SEED_FILE = BACKEND_DIR / "seeds" / "tickets.json"


def run_migrations(engine: Engine) -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


def load_seed_tickets(path: Path = SEED_FILE) -> list[Ticket]:
    records = json.loads(path.read_text(encoding="utf-8"))
    tickets = []
    for r in records:
        created_at = datetime.fromisoformat(r["created_at"])
        tickets.append(
            Ticket(
                id=r["id"],
                created_at=created_at,
                updated_at=created_at,
                customer_name=r["customer_name"],
                channel=Channel(r["channel"]),
                subject=r["subject"],
                description=r["description"],
                status=TicketStatus(r["status"]),
                priority=TicketPriority(r["priority"]),
            )
        )
    return tickets


def seed(session: Session, path: Path = SEED_FILE) -> int:
    """Insert missing seed tickets. Returns how many rows were inserted."""
    existing_ids = set(session.scalars(select(Ticket.id)))
    missing = [t for t in load_seed_tickets(path) if t.id not in existing_ids]
    session.add_all(missing)
    session.flush()
    if session.get_bind().dialect.name == "postgresql":
        # Explicit ids bypass the sequence; move it past the highest id.
        session.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('tickets', 'id'), "
                "COALESCE((SELECT MAX(id) FROM tickets), 1))"
            )
        )
    session.commit()
    return len(missing)


def init_database(engine: Engine) -> int:
    run_migrations(engine)
    with Session(engine) as session:
        inserted = seed(session)
    logger.info("Database initialized", extra={"seeded": inserted})
    return inserted


def main() -> None:
    settings = get_settings()
    configure_logging(settings.log_level, settings.log_format)
    init_database(build_engine(settings.database_url))


if __name__ == "__main__":
    main()
