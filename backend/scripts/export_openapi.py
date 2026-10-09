"""Write the OpenAPI contract to specs/001-ticket-inbox-api/contracts/openapi.json.

Usage: ``uv run python -m scripts.export_openapi [--check]``
(``--check`` fails when the committed contract is out of date; used in CI).
"""

import json
import sys
from pathlib import Path

from app.core.config import Settings
from app.main import create_app

TARGET = Path(__file__).resolve().parents[2] / "specs/001-ticket-inbox-api/contracts/openapi.json"


def main() -> int:
    spec = create_app(Settings(_env_file=None, api_prefix="")).openapi()
    rendered = json.dumps(spec, indent=2, ensure_ascii=False) + "\n"
    if "--check" in sys.argv:
        if not TARGET.exists() or TARGET.read_text(encoding="utf-8") != rendered:
            print(f"OpenAPI contract is out of date: run `make openapi` ({TARGET})")
            return 1
        return 0
    TARGET.write_text(rendered, encoding="utf-8")
    print(f"Wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
