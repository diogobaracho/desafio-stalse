# Implementation Plan: n8n Ticket Automation

**Spec**: [spec.md](spec.md)

## Design

```
Webhook (POST /webhook/stalse-ticket-updated, responseMode=responseNode)
  → IF "is valid ticket.updated event"
      true  → Code "Build notification" (summary text, reasons, ticket link)  → Respond 200 JSON
      false → Respond 400 JSON
```

- No credentials. The Code node only transforms data.
- In docker compose, n8n listens on `:5678` and the backend calls `http://n8n:5678/webhook/stalse-ticket-updated`.
- The workflow is imported automatically by `make n8n-import` (n8n CLI inside the container) and activated with `n8n update:workflow --active=true`.

## Constitution Check

I ✅ (one simple workflow) · IV ✅ (URL comes from backend env) · VII ✅ (no secrets in the export)

## Tasks

- [x] T001 `n8n/workflow.json`
- [x] T002 `n8n/README.md` (import, activate, test, troubleshoot)
- [x] T003 `make n8n-import` target
- [x] T004 Real screenshot `n8n/screenshot.png` captured from a running instance
