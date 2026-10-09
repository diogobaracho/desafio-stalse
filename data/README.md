# Data pipeline (ETL)

`etl.py` turns a raw support-ticket export (CSV or JSON) into the **pre-computed**
`processed/metrics.json` that the API serves at `GET /metrics` ([ADR-0003](../docs/adr/0003-serve-precomputed-metrics.md)).

```bash
make kaggle-download                       # from repo root: fetch the latest Kaggle CSV into data/raw/
make etl                                   # Kaggle CSV -> data/processed/metrics.json
uv run --project data python data/etl.py   # same thing, no make
uv run --project data python data/etl.py --input other_export.json \
  --output /tmp/metrics.json --generated-at 2026-10-08T00:00:00Z
```

| Flag | Env var | Default |
|---|---|---|
| `--input` | `ETL_INPUT` | `data/raw/customer_support_tickets.csv` |
| `--output` | `ETL_OUTPUT` | `data/processed/metrics.json` |
| `--generated-at` | `ETL_GENERATED_AT` | latest valid `created_at` in the data |

The exit code is `0` on success and `1` on a schema or input error. Nothing is written on failure.

## Pipeline

```
load → normalize_columns → validate_schema → parse_dates → compute_metrics → write_json
```

| Step | Behavior |
|---|---|
| `load` | `.csv` or `.json` (array of records); every value is read as a string |
| `normalize_columns` | `snake_case`, accent-stripped names; aliases (`date_of_purchase→created_at`, `ticket_type→category`, `ticket_channel→channel`, `ticket_priority→priority`, `ticket_status→status`); trims values |
| `validate_schema` | required: `ticket_id, created_at, category, channel, priority`; optional: `status` |
| `parse_dates` | strict ISO 8601, naive values = UTC. **Invalid or empty dates are dropped, counted in `invalid_dates_dropped` and logged** (never guessed) |
| `compute_metrics` | see the output below |
| `write_json` | atomic write, stable key order, UTF-8, trailing newline |

## Output (`processed/metrics.json`)

| Key | Meaning |
|---|---|
| `generated_at` | "Data as of": injected clock or the latest valid `created_at` (keeps output deterministic) |
| `source` | `{file, rows_read}` |
| `total_records` | Rows with a valid date (the rows used in every aggregate) |
| `invalid_dates_dropped` | Rows excluded because of invalid dates |
| `date_range` | `{start, end}` (UTC days) |
| `records_by_day` | `{YYYY-MM-DD: count}`, chronological |
| `top_categories` | Top 5 `[{category, count}]`; ties broken alphabetically |
| `by_channel`, `by_priority`, `by_status` | `{label: count}`, count desc then label |

**Determinism:** the same input and the same `generated_at` produce byte-identical output. CI regenerates the file and fails on drift.

## Dataset

| | |
|---|---|
| Dataset | **Customer Support Ticket Dataset** (Kaggle, author *suraj520*), version 1, updated 2023-06-02 |
| Page | https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset |
| License | **CC0: Public Domain**, so the file can be committed |
| Committed file | `data/raw/customer_support_tickets.csv`: the Kaggle CSV **unmodified** (8,469 rows, 3.9 MB) |
| SHA-256 | `b06a9cde84da65db388bd964d75f88ee1eed96607cf75d0c35f09c3f11bf8bea` |
| Columns used | `Ticket ID`, `Date of Purchase` (→ `created_at`), `Ticket Type` (→ `category`), `Ticket Channel`, `Ticket Priority`, `Ticket Status` |

**Download the latest version** (no Kaggle account or API token needed):

```bash
make kaggle-download
# same thing without make:
curl -fL -o /tmp/dataset.zip \
  https://www.kaggle.com/api/v1/datasets/download/suraj520/customer-support-ticket-dataset
unzip -o /tmp/dataset.zip customer_support_tickets.csv -d data/raw
```

Then run `make etl`. If Kaggle publishes a new version, commit the new CSV together with the regenerated
`metrics.json` (CI fails if they drift apart).

**Limitation.** The dataset's only date column is the purchase date (`Date of Purchase`), so
`records_by_day` measures *purchases behind tickets per day* (2020-01-01 to 2021-12-30), not ticket
creation. A production export would carry the ticket creation timestamp. The rest of the columns
(customer e-mail, age, description, satisfaction…) are ignored by the pipeline.

Invalid dates: the Kaggle file has none (`invalid_dates_dropped: 0`). The drop-and-count policy is
covered by `fixtures/invalid_dates.csv` and the tests.

## Running in containers

- **docker compose**: the `etl` service runs once on every `docker compose up` and writes to the volume that the backend reads. To re-run it: `docker compose run --rm etl`.
- **Kubernetes**: the `etl` CronJob (daily) writes to the shared metrics PVC (Azure Files in Azure). Trigger it manually with `kubectl create job --from=cronjob/etl etl-manual -n stalse`.

## Tests

```bash
cd data && uv run pytest --cov   # reading, normalization, dates, invalid dates, aggregation, shape, determinism, CLI
```
