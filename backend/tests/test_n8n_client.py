"""HTTP notifier tests use httpx.MockTransport - no real network."""

from datetime import UTC, datetime

import httpx
import pytest

from app.api.deps import get_notifier
from app.core.config import Settings
from app.integrations.n8n import (
    HttpN8nNotifier,
    NotificationError,
    NullNotifier,
    TicketEvent,
    TriggerReason,
)

EVENT = TicketEvent(
    ticket_id=1,
    status="closed",
    priority="high",
    customer_name="Mariana Souza",
    subject="Pagamento recusado",
    updated_at=datetime(2026, 10, 8, 12, 0, tzinfo=UTC),
    trigger_reasons=(TriggerReason.STATUS_CLOSED, TriggerReason.PRIORITY_HIGH),
)


def test_posts_payload_to_configured_url() -> None:
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    HttpN8nNotifier("http://n8n.test/webhook/x", 2.0, client).notify(EVENT)

    assert len(seen) == 1
    assert str(seen[0].url) == "http://n8n.test/webhook/x"
    assert seen[0].method == "POST"
    import json

    assert json.loads(seen[0].content) == {
        "event": "ticket.updated",
        "trigger_reasons": ["status_closed", "priority_high"],
        "ticket": {
            "id": 1,
            "status": "closed",
            "priority": "high",
            "customer_name": "Mariana Souza",
            "subject": "Pagamento recusado",
            "updated_at": "2026-10-08T12:00:00+00:00",
        },
    }


@pytest.mark.parametrize(
    "handler",
    [
        lambda r: httpx.Response(500),
        lambda r: (_ for _ in ()).throw(httpx.ConnectTimeout("timed out", request=r)),
    ],
)
def test_http_errors_and_timeouts_raise_notification_error(handler) -> None:
    client = httpx.Client(transport=httpx.MockTransport(handler))

    with pytest.raises(NotificationError):
        HttpN8nNotifier("http://n8n.test/webhook/x", 2.0, client).notify(EVENT)


def test_empty_webhook_url_selects_null_notifier() -> None:
    settings = Settings(_env_file=None, n8n_webhook_url="")
    notifier = get_notifier(settings)

    assert isinstance(notifier, NullNotifier)
    notifier.notify(EVENT)  # no-op, no error


def test_configured_url_selects_http_notifier_with_timeout() -> None:
    settings = Settings(
        _env_file=None, n8n_webhook_url="http://n8n:5678/webhook/x", n8n_webhook_timeout_seconds=1.5
    )
    notifier = get_notifier(settings)

    assert isinstance(notifier, HttpN8nNotifier)
    assert notifier.timeout == 1.5
