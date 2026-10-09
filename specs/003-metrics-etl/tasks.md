# Tasks: Support Metrics ETL

- [x] T001 `data/pyproject.toml` (pandas, pytest, ruff) and `data/README.md` (dataset docs)
- [x] T002 [P] Synthetic sample `data/raw/sample_tickets.csv` (labeled synthetic) plus fixtures (`valid.csv`, `valid.json`, `invalid_dates.csv`, `missing_columns.csv`)
  - Superseded: the default input is now the Kaggle CSV `data/raw/customer_support_tickets.csv` (CC0); the synthetic sample and its generator were removed. See FR-004.
- [x] T003 [US1] Tests: read CSV/JSON, normalize columns, date parsing, invalid dates, aggregation, ties, empty input, missing columns, output file creation, determinism
- [x] T004 [US1] Implement `data/etl.py`
- [x] T005 Generate and commit `data/processed/metrics.json`
- [x] T006 `data/Dockerfile` (non-root; runs once and exits)
