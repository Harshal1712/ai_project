import pytest
import requests

def test_rag_grounded_qa(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    doc_name = "Transformer_Architecture.pdf"

    # 1. Fact Question: Transformer mechanism -> self-attention
    q1_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What mechanism does the Transformer architecture use to process sequence information?",
        "sourceName": doc_name
    })
    assert q1_res.status_code == 200
    res1 = q1_res.json()["result"]
    assert "self-attention" in res1["answer"].lower()
    assert "Page" in res1["citation"]

    # 2. Deadline Question -> 15 October 2026
    q2_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What is the submission deadline?",
        "sourceName": doc_name
    })
    assert q2_res.status_code == 200
    res2 = q2_res.json()["result"]
    assert "15 october 2026" in res2["answer"].lower()

    # 3. Out-of-Context Refusal -> Capital of France
    q3_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "What is the capital of France?",
        "sourceName": doc_name
    })
    assert q3_res.status_code == 200
    res3 = q3_res.json()["result"]
    assert "not available" in res3["answer"].lower()

    # 4. Adversarial Contradiction Test -> Was deadline 20 October 2026?
    q4_res = requests.post(f"{base_url}/qa/ask", headers=headers, json={
        "query": "Was the deadline 20 October 2026?",
        "sourceName": doc_name
    })
    assert q4_res.status_code == 200
    res4 = q4_res.json()["result"]
    assert "no" in res4["answer"].lower()
    assert "15 october 2026" in res4["answer"].lower()
