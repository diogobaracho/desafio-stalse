# Mini Inbox

A small customer-support inbox.

_Agents **list, search, open and triage tickets** (status and priority). Closing or escalating a ticket **notifies an n8n automation**. Team leads see **support metrics produced by a pandas ETL pipeline**._

## Quickstart

```bash
make compose-up          # or: docker compose up --build -d
```

## Repository map

```
backend/                FastAPI app (api → services → repositories / integrations), Alembic, seeds, tests
frontend/               Next.js app (app/ routes, components/, lib/api the only HTTP layer, i18n, brand)
data/                   etl.py, synthetic sample input, fixtures, tests, processed/metrics.json
n8n/                    workflow.json + README + real execution screenshot
```