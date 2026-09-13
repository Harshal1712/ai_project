import requests


def test_global_telemetry_is_real_and_structural(base_url):
    res = requests.get(f"{base_url}/analytics/telemetry")
    assert res.status_code == 200
    body = res.json()
    metrics = body["metrics"]

    # Structural checks only — these are live aggregations over real data and
    # will vary run to run, so no fabricated magic numbers are asserted here.
    for key in ("totalTransformations", "documentsProcessed", "videosSummarized", "aiOutputsGenerated"):
        assert isinstance(metrics[key], int)
        assert metrics[key] >= 0

    assert 0 <= metrics["contentFidelityScore"] <= 100
    assert metrics["avgLatencySeconds"] >= 0

    assert isinstance(body["topOutputTypes"], list)
    assert isinstance(body["languageDistribution"], list)


def test_authenticated_summary_reflects_real_usage(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    before = requests.get(f"{base_url}/analytics/summary", headers=headers)
    assert before.status_code == 200
    before_count = before.json()["metrics"]["totalTransformations"]

    create_text_project(headers, name="Analytics_Probe.txt", outputs=["Key Points"])

    after = requests.get(f"{base_url}/analytics/summary", headers=headers)
    assert after.status_code == 200
    after_count = after.json()["metrics"]["totalTransformations"]

    # A project was genuinely created in the database — the count must reflect it.
    assert after_count == before_count + 1


def test_summary_requires_auth(base_url):
    res = requests.get(f"{base_url}/analytics/summary")
    assert res.status_code == 401
