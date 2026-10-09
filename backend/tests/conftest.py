"""Test fixtures: every test gets its own SQLite file, migrated and seeded, plus a fake notifier.

No test performs real network I/O - the notifier is always replaced.
"""

import json
import shutil
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.api.deps import get_notifier, get_session
from app.core.config import Settings, get_settings
from app.db.init import init_database
from app.db.session import build_engine, iter_session, session_factory
from app.integrations.n8n import NotificationError, TicketEvent
from app.main import create_app


class FakeNotifier:
    def __init__(self, fail: bool = False) -> None:
        self.events: list[TicketEvent] = []
        self.fail = fail

    def notify(self, event: TicketEvent) -> None:
        self.events.append(event)
        if self.fail:
            raise NotificationError("ConnectError: n8n unreachable")


@pytest.fixture
def metrics_file(tmp_path: Path) -> Path:
    path = tmp_path / "metrics.json"
    path.write_text(json.dumps({"total_records": 3, "records_by_day": {"2026-10-01": 3}}))
    return path


@pytest.fixture
def settings(tmp_path: Path, metrics_file: Path) -> Settings:
    return Settings(
        _env_file=None,
        environment="test",
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        metrics_file_path=metrics_file,
        n8n_webhook_url=None,
        read_only_mode=False,
    )


@pytest.fixture(scope="session")
def template_db(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Migrate + seed once; each test gets a fresh copy (fast and fully isolated)."""
    path = tmp_path_factory.mktemp("template") / "template.db"
    engine = build_engine(f"sqlite:///{path}")
    init_database(engine)
    engine.dispose()
    return path


@pytest.fixture
def engine(settings: Settings, template_db: Path, tmp_path: Path) -> Iterator[Engine]:
    shutil.copyfile(template_db, tmp_path / "test.db")
    engine = build_engine(settings.database_url)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Iterator[Session]:
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def notifier() -> FakeNotifier:
    return FakeNotifier()


@pytest.fixture
def make_client(settings: Settings, engine: Engine, notifier: FakeNotifier):
    def _make(**overrides: object) -> TestClient:
        effective = settings.model_copy(update=overrides)
        app = create_app(effective)
        factory = session_factory(engine)
        app.dependency_overrides[get_settings] = lambda: effective
        app.dependency_overrides[get_session] = lambda: (yield from iter_session(factory))
        app.dependency_overrides[get_notifier] = lambda: notifier
        return TestClient(app)

    return _make


@pytest.fixture
def client(make_client) -> TestClient:
    return make_client()
