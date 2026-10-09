# Implementation Plan: Support Metrics ETL

**Branch**: `003-metrics-etl` | **Spec**: [spec.md](spec.md)

## Summary

A single module, `data/etl.py`, with pure functions and a thin argparse CLI. It is packaged with its own `pyproject.toml` and `Dockerfile`, so it can run as a Kubernetes CronJob that writes to a volume the backend mounts read-only.

## Technical Context

**Language**: Python 3.12 · **Deps**: pandas · **Tests**: pytest with small fixtures in `data/fixtures/`

## Constitution Check

- I ✅ One file, no orchestration framework.
- III ✅ Behavior tests on outputs, not pandas internals.
- IV ✅ Input and output paths plus the clock come from CLI flags/env (`ETL_INPUT`, `ETL_OUTPUT`, `ETL_GENERATED_AT`).
- VI ✅ Own image and CI filter (`data/**`).

## Pipeline

```
load(path) → normalize_columns(df) → validate_schema(df) → parse_dates(df) → (valid_df, invalid_count)
          → compute_metrics(valid_df, invalid_count, source, generated_at) → write_json(metrics, path)
```

`generated_at` defaults to the latest valid `created_at` in the data rather than wall-clock time. This keeps the default deterministic and still meaningful as "data as of". `--generated-at` overrides it.

## Tasks

See [tasks.md](tasks.md).
