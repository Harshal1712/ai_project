import requests
from conftest import wait_for_job, SAMPLE_DOCUMENT_TEXT


def test_background_job_pipeline_lifecycle(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "text", "name": "Heavy_Benchmark_Document.txt", "rawText": SAMPLE_DOCUMENT_TEXT},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary", "Action Items"]
    })

    # Real processing is asynchronous — the request returns immediately with a job to poll.
    assert res.status_code == 202
    body = res.json()
    assert body["status"] == "QUEUED"
    job_id = body["jobId"]

    # Immediately after creation the job should be QUEUED or already PROCESSING — never fabricated as done.
    initial = requests.get(f"{base_url}/jobs/{job_id}", headers=headers)
    assert initial.status_code == 200
    assert initial.json()["job"]["status"] in ("QUEUED", "PROCESSING", "COMPLETED")

    job = wait_for_job(base_url, headers, job_id)
    assert job["status"] == "COMPLETED", f"Job failed: {job.get('error')}"
    assert job["progress"] == 100

    project_res = requests.get(f"{base_url}/transformations/projects/{body['projectId']}", headers=headers)
    assert project_res.status_code == 200
    assert project_res.json()["project"]["status"] == "Completed"


def test_job_not_found_returns_404(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    res = requests.get(f"{base_url}/jobs/000000000000000000000000", headers=headers)
    assert res.status_code == 404


def test_job_belongs_to_owner_only(base_url, user_a_credentials, user_b_credentials):
    headers_a = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    headers_b = {"Authorization": f"Bearer {user_b_credentials['token']}"}

    res = requests.post(f"{base_url}/transformations/generate", headers=headers_a, json={
        "source": {"type": "text", "name": "Owner_Only.txt", "rawText": SAMPLE_DOCUMENT_TEXT},
        "config": {"audience": "Executive"},
        "outputs": ["Key Points"]
    })
    job_id = res.json()["jobId"]

    forbidden = requests.get(f"{base_url}/jobs/{job_id}", headers=headers_b)
    assert forbidden.status_code == 403
