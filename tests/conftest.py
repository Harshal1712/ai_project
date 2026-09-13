import pytest
import requests
import time
import uuid

BASE_URL = "http://localhost:5000/api"

# A real sample document deliberately mirroring the spec's own worked examples
# (self-attention explanation, a stated deadline, a "working days" nuance, a
# risk list) so RAG/verification tests exercise genuinely grounded behavior
# instead of asserting on canned strings.
SAMPLE_DOCUMENT_TEXT = """Transformer Architecture Technical Specification

1. Introduction
The Transformer architecture uses self-attention mechanisms to process sequence information,
allowing each token to attend to information from other tokens in the sequence rather than
processing the sequence step by step as older recurrent models did.

2. Submission Requirements
The submission deadline for this proposal is 15 October 2026. All materials must be submitted
within 7 working days of the official kickoff notification.

3. Budget
Phase 1 deployment requires a minimum budget allocation of $450,000 across Q3 and Q4.

4. Risk Matrix
The three most significant risks identified are: compliance and governance enforcement delays,
semantic drift during automated translation, and latency spikes during simultaneous multi-output
generation.
"""


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


def _register_user(prefix: str):
    unique_id = str(uuid.uuid4())[:8]
    email = f"{prefix}_{unique_id}@example.com"
    password = "SecurePassword123!"
    name = f"Test User {prefix}"

    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    assert res.status_code == 200, f"Registration failed: {res.text}"
    token = res.json()["token"]
    user_id = res.json()["user"]["id"]
    return {"email": email, "password": password, "token": token, "id": user_id}


@pytest.fixture(scope="session")
def user_a_credentials():
    return _register_user("user_a")


@pytest.fixture(scope="session")
def user_b_credentials():
    return _register_user("user_b")


def wait_for_job(base_url, headers, job_id, timeout=120, interval=2):
    """Polls a background job to completion — real processing takes real time."""
    deadline = time.time() + timeout
    last_job = None
    while time.time() < deadline:
        res = requests.get(f"{base_url}/jobs/{job_id}", headers=headers)
        assert res.status_code == 200, f"Failed to poll job: {res.text}"
        last_job = res.json()["job"]
        if last_job["status"] in ("COMPLETED", "FAILED"):
            return last_job
        time.sleep(interval)
    raise TimeoutError(f"Job {job_id} did not finish within {timeout}s (last status: {last_job})")


@pytest.fixture
def create_text_project(base_url):
    """Creates a real project from rawText, waits for the background job, and
    returns the fully-processed project (real extraction/embeddings/outputs)."""
    def _create(headers, raw_text=SAMPLE_DOCUMENT_TEXT, name="Sample_Document.txt", config=None, outputs=None, expect_success=True):
        payload = {
            "source": {"type": "text", "name": name, "rawText": raw_text},
            "config": config or {"audience": "Executive", "language": "English", "tone": "Professional"},
            "outputs": outputs or ["Executive Summary", "Key Points"],
        }
        res = requests.post(f"{base_url}/transformations/generate", headers=headers, json=payload)
        assert res.status_code == 202, f"Expected 202 Accepted, got {res.status_code}: {res.text}"
        data = res.json()
        assert "projectId" in data and "jobId" in data

        job = wait_for_job(base_url, headers, data["jobId"])
        if expect_success:
            assert job["status"] == "COMPLETED", f"Job failed: {job.get('error')}"

        project_res = requests.get(f"{base_url}/transformations/projects/{data['projectId']}", headers=headers)
        assert project_res.status_code == 200
        return project_res.json()["project"], job

    return _create


@pytest.fixture
def create_youtube_project(base_url):
    """Creates a real project from a YouTube URL and waits for the background job."""
    def _create(headers, url, config=None, outputs=None):
        payload = {
            "source": {"type": "youtube", "name": url, "url": url},
            "config": config or {"audience": "General Public"},
            "outputs": outputs or ["Key Points"],
        }
        res = requests.post(f"{base_url}/transformations/generate", headers=headers, json=payload)
        assert res.status_code == 202, res.text
        data = res.json()
        job = wait_for_job(base_url, headers, data["jobId"], timeout=180)
        project_res = requests.get(f"{base_url}/transformations/projects/{data['projectId']}", headers=headers)
        assert project_res.status_code == 200
        return project_res.json()["project"], job

    return _create
