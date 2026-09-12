import pytest
import requests

def test_mcq_quiz_generation(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "pdf", "name": "AI_Governance_Standard.pdf"},
        "config": {"audience": "Student"},
        "outputs": ["MCQs / Quiz"]
    })
    assert res.status_code == 201
    quiz_output = res.json()["project"]["outputs"][0]
    quiz_questions = quiz_output["quiz"]

    assert len(quiz_questions) > 0

    for q in quiz_questions:
        assert "question" in q
        assert len(q["options"]) == 4  # Exactly 4 options
        assert 0 <= q["correctAnswer"] < 4  # Correct answer exists within options
        assert "explanation" in q
