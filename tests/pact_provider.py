from pathlib import Path
from pact import Verifier


PACT_FILE = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "pacts"
    / "EmployeeLifecycleFrontend-EmployeeLifecycleAPI.json"
)


def test_provider_contract():
    verifier = Verifier("EmployeeLifecycleAPI")

    result = verifier.verify_pacts(
        str(PACT_FILE),
        provider_base_url="http://localhost:8000",
    )

    assert result == 0