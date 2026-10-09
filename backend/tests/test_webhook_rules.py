"""Business rule: notify n8n only on *transitions into* closed / high (ADR-0004)."""

import logging

import pytest
from fastapi.testclient import TestClient

from app.integrations.n8n import TriggerReason
from tests.conftest import FakeNotifier

# Seed reference: #3 open/medium, #1 open/high, #6 closed/low, #9 closed/medium.


def test_transition_to_closed_sends_one_event(client: TestClient, notifier: FakeNotifier) -> None:
    client.patch("/tickets/3", json={"status": "closed"})

    assert len(notifier.events) == 1
    event = notifier.events[0]
    assert event.trigger_reasons == (TriggerReason.STATUS_CLOSED,)
    payload = event.to_payload()
    assert payload["event"] == "ticket.updated"
    assert payload["trigger_reasons"] == ["status_closed"]
    assert payload["ticket"]["id"] == 3
    assert payload["ticket"]["status"] == "closed"
    assert payload["ticket"]["updated_at"].endswith("+00:00")


def test_transition_to_high_sends_one_event(client: TestClient, notifier: FakeNotifier) -> None:
    client.patch("/tickets/3", json={"priority": "high"})

    assert [e.trigger_reasons for e in notifier.events] == [(TriggerReason.PRIORITY_HIGH,)]


def test_both_transitions_in_one_update_send_a_single_event(
    client: TestClient, notifier: FakeNotifier
) -> None:
    client.patch("/tickets/3", json={"status": "closed", "priority": "high"})

    assert len(notifier.events) == 1
    assert notifier.events[0].to_payload()["trigger_reasons"] == ["status_closed", "priority_high"]


@pytest.mark.parametrize(
    ("ticket_id", "body"),
    [
        (3, {"status": "in_progress"}),  # not a triggering value
        (3, {"priority": "low"}),
        (6, {"status": "closed"}),  # already closed: same value again
        (6, {"priority": "medium"}),  # already closed: unrelated change
        (1, {"priority": "high"}),  # already high: same value again
        (1, {"status": "in_progress"}),  # already high: unrelated change
    ],
)
def test_no_event_without_a_transition(
    client: TestClient, notifier: FakeNotifier, ticket_id: int, body: dict[str, str]
) -> None:
    assert client.patch(f"/tickets/{ticket_id}", json=body).status_code == 200
    assert notifier.events == []


def test_closing_an_already_high_ticket_reports_only_closed(
    client: TestClient, notifier: FakeNotifier
) -> None:
    client.patch("/tickets/1", json={"status": "closed", "priority": "high"})

    assert notifier.events[0].trigger_reasons == (TriggerReason.STATUS_CLOSED,)


def test_reopen_then_close_again_notifies_again(client: TestClient, notifier: FakeNotifier) -> None:
    client.patch("/tickets/6", json={"status": "open"})
    client.patch("/tickets/6", json={"status": "closed"})

    assert len(notifier.events) == 1


def test_webhook_failure_does_not_undo_the_update(
    make_client, notifier: FakeNotifier, caplog: pytest.LogCaptureFixture
) -> None:
    notifier.fail = True
    client = make_client()

    with caplog.at_level(logging.WARNING):
        response = client.patch("/tickets/3", json={"status": "closed"})

    assert response.status_code == 200
    assert response.json()["status"] == "closed"
    assert client.get("/tickets/3").json()["status"] == "closed"
    record = next(r for r in caplog.records if "Webhook delivery failed" in r.message)
    assert record.ticket_id == 3  # type: ignore[attr-defined]
    assert "n8n unreachable" in record.error  # type: ignore[attr-defined]
