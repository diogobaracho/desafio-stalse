# syntax=docker/dockerfile:1.7
# Build context: data/ (independently deployable ETL job; runs once and exits).

FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-install-project

FROM python:3.12-slim
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 \
    ETL_INPUT=/app/raw/customer_support_tickets.csv \
    ETL_OUTPUT=/output/metrics.json
RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app app \
    && mkdir -p /output && chown app:app /output
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY etl.py ./
# Kaggle export baked in as the default input; mount a volume at /app/raw (or set
# ETL_INPUT) to process another export.
COPY raw/customer_support_tickets.csv ./raw/
USER 10001
ENTRYPOINT ["python", "etl.py"]
