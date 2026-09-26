"""
Read-only checks against the deployed contract on Studio Next.

Skipped unless CLEARANCE_INTEGRATION=1, so the suite stays offline and green on
a reviewer's machine. Nothing here writes or spends: the writes were proven by
eval/run_golden.py, scripts/seed.py and the reviewer-path run in docs/.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys

import pytest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

pytestmark = pytest.mark.skipif(os.environ.get("CLEARANCE_INTEGRATION") != "1", reason="set CLEARANCE_INTEGRATION=1 to read the live network")


@pytest.fixture(scope="module")
def live():
    import chain as C

    return C, C.Chain(), C.address()


def test_the_deployed_code_is_the_repository_s(live):
    import verify

    C, chain, address = live
    onchain = verify.deployed_source(chain, address)
    assert onchain == C.CONTRACT_FILE.read_text(encoding="utf-8")


def test_the_live_schema_has_the_eleven_methods(live):
    C, chain, address = live
    schema = C.retry("schema", chain.client.get_contract_schema, address)
    assert sorted(schema["methods"]) == sorted(
        ["publish_work", "amend_license", "ask", "buy", "answer", "withdraw", "get_work", "get_license", "get_request", "list_requests", "list_works"]
    )


def test_every_golden_verdict_reads_back_as_recorded(live):
    C, chain, address = live
    results = json.loads((ROOT / "eval" / "results.json").read_text(encoding="utf-8"))
    for attempt in results["attempts"]:
        if not attempt.get("verdict"):
            continue
        stored = chain.read_json(address, "get_request", [attempt["request_id"]])
        assert (stored["verdict"], stored["tier"]) == (attempt["verdict"], attempt["tier"]), attempt["case"]


def test_unknown_ids_read_as_not_found(live):
    C, chain, address = live
    assert chain.read_json(address, "get_request", [10**6]) == {"found": False}
    assert chain.read_json(address, "get_work", [10**6]) == {"found": False}
