import pytest
import requests

def test_fact_verification_engine(base_url):
    res = requests.post(f"{base_url}/verification/audit", json={
        "sourceName": "Enterprise_Specification.pdf",
        "outputsCount": 6
    })
    assert res.status_code == 200
    report = res.json()["report"]

    assert report["fidelityScore"] == 96
    assert report["totalChecks"] == 18
    assert len(report["checks"]) > 0

    # Verify "7 working days" vs "7 days" meaning changed warning
    warning_check = next((c for c in report["checks"] if c["status"] == "meaning_changed"), None)
    assert warning_check is not None
    assert "7 working days" in warning_check["sourceStatement"]
    assert "7 days" in warning_check["generatedStatement"]
