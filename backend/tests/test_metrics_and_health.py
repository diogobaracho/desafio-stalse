from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def test_metrics_returns_file_content(client: TestClient) -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert response.json() == {"total_records": 3, "records_by_day": {"2026-10-01": 3}}


def test_missing_metrics_file_returns_503(
    make_client, tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    client = make_client(metrics_file_path=tmp_path / "absent.json")

    response = client.get("/metrics")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "metrics_unavailable"
    assert "Metrics file not found" in caplog.text


@pytest.mark.parametrize("content", ["{not json", "[1, 2, 3]"])
def test_malformed_metrics_file_returns_503(make_client, tmp_path: Path, content: str) -> None:
    path = tmp_path / "bad.json"
    path.write_text(content)

    response = make_client(metrics_file_path=path).get("/metrics")

    assert response.status_code == 503
    assert response.json()["error"]["message"] == "Metrics file is malformed."


def test_unreadable_metrics_path_returns_503(make_client, tmp_path: Path) -> None:
    # A directory cannot be read as a file -> OSError branch.
    response = make_client(metrics_file_path=tmp_path).get("/metrics")

    assert response.status_code == 503


def test_health_reports_runtime_flags(make_client) -> None:
    body = make_client(read_only_mode=True).get("/health").json()

    assert body == {
        "status": "ok",
        "service": "stalse-mini-inbox-api",
        "version": "0.1.0",
        "environment": "test",
        "read_only": True,
    }


def test_responses_carry_request_id(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "abc123"})

    assert response.headers["X-Request-ID"] == "abc123"
