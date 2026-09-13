import requests


def test_rag_grounded_qa(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj, job = create_text_project(headers, name="Transformer_Architecture.txt", outputs=["Key Points"])
    project_id = proj["id"]

    # 1. Fact question the source genuinely answers -> self-attention
    q1_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What mechanism does the Transformer architecture use to process sequence information?",
        "projectId": project_id
    })
    assert q1_res.status_code == 200
    res1 = q1_res.json()["result"]
    assert "self-attention" in res1["answer"].lower()
    assert len(res1["sources"]) > 0

    # 2. Deadline question -> should state 15 October 2026, grounded in the real source
    q2_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What is the submission deadline?",
        "projectId": project_id
    })
    assert q2_res.status_code == 200
    res2 = q2_res.json()["result"]
    assert "15 october 2026" in res2["answer"].lower()

    # 3. Out-of-context refusal — nothing about France exists in this source
    q3_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What is the capital of France?",
        "projectId": project_id
    })
    assert q3_res.status_code == 200
    res3 = q3_res.json()["result"]
    assert "not available" in res3["answer"].lower()

    # 4. Adversarial contradiction check — source says 15 October, not 20 October
    q4_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "Was the deadline 20 October 2026?",
        "projectId": project_id
    })
    assert q4_res.status_code == 200
    res4 = q4_res.json()["result"]
    assert "15 october 2026" in res4["answer"].lower()


def test_qa_requires_project_id(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    res = requests.post(f"{base_url}/qa/ask", headers=headers, json={"query": "What is this about?"})
    assert res.status_code == 400


def test_qa_conversation_history_persists(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj, job = create_text_project(headers, name="History_Test.txt")
    project_id = proj["id"]

    requests.post(f"{base_url}/qa/ask", headers=headers, json={"query": "What are the main risks?", "projectId": project_id})

    convo_res = requests.get(f"{base_url}/qa/{project_id}/conversation", headers=headers)
    assert convo_res.status_code == 200
    messages = convo_res.json()["messages"]
    assert len(messages) >= 2  # the user question and the assistant's answer
    assert any(m["role"] == "user" for m in messages)
    assert any(m["role"] == "assistant" for m in messages)
