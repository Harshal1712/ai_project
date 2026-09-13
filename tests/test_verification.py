import requests
from conftest import SAMPLE_DOCUMENT_TEXT

VALID_STATUSES = {"verified", "meaning_changed", "nuance_shift", "unsupported"}


def test_fact_verification_engine(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj, job = create_text_project(headers, name="Enterprise_Specification.txt", outputs=["Executive Summary", "Key Points"])

    res = requests.post(f"{base_url}/verification/audit", headers=headers, json={"projectId": proj["id"]})
    assert res.status_code == 200
    report = res.json()["report"]

    # Real, structural properties of a grounding verification report — not
    # pinned to specific fabricated numbers, since a real LLM's claim
    # extraction/classification will vary run to run.
    assert 0 <= report["fidelityScore"] <= 100
    assert report["totalChecks"] == len(report["checks"])
    assert report["passedChecks"] <= report["totalChecks"]
    assert report["warnings"] == report["totalChecks"] - report["passedChecks"]

    for check in report["checks"]:
        assert check["status"] in VALID_STATUSES
        assert len(check["category"]) > 0
        assert len(check["note"]) > 0


def test_verification_requires_existing_outputs(base_url, user_a_credentials):
    """A project queried before its background job finishes has no outputs yet."""
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    create_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "text", "name": "No_Outputs_Yet.txt", "rawText": SAMPLE_DOCUMENT_TEXT},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary"]
    })
    assert create_res.status_code == 202
    project_id = create_res.json()["projectId"]

    res = requests.post(f"{base_url}/verification/audit", headers=headers, json={"projectId": project_id})
    assert res.status_code == 400


def test_verification_cross_user_forbidden(base_url, user_a_credentials, user_b_credentials, create_text_project):
    headers_a = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    headers_b = {"Authorization": f"Bearer {user_b_credentials['token']}"}
    proj, job = create_text_project(headers_a, name="User_A_Only.txt", outputs=["Key Points"])

    res = requests.post(f"{base_url}/verification/audit", headers=headers_b, json={"projectId": proj["id"]})
    assert res.status_code == 403


def test_latest_verification_endpoint(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj, job = create_text_project(headers, name="Latest_Report_Test.txt", outputs=["Key Points"])

    before = requests.get(f"{base_url}/verification/{proj['id']}/latest", headers=headers)
    assert before.status_code == 200
    assert before.json()["report"] is None

    requests.post(f"{base_url}/verification/audit", headers=headers, json={"projectId": proj["id"]})

    after = requests.get(f"{base_url}/verification/{proj['id']}/latest", headers=headers)
    assert after.status_code == 200
    assert after.json()["report"] is not None
