import pytest
from fastapi.testclient import TestClient

from tests.conftest import FakeNotifier


def test_update_status(client: TestClient) -> None:
    before = client.get("/tickets/3").json()

    response = client.patch("/tickets/3", json={"status": "in_progress"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "in_progress"
    assert body["priority"] == before["priority"]
    assert body["updated_at"] > before["updated_at"]
    assert client.get("/tickets/3").json()["status"] == "in_progress"


def test_update_priority(client: TestClient) -> None:
    response = client.patch("/tickets/7", json={"priority": "medium"})

    assert response.status_code == 200
    assert response.json()["priority"] == "medium"


def test_update_both_fields(client: TestClient) -> None:
    response = client.patch("/tickets/7", json={"status": "in_progress", "priority": "medium"})

    assert response.status_code == 200
    assert (response.json()["status"], response.json()["priority"]) == ("in_progress", "medium")


@pytest.mark.parametrize(
    ("body", "field"),
    [
        ({"status": "archived"}, "status"),
        ({"priority": "urgent"}, "priority"),
        ({"subject": "hacked"}, "subject"),
    ],
)
def test_invalid_bodies_are_rejected_and_not_persisted(
    client: TestClient, body: dict[str, str], field: str
) -> None:
    before = client.get("/tickets/1").json()

    response = client.patch("/tickets/1", json=body)

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(d["field"] == field for d in error["details"])
    assert client.get("/tickets/1").json() == before


def test_empty_patch_body_is_rejected(client: TestClient) -> None:
    response = client.patch("/tickets/1", json={})

    assert response.status_code == 422
    assert "at least one" in response.json()["error"]["details"][0]["message"]


def test_null_only_patch_body_is_rejected(client: TestClient) -> None:
    assert client.patch("/tickets/1", json={"status": None}).status_code == 422


def test_update_missing_ticket_returns_404(client: TestClient) -> None:
    response = client.patch("/tickets/999", json={"status": "closed"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "ticket_not_found"


def test_read_only_mode_rejects_updates(make_client, notifier: FakeNotifier) -> None:
    client = make_client(read_only_mode=True)

    response = client.patch("/tickets/1", json={"status": "closed"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "read_only_mode"
    assert client.get("/tickets/1").json()["status"] == "open"
    assert notifier.events == []
