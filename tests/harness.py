"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/clearance.py
is a change to what these tests exercise. The runner comment on the first lines
of the contract is ignored by CPython, so the file imports as ordinary Python.
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: CLEARANCE_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("CLEARANCE_CONTRACT") or ROOT / "contracts" / "clearance.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
DAY = 86400

#: 2026-09-01T00:00:00Z. Every world starts here.
T0 = 1788220800


def _install(gl: D.GL) -> None:
    """
    Publish a `genlayer` package shaped like py-genlayer:5jycge4q (Studio Next):
    the star import brings Address and the integer types, `import genlayer as gl`
    is the package itself, and the storage names live in genlayer.storage. An
    import the contract left out fails here rather than on chain.
    """
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "clearance_contract") -> types.ModuleType:
    """Import the contract fresh against this gl."""
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def answer(verdict: str, tier: str = "", conditions: str = "", reason: str = "") -> str:
    """A model answer, as the model would type it."""
    return json.dumps(
        {
            "verdict": verdict,
            "tier": tier,
            "conditions": conditions,
            "reason": reason or f"The license reads as {verdict.lower()} for this use.",
        }
    )


class World:
    """
    One Clearance contract and the accounts around it.

    Time is explicit: `at(seconds)` sets the transaction datetime the contract
    reads, because nothing on chain moves the clock on its own and the
    seven-day price hold is one of the things these tests most need to control.
    """

    CREATOR = "0x" + "c1" * 20
    OTHER_CREATOR = "0x" + "c2" * 20
    ALICE = "0x" + "a1" * 20
    BOB = "0x" + "a2" * 20
    STRANGER = "0x" + "d4" * 20

    TITLE = "Fox in the Reeds"
    LINK = "https://naraito.art/fox-in-the-reeds"
    LICENSE = (
        "Free for personal use, with credit to Nara Ito. Any commercial use, including monetised "
        "videos and client work, needs the commercial tier. Printed merch needs the merch tier, up to "
        "500 units, larger runs by request. No AI training, in any form."
    )
    TIERS = [
        {"id": "commercial", "name": "Commercial", "scope": "Commercial use online, videos, client work", "price": "40"},
        {"id": "merch", "name": "Merch", "scope": "Printed goods up to 500 units", "price": "90"},
    ]
    TERMS = {"creator": "Nara Ito", "kind": "illustration", "tiers": TIERS}
    USE = "Print the fox on 200 T-shirts for my band's autumn tour, sold at shows."

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.CREATOR)
        self.c = self.mod.Clearance()

    # -- controls ----------------------------------------------------------

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    def nodes(self) -> list[D.NodeWorld]:
        return [self.leader, *self.validators]

    # -- shorthands --------------------------------------------------------

    def publish(self, title=None, link=None, license=None, terms=None, who=None) -> int:
        self.sender(who or self.CREATOR)
        payload = terms if terms is not None else self.TERMS
        return int(
            self.c.publish_work(
                title if title is not None else self.TITLE,
                link if link is not None else self.LINK,
                license if license is not None else self.LICENSE,
                payload if isinstance(payload, str) else json.dumps(payload),
            )
        )

    def amend(self, license=None, terms=None, wid: int = 1, who=None) -> int:
        self.sender(who or self.CREATOR)
        payload = terms if terms is not None else self.TIERS
        return int(
            self.c.amend_license(
                wid,
                license if license is not None else self.LICENSE,
                payload if isinstance(payload, str) else json.dumps(payload),
            )
        )

    def queue(self, verdict: str, tier: str = "", validator_verdict=None, validator_tier=None, conditions: str = "", reason: str = "") -> None:
        """One model answer for the leader and one for each validator."""
        self.leader.answers.append(answer(verdict, tier, conditions, reason))
        for world in self.validators:
            world.answers.append(
                answer(
                    validator_verdict or verdict,
                    tier if validator_tier is None else validator_tier,
                    conditions,
                    reason,
                )
            )

    def ask(self, verdict: str = "PAID", tier: str = "merch", use=None, wid: int = 1, who=None, conditions: str = "", reason: str = "", validator_verdict=None, validator_tier=None) -> int:
        self.queue(verdict, tier, validator_verdict, validator_tier, conditions, reason)
        self.sender(who or self.ALICE)
        return int(self.c.ask(wid, use if use is not None else self.USE))

    def buy(self, rid: int, value: int, who=None) -> int:
        self.sender(who or self.ALICE, value)
        try:
            return int(self.c.buy(rid))
        finally:
            self.sender(who or self.ALICE)

    def answer(self, rid: int, decision: str, tier: str = "", who=None) -> int:
        self.sender(who or self.CREATOR)
        return int(self.c.answer(rid, decision, tier))

    def withdraw(self, who=None) -> int:
        self.sender(who or self.CREATOR)
        return int(self.c.withdraw())

    # -- reads -------------------------------------------------------------

    def work(self, wid: int = 1) -> dict:
        return json.loads(self.c.get_work(wid))

    def license(self, wid: int, version: int) -> dict:
        return json.loads(self.c.get_license(wid, version))

    def request(self, rid: int) -> dict:
        return json.loads(self.c.get_request(rid))

    def requests(self, wid: int = 1, offset: int = 0, limit: int = 50) -> dict:
        return json.loads(self.c.list_requests(wid, offset, limit))

    def works(self, offset: int = 0, limit: int = 50) -> dict:
        return json.loads(self.c.list_works(offset, limit))

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)


def refused(prefix: str, fn, *args, **kwargs) -> str:
    """Assert the call is refused, and that the refusal is the sentence it should be."""
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")
