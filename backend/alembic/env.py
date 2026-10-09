from sqlalchemy import Connection

from alembic import context
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import build_engine
from app.models import Ticket  # noqa: F401  (register models on the metadata)

target_metadata = Base.metadata


def _run(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=connection.dialect.name == "sqlite",  # ALTER TABLE support on SQLite
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # A connection may be injected (tests / app.db.init) via config.attributes.
    connection = context.config.attributes.get("connection")
    if connection is not None:
        _run(connection)
        return
    engine = build_engine(get_settings().database_url)
    with engine.connect() as conn:
        _run(conn)


if context.is_offline_mode():
    context.configure(url=get_settings().database_url, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()
else:
    run_migrations_online()
