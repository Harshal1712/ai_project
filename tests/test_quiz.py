def test_mcq_quiz_generation(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    proj, job = create_text_project(headers, name="AI_Governance_Standard.txt", config={"audience": "Student"}, outputs=["MCQs / Quiz"])

    assert proj["status"] == "Completed"
    quiz_output = proj["outputs"][0]
    assert quiz_output["type"] == "MCQs / Quiz"
    quiz_questions = quiz_output["quiz"]

    assert len(quiz_questions) > 0

    for q in quiz_questions:
        assert "question" in q and len(q["question"]) > 0
        assert len(q["options"]) == 4  # exactly 4 options
        assert 0 <= q["correctAnswer"] < 4  # correct answer exists within options
        assert "explanation" in q and len(q["explanation"]) > 0
