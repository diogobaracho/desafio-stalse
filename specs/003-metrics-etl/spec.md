# Feature Specification: Support Metrics ETL

**Feature Branch**: `003-metrics-etl`

**Created**: 2026-10-08

**Status**: Implemented

**Input**: "A reproducible pandas pipeline that turns a raw support-ticket export into a small, deterministic metrics.json served by the API."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate metrics from a raw export (Priority: P1) 🎯

A data engineer runs one command from the repository root and gets `data/processed/metrics.json`.

**Acceptance Scenarios**:

1. **Given** `data/raw/customer_support_tickets.csv` (Kaggle), **When** `make etl` runs, **Then** `metrics.json` contains `total_records`, `records_by_day`, `top_categories`, `by_channel`, `by_priority`, `invalid_dates_dropped`, `source` and `generated_at`.
2. **Given** the same input and the same `--generated-at`, **When** the pipeline runs twice, **Then** the outputs are byte-identical.
3. **Given** rows with unparseable dates, **Then** they are excluded from every aggregate and counted in `invalid_dates_dropped`, and a warning is logged.
4. **Given** a file missing a required column, **Then** the run fails with a clear `SchemaError` and a non-zero exit code, and no output is written.
5. **Given** a JSON input (records array), **Then** the result matches the CSV equivalent.

### Edge Cases

- Column names with spaces, mixed case or accents are normalized (`"Date of Purchase"` → `date_of_purchase`).
- Ties in `top_categories` are broken alphabetically for determinism.
- An empty input produces a valid file with zero counts.

## Requirements *(mandatory)*

- **FR-001**: Input: CSV or JSON in `data/raw/`. Required columns (after normalization): `ticket_id`, `created_at`, `category`, `channel`, `priority`.
- **FR-002**: Output: UTF-8 JSON, stable key order (breakdowns ordered by count desc, then label), 2-space indent, trailing newline.
- **FR-003**: Pure, individually testable functions. The clock is injectable.
- **FR-004**: The committed input is the Kaggle *Customer Support Ticket Dataset* (CC0), unmodified, with its source documented. `make kaggle-download` fetches the latest version.

## Success Criteria *(mandatory)*

- **SC-001**: CI regenerates `metrics.json` and fails if it differs from the committed file.
- **SC-002**: Tests cover reading, date parsing, invalid dates, aggregation, output shape, missing columns and file creation.
