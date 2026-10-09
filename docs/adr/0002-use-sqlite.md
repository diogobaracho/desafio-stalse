# ADR-0002: SQLite for the challenge, behind SQLAlchemy and Alembic

**Context.** The project must run locally from a clean checkout with no external services. The data set is about 20 tickets.

**Decision.** Use SQLite as the local database, accessed only through SQLAlchemy 2. **Alembic owns the schema**: `python -m app.db.init` runs `alembic upgrade head` and then an **idempotent seed** that inserts seed tickets whose fixed `id` is missing. It never duplicates rows and never overwrites agent edits. No database file is committed.

**Consequences.**
- Zero setup. Tests copy a migrated template DB per test, which keeps them fast and isolated.
- Enums are stored as `VARCHAR` + `CHECK` constraints (`native_enum=False`), which is portable and needs one migration to add a value.
- Timestamps are timezone-aware UTC. A `TypeDecorator` restores `tzinfo`, which SQLite drops.
- SQLite allows a single writer, so the local Kubernetes overlay runs one backend replica with `Recreate`. Azure uses PostgreSQL (ADR-0009).

**Alternatives.** PostgreSQL in compose from day one (heavier local setup, and the challenge explicitly asks for SQLite). `create_all()` instead of Alembic (cannot evolve a production schema).
