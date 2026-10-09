# Data Model: Ticket Inbox API

## Ticket (`tickets` table)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | integer | PK, autoincrement | Seed tickets use fixed ids, which makes seeding idempotent |
| `created_at` | timestamp (tz) | NOT NULL, indexed | UTC; ISO 8601 in the API |
| `updated_at` | timestamp (tz) | NOT NULL | Refreshed on every successful PATCH |
| `customer_name` | varchar(120) | NOT NULL | |
| `channel` | varchar(16) | NOT NULL, CHECK in enum | `email, chat, phone, whatsapp, web` |
| `subject` | varchar(200) | NOT NULL | |
| `description` | text | NOT NULL | |
| `status` | varchar(16) | NOT NULL, CHECK in enum, default `open` | `open, in_progress, closed` |
| `priority` | varchar(16) | NOT NULL, CHECK in enum, default `medium` | `low, medium, high` |

Enums are stored as strings with CHECK constraints (`native_enum=False`). This behaves the same on SQLite and Postgres, and adding a value means one Alembic migration.

## State transitions and webhook triggers

```
status:   open ⇄ in_progress → closed   (any transition is allowed; reopening is allowed)
trigger:  status_closed  when old.status != closed  and new.status == closed
          priority_high  when old.priority != high  and new.priority == high
```

## Outbound event (`ticket.updated`)

```json
{
  "event": "ticket.updated",
  "trigger_reasons": ["status_closed", "priority_high"],
  "ticket": {
    "id": 1, "status": "closed", "priority": "high",
    "customer_name": "…", "subject": "…", "updated_at": "2026-10-08T12:00:00Z"
  }
}
```
