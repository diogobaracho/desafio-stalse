import json
import os
from pathlib import Path

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.init import init_database, seed
from app.db.session import build_engine
from app.models import Ticket, TicketStatus


def test_seed_is_idempotent(engine, db_session: Session) -> None:
    assert db_session.scalar(select(func.count()).select_from(Ticket)) == 20

    inserted_again = init_database(engine)

    assert inserted_again == 0
    assert db_session.scalar(select(func.count()).select_from(Ticket)) == 20


def test_reseed_does_not_overwrite_agent_changes(engine, db_session: Session) -> None:
    ticket = db_session.get(Ticket, 3)
    assert ticket is not None
    ticket.status = TicketStatus.CLOSED
    db_session.commit()

    init_database(engine)

    db_session.expire_all()
    assert db_session.get(Ticket, 3).status == TicketStatus.CLOSED  # type: ignore[union-attr]


def test_seed_inserts_only_missing_rows(db_session: Session, tmp_path: Path) -> None:
    extra = tmp_path / "seed.json"
    extra.write_text(
        json.dumps(
            [
                {
                    "id": 99,
                    "created_at": "2026-10-05T10:00:00Z",
                    "customer_name": "Nova Cliente",
                    "channel": "web",
                    "subject": "Novo",
                    "description": "Novo ticket",
                    "status": "open",
                    "priority": "low",
                }
            ]
        )
    )

    assert seed(db_session, extra) == 1
    assert seed(db_session, extra) == 0


def test_database_rejects_invalid_enum_values(engine) -> None:
    with engine.begin() as conn, pytest.raises(Exception, match=r"(?i)check|constraint"):
        conn.exec_driver_sql("UPDATE tickets SET status = 'archived' WHERE id = 1")


@pytest.mark.postgres
@pytest.mark.skipif(not os.getenv("TEST_POSTGRES_URL"), reason="TEST_POSTGRES_URL not set")
def test_postgres_migrations_seed_and_search() -> None:
    engine = build_engine(os.environ["TEST_POSTGRES_URL"])
    with engine.begin() as conn:
        conn.exec_driver_sql("DROP TABLE IF EXISTS tickets, alembic_version")
    assert init_database(engine) == 20
    assert init_database(engine) == 0
    with Session(engine) as session:
        session.add(
            Ticket(
                customer_name="Novo",
                channel="web",
                subject="Teste PG",
                description="x",
            )
        )
        session.commit()  # sequence was advanced past the seeded ids
        hits = session.scalars(select(Ticket).where(Ticket.subject.ilike("%pagamento%"))).all()
        assert len(hits) == 3
    engine.dispose()
