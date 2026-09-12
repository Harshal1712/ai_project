import pytest
import requests

def test_summarization_outputs(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "pdf", "name": "Enterprise_AI_Strategy.pdf"},
        "config": {"audience": "Executive", "tone": "Professional"},
        "outputs": ["Executive Summary", "Detailed Summary", "Key Points", "Presentation / PPT"]
    })
    assert res.status_code == 201
    outputs = res.json()["project"]["outputs"]

    assert len(outputs) == 4
    exec_summary = next(o for o in outputs if o["type"] == "Executive Summary")
    assert "EXECUTIVE BRIEFING" in exec_summary["content"]

    ppt_output = next(o for o in outputs if o["type"] == "Presentation / PPT")
    assert len(ppt_output["slides"]) > 0
    assert "slideNumber" in ppt_output["slides"][0]
