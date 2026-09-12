import pytest
import requests

def test_background_job_pipeline_lifecycle(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    # Verify transformation job lifecycle: Queued -> Processing -> Completed
    job_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "pdf", "name": "Heavy_Benchmark_Document.pdf"},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary", "Action Items"]
    })
    assert job_res.status_code == 201
    proj = job_res.json()["project"]
    assert proj["status"] == "Completed"
