# ADR-0003: Serve precomputed ETL metrics; never aggregate at request time

**Context.** The dashboard shows aggregates computed from a separate data source, the Kaggle *Customer Support Ticket Dataset* (`data/raw/customer_support_tickets.csv`, CC0), not from the operational `tickets` table.

**Decision.** `data/etl.py` writes `metrics.json`, and `GET /metrics` reads and returns it unchanged. A missing, unreadable or malformed file returns **503 `metrics_unavailable`** and an error log, never a 500 or a stack trace.

**Consequences.**
- The API stays O(1) and decoupled from pandas. The ETL can change, be rescheduled or be scaled without touching the API.
- Data freshness = ETL schedule (a daily CronJob in Kubernetes, a one-shot job in compose). `generated_at` and `source` are shown in the UI so users know how fresh the numbers are.
- The file is shared through a volume (an Azure Files RWX PVC in AKS). If it grows or needs history, the next step is a `metrics` table or blob storage; the endpoint contract stays the same.

**Alternatives.** Compute in the endpoint with pandas (couples the API to analytics code; slow on real datasets). Compute from the `tickets` table with SQL (different data set from what the assignment asks).
