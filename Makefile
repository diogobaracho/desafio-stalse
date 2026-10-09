# Stalse Mini Inbox - common commands. Run `make help`.
# Requires: uv (Python), Node >= 22 + npm, Docker. Optional: kind, kubectl, helm, terraform, tflint.

SHELL := /bin/bash
.DEFAULT_GOAL := help

BACKEND := backend
FRONTEND := frontend
DATA := data
TF_DIR := infra/terraform

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# --- Setup -------------------------------------------------------------------------------
.PHONY: install
install: ## Install all dependencies (backend, data, frontend, Playwright browser)
	cd $(BACKEND) && uv sync
	cd $(DATA) && uv sync
	cd $(FRONTEND) && npm ci && npx playwright install chromium
	@[ -f $(BACKEND)/.env ] || cp $(BACKEND)/.env.example $(BACKEND)/.env
	@[ -f $(FRONTEND)/.env.local ] || cp $(FRONTEND)/.env.example $(FRONTEND)/.env.local

# --- Run natively --------------------------------------------------------------------------
.PHONY: seed
seed: ## Create/migrate the database and load seed tickets (idempotent)
	cd $(BACKEND) && uv run python -m app.db.init

.PHONY: etl
etl: ## Regenerate data/processed/metrics.json from the raw input
	uv run --project $(DATA) python $(DATA)/etl.py

.PHONY: backend
backend: seed ## Run the API with reload on http://localhost:8000 (docs: /docs)
	cd $(BACKEND) && uv run uvicorn app.main:app --reload --port 8000

.PHONY: frontend
frontend: ## Run the Next.js dev server on http://localhost:3000
	cd $(FRONTEND) && npm run dev

.PHONY: openapi
openapi: ## Export the OpenAPI contract to specs/001-ticket-inbox-api/contracts/
	cd $(BACKEND) && uv run python -m scripts.export_openapi

# --- Quality -------------------------------------------------------------------------------
.PHONY: test
test: test-backend test-data test-frontend ## Run all unit/integration tests with coverage gates

.PHONY: test-backend
test-backend:
	cd $(BACKEND) && uv run pytest --cov --cov-report=term --cov-report=html

.PHONY: test-data
test-data:
	cd $(DATA) && uv run pytest --cov --cov-report=term

.PHONY: test-frontend
test-frontend:
	cd $(FRONTEND) && npm run test:coverage

.PHONY: e2e
e2e: ## Run Playwright E2E against a running stack (E2E_BASE_URL, default http://localhost:3000)
	cd $(FRONTEND) && npm run test:e2e

.PHONY: lint
lint: ## Lint + type-check everything
	cd $(BACKEND) && uv run ruff check . && uv run ruff format --check . && uv run mypy app
	cd $(DATA) && uv run ruff check . && uv run ruff format --check . && uv run mypy etl.py
	cd $(FRONTEND) && npm run lint && npm run typecheck && npm run format:check

.PHONY: format
format: ## Auto-format all code
	cd $(BACKEND) && uv run ruff check --fix . && uv run ruff format .
	cd $(DATA) && uv run ruff check --fix . && uv run ruff format .
	cd $(FRONTEND) && npm run format
	terraform fmt -recursive $(TF_DIR)

.PHONY: check
check: lint test contracts ## Everything CI checks locally (lint, tests, contract/metrics drift)

.PHONY: contracts
contracts: ## Fail if the OpenAPI contract or metrics.json are out of date
	cd $(BACKEND) && uv run python -m scripts.export_openapi --check
	uv run --project $(DATA) python $(DATA)/etl.py --output /tmp/stalse-metrics.json >/dev/null 2>&1
	diff -u $(DATA)/processed/metrics.json /tmp/stalse-metrics.json

.PHONY: coverage
coverage: test ## Run tests and print where the HTML coverage reports are
	@echo "backend:  $(BACKEND)/htmlcov/index.html"
	@echo "frontend: $(FRONTEND)/coverage/index.html"

.PHONY: reset
reset: ## Delete the local SQLite database and re-seed
	rm -f $(BACKEND)/var/stalse.db
	$(MAKE) seed

# --- Docker compose ------------------------------------------------------------------------
.PHONY: compose-up
compose-up: ## Build and start backend, frontend, n8n (+ ETL job) with docker compose
	docker compose up --build -d
	@echo "UI http://localhost:3000 · API http://localhost:8000/docs · n8n http://localhost:5678"

.PHONY: compose-down
compose-down: ## Stop the compose stack (keeps volumes)
	docker compose down

.PHONY: compose-reset
compose-reset: ## Stop the compose stack and delete its volumes (DB, metrics, n8n)
	docker compose down -v

.PHONY: compose-debug
compose-debug: ## Compose with the backend under debugpy (attach on :5679)
	docker compose -f docker-compose.yml -f deploy/compose/docker-compose.debug.yml up --build

.PHONY: n8n-import
n8n-import: ## Re-import + publish the n8n workflow into the running compose n8n
	docker compose run --rm n8n-init && docker compose restart n8n

# --- Local Kubernetes (kind) ---------------------------------------------------------------
.PHONY: k8s-up
k8s-up: ## Create a kind cluster with Traefik and deploy the local overlay
	scripts/k8s-local.sh up

.PHONY: k8s-down
k8s-down: ## Delete the kind cluster
	scripts/k8s-local.sh down

.PHONY: k8s-validate
k8s-validate: ## Render every overlay and validate with kubeconform (Docker)
	@mkdir -p .k8s-render
	@for o in local azure-dev azure-prod; do \
	  kubectl kustomize --load-restrictor LoadRestrictionsNone deploy/k8s/overlays/$$o > .k8s-render/$$o.yaml; done
	docker run --rm -v $(CURDIR)/.k8s-render:/m ghcr.io/yannh/kubeconform:v0.7.0 -strict -summary \
	  -kubernetes-version 1.33.0 -schema-location default \
	  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
	  /m/local.yaml /m/azure-dev.yaml /m/azure-prod.yaml

# --- Terraform -----------------------------------------------------------------------------
.PHONY: tf-fmt
tf-fmt: ## Format Terraform
	terraform fmt -recursive $(TF_DIR)

.PHONY: tf-validate
tf-validate: ## terraform validate + tflint for bootstrap, dev and prod (no Azure access needed)
	terraform fmt -check -recursive $(TF_DIR)
	@for d in bootstrap envs/dev envs/prod; do \
	  echo "== $$d"; \
	  (cd $(TF_DIR)/$$d && terraform init -backend=false -input=false >/dev/null && terraform validate) || exit 1; \
	  tflint --chdir=$(TF_DIR)/$$d --config=$(CURDIR)/$(TF_DIR)/.tflint.hcl || exit 1; \
	done
