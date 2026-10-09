# Feature Specification: n8n Ticket Automation

**Feature Branch**: `004-n8n-automation`

**Created**: 2026-10-08

**Status**: Implemented

**Input**: "An importable n8n workflow that receives the backend's `ticket.updated` event and performs a simple action."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive and act on ticket events (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the workflow is imported and active, **When** the backend POSTs a `ticket.updated` event, **Then** the workflow validates it, builds a human-readable summary (for example "Ticket #3 closed and escalated to high priority"), and responds 200 with the summary.
2. **Given** a payload without `ticket.id` or `trigger_reasons`, **Then** the workflow responds 400 with an error message.
3. **Given** n8n is not running, **Then** the backend still completes the update (see 001 FR-007).

## Requirements *(mandatory)*

- **FR-001**: `n8n/workflow.json` is importable through the UI or `n8n import:workflow`.
- **FR-002**: The workflow contains no credentials, tokens or environment-specific URLs.
- **FR-003**: The webhook path is `stalse-ticket-updated` (production URL `/webhook/stalse-ticket-updated`).
- **FR-004**: The README documents import, activation, the test curl command and the backend env var.

## Assumptions

- n8n runs only locally (docker compose or kind). Azure envs point `N8N_WEBHOOK_URL` at an externally hosted n8n (for example n8n Cloud) through Key Vault, or leave it empty to disable notifications.
