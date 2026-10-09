from fastapi.testclient import TestClient


def test_list_returns_all_seeded_tickets_newest_first(client: TestClient) -> None:
    response = client.get("/tickets")

    assert response.status_code == 200
    tickets = response.json()
    assert len(tickets) == 20
    created = [t["created_at"] for t in tickets]
    assert created == sorted(created, reverse=True)


def test_ticket_fields_and_iso_timestamps(client: TestClient) -> None:
    ticket = client.get("/tickets/1").json()

    assert set(ticket) == {
        "id",
        "created_at",
        "updated_at",
        "customer_name",
        "channel",
        "subject",
        "description",
        "status",
        "priority",
    }
    assert ticket["created_at"] == "2026-09-21T09:12:00Z"


def test_search_is_case_insensitive_on_subject(client: TestClient) -> None:
    tickets = client.get("/tickets", params={"search": "PAGAMENTO"}).json()

    subjects = {t["subject"] for t in tickets}
    assert subjects == {
        "Pagamento recusado no cartão de crédito",
        "Estorno de pagamento via Pix não recebido",
        "Alteração de forma de pagamento",
    }


def test_search_matches_customer_name(client: TestClient) -> None:
    tickets = client.get("/tickets", params={"search": "mariana"}).json()

    assert [t["customer_name"] for t in tickets] == ["Mariana Souza"]


def test_search_without_matches_returns_empty_list(client: TestClient) -> None:
    response = client.get("/tickets", params={"search": "inexistente-xyz"})

    assert response.status_code == 200
    assert response.json() == []


def test_search_treats_wildcards_literally(client: TestClient) -> None:
    assert client.get("/tickets", params={"search": "%"}).json() == []
    assert client.get("/tickets", params={"search": "_"}).json() == []


def test_blank_search_returns_everything(client: TestClient) -> None:
    assert len(client.get("/tickets", params={"search": "   "}).json()) == 20


def test_get_ticket_by_id(client: TestClient) -> None:
    response = client.get("/tickets/4")

    assert response.status_code == 200
    assert response.json()["customer_name"] == "João Pedro Almeida"


def test_get_missing_ticket_returns_404_envelope(client: TestClient) -> None:
    response = client.get("/tickets/999")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "ticket_not_found",
            "message": "Ticket 999 not found.",
            "details": {"ticket_id": 999},
        }
    }


def test_invalid_ticket_id_is_a_validation_error(client: TestClient) -> None:
    response = client.get("/tickets/0")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_unknown_route_uses_error_envelope(client: TestClient) -> None:
    response = client.get("/nope")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
