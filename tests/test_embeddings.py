import pytest
import requests

def test_vector_embeddings_telemetry(base_url):
    res = requests.get(f"{base_url}/analytics/telemetry")
    assert res.status_code == 200
    metrics = res.json()["metrics"]

    assert metrics["totalTransformations"] > 0
    assert metrics["contentFidelityScore"] >= 95.0
    assert metrics["avgLatencySeconds"] < 5.0
