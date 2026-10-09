import json
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
import pytest

import etl

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
FIXED_CLOCK = datetime(2026, 10, 8, 12, 0, tzinfo=UTC)


def run_fixture(name: str, tmp_path: Path, **kwargs) -> dict:
    return etl.run(FIXTURES / name, tmp_path / "metrics.json", **kwargs)


# --- reading ---------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["valid.csv", "valid.json"])
def test_reads_csv_and_json_into_the_same_metrics(name: str, tmp_path: Path) -> None:
    metrics = run_fixture(name, tmp_path, generated_at=FIXED_CLOCK)

    assert metrics["total_records"] == 4
    assert metrics["source"] == {"file": name, "rows_read": 4}


def test_unsupported_format_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / "data.xlsx"
    path.write_text("x")

    with pytest.raises(etl.SchemaError, match="Unsupported input format"):
        etl.load(path)


def test_json_must_be_an_array(tmp_path: Path) -> None:
    path = tmp_path / "data.json"
    path.write_text('{"a": 1}')

    with pytest.raises(etl.SchemaError, match="array"):
        etl.load(path)


# --- normalization & schema --------------------------------------------------------------


def test_normalize_columns_snake_cases_aliases_and_strips() -> None:
    df = pd.DataFrame(
        {" Ticket ID ": [" 1 "], "Date of Purchase": ["2026-10-01"], "Preço Médio": ["x"]}
    )

    out = etl.normalize_columns(df)

    assert list(out.columns) == ["ticket_id", "created_at", "preco_medio"]
    assert out.loc[0, "ticket_id"] == "1"


def test_kaggle_layout_is_supported_via_aliases(tmp_path: Path) -> None:
    metrics = run_fixture("kaggle_like.csv", tmp_path)

    assert metrics["total_records"] == 2
    assert metrics["by_channel"] == {"Chat": 1, "Social media": 1}
    assert metrics["by_status"] == {"Pending Customer Response": 2}


def test_missing_required_columns_fail_without_writing_output(tmp_path: Path) -> None:
    with pytest.raises(etl.SchemaError, match="created_at, priority"):
        run_fixture("missing_columns.csv", tmp_path)

    assert not (tmp_path / "metrics.json").exists()


# --- dates -------------------------------------------------------------------------------


def test_parse_dates_converts_iso_dates_to_utc() -> None:
    df = etl.normalize_columns(
        pd.read_csv(FIXTURES / "invalid_dates.csv", dtype=str, keep_default_na=False)
    )

    parsed, invalid = etl.parse_dates(df)

    assert invalid == 3
    assert parsed["ticket_id"].tolist() == ["1", "5"]
    # 2026-10-02T23:59-03:00 is 2026-10-03 02:59 UTC -> counted on the UTC day.
    assert parsed["created_at"].iloc[1] == pd.Timestamp("2026-10-03T02:59:00Z")


def test_invalid_dates_are_excluded_counted_and_logged(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    metrics = run_fixture("invalid_dates.csv", tmp_path)

    assert metrics["source"]["rows_read"] == 5
    assert metrics["total_records"] == 2
    assert metrics["invalid_dates_dropped"] == 3
    assert metrics["records_by_day"] == {"2026-10-01": 1, "2026-10-03": 1}
    assert "Dropping 3 row(s)" in caplog.text


# --- aggregation -------------------------------------------------------------------------


def test_aggregations(tmp_path: Path) -> None:
    metrics = run_fixture("valid.csv", tmp_path, generated_at=FIXED_CLOCK)

    assert metrics["records_by_day"] == {"2026-10-01": 2, "2026-10-02": 1, "2026-10-03": 1}
    assert metrics["top_categories"] == [
        {"category": "Billing inquiry", "count": 2},
        {"category": "Refund request", "count": 1},  # tie broken alphabetically
        {"category": "Technical issue", "count": 1},
    ]
    assert metrics["by_channel"] == {"Email": 2, "Chat": 1, "Phone": 1}
    assert metrics["by_priority"] == {"High": 2, "Low": 1, "Medium": 1}
    assert metrics["by_status"] == {"Closed": 2, "Open": 2}
    assert metrics["date_range"] == {"start": "2026-10-01", "end": "2026-10-03"}


def test_top_categories_are_limited() -> None:
    df = pd.DataFrame(
        {
            "ticket_id": [str(i) for i in range(7)],
            "created_at": pd.to_datetime(["2026-10-01"] * 7, utc=True),
            "category": list("ABCDEFG"),
            "channel": ["x"] * 7,
            "priority": ["y"] * 7,
        }
    )

    metrics = etl.compute_metrics(df, rows_read=7, invalid_dates=0, source_name="t")

    assert [c["category"] for c in metrics["top_categories"]] == list("ABCDE")


def test_empty_input_produces_zeroed_metrics(tmp_path: Path) -> None:
    path = tmp_path / "empty.csv"
    path.write_text("ticket_id,created_at,category,channel,priority\n")

    metrics = etl.run(path, tmp_path / "out.json")

    assert metrics["total_records"] == 0
    assert metrics["records_by_day"] == {}
    assert metrics["top_categories"] == []
    assert metrics["generated_at"] is None
    assert "by_status" not in metrics


# --- output ------------------------------------------------------------------------------


def test_output_file_is_created_with_expected_shape(tmp_path: Path) -> None:
    out = tmp_path / "nested" / "metrics.json"

    etl.run(FIXTURES / "valid.csv", out, generated_at=FIXED_CLOCK)

    data = json.loads(out.read_text(encoding="utf-8"))
    assert set(data) == {
        "generated_at",
        "source",
        "total_records",
        "invalid_dates_dropped",
        "date_range",
        "records_by_day",
        "top_categories",
        "by_channel",
        "by_priority",
        "by_status",
    }
    assert data["generated_at"] == "2026-10-08T12:00:00Z"
    assert out.read_text(encoding="utf-8").endswith("}\n")


def test_output_is_deterministic(tmp_path: Path) -> None:
    first, second = tmp_path / "a.json", tmp_path / "b.json"

    etl.run(FIXTURES / "valid.csv", first)
    etl.run(FIXTURES / "valid.csv", second)

    assert first.read_bytes() == second.read_bytes()
    # Default clock = latest data timestamp, not wall-clock time.
    assert json.loads(first.read_text())["generated_at"] == "2026-10-03T00:00:00Z"


# --- CLI ---------------------------------------------------------------------------------


def test_cli_success_and_failure_exit_codes(tmp_path: Path) -> None:
    ok = etl.main(
        [
            "--input",
            str(FIXTURES / "valid.csv"),
            "--output",
            str(tmp_path / "m.json"),
            "--generated-at",
            "2026-10-08T00:00:00Z",
        ]
    )
    missing = etl.main(
        ["--input", str(FIXTURES / "missing_columns.csv"), "--output", str(tmp_path / "x.json")]
    )
    naive_clock = etl.main(
        [
            "--input",
            str(FIXTURES / "valid.csv"),
            "--output",
            str(tmp_path / "y.json"),
            "--generated-at",
            "2026-10-08T00:00:00",
        ]
    )

    assert (ok, missing, naive_clock) == (0, 1, 1)
