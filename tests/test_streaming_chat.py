import requests
from conftest import read_sse

SECOND_DOCUMENT_TEXT = """Vendor Onboarding Policy

1. Scope
This policy applies to every external vendor that processes customer data.

2. Security Review
Every vendor must pass a security review before signing. The review takes 10 business days
and is performed by the Information Security team.

3. Contract Terms
Vendor contracts are signed for an initial term of 24 months and renew annually afterwards.
"""


def _auth(creds):
    return {"Authorization": f"Bearer {creds['token']}"}


def test_streaming_answer_emits_sources_tokens_and_done(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Streaming_Spec.txt", outputs=["Key Points"])

    res = requests.post(
        f"{base_url}/qa/ask/stream",
        headers=headers,
        json={"query": "What is the submission deadline?", "projectId": project["id"]},
        stream=True,
        timeout=180,
    )
    assert res.status_code == 200
    assert res.headers["Content-Type"].startswith("text/event-stream")

    events = read_sse(res)
    names = [name for name, _ in events]
    assert names[0] == "sources"
    assert "token" in names
    assert names[-1] == "done"

    done = events[-1][1]
    assert done["grounded"] is True
    assert "15 october 2026" in done["answer"].lower()
    # The streamed tokens must add up to the final answer.
    streamed = "".join(data["text"] for name, data in events if name == "token")
    assert streamed.strip() == done["answer"].strip()

    # The exchange is persisted to the project's conversation.
    convo = requests.get(f"{base_url}/qa/{project['id']}/conversation", headers=headers).json()
    assert convo["messages"][-1]["role"] == "assistant"


def test_streaming_answer_refuses_out_of_scope_questions(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Streaming_Refusal.txt", outputs=["Key Points"])

    res = requests.post(
        f"{base_url}/qa/ask/stream",
        headers=headers,
        json={"query": "What is the capital of France?", "projectId": project["id"]},
        stream=True,
        timeout=180,
    )
    events = read_sse(res)
    done = events[-1][1]
    assert events[-1][0] == "done"
    assert done["grounded"] is False
    assert "not available" in done["answer"].lower()


def test_streaming_answer_in_requested_language(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Streaming_Hindi.txt", outputs=["Key Points"])

    res = requests.post(
        f"{base_url}/qa/ask/stream",
        headers=headers,
        json={"query": "What is the minimum Phase 1 budget?", "projectId": project["id"], "language": "Hindi"},
        stream=True,
        timeout=180,
    )
    done = read_sse(res)[-1][1]
    assert done["grounded"] is True
    # Devanagari script present, and the figure itself is preserved exactly.
    assert any("ऀ" <= ch <= "ॿ" for ch in done["answer"])
    assert "450,000" in done["answer"]


def test_streaming_rejects_other_users_project_before_streaming(base_url, user_a_credentials, user_b_credentials, create_text_project):
    project, _ = create_text_project(_auth(user_a_credentials), name="Private_Stream.txt", outputs=["Key Points"])
    res = requests.post(
        f"{base_url}/qa/ask/stream",
        headers=_auth(user_b_credentials),
        json={"query": "What is the deadline?", "projectId": project["id"]},
    )
    # Ownership errors are plain JSON, never an opened stream.
    assert res.status_code == 403
    assert res.headers["Content-Type"].startswith("application/json")


def test_multi_document_chat_cites_each_document(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    spec, _ = create_text_project(headers, name="Transformer_Spec.txt", outputs=["Key Points"])
    policy, _ = create_text_project(headers, raw_text=SECOND_DOCUMENT_TEXT, name="Vendor_Policy.txt", outputs=["Key Points"])

    created = requests.post(f"{base_url}/chat/sessions", headers=headers, json={"projectIds": [spec["id"], policy["id"]], "title": "Spec + policy"})
    assert created.status_code == 201, created.text
    session = created.json()["session"]
    assert {p["id"] for p in session["projects"]} == {spec["id"], policy["id"]}

    res = requests.post(
        f"{base_url}/chat/sessions/{session['id']}/ask/stream",
        headers=headers,
        json={"query": "What is the proposal submission deadline, and how long does the vendor security review take?"},
        stream=True,
        timeout=180,
    )
    assert res.status_code == 200
    events = read_sse(res)
    sources = next(data["sources"] for name, data in events if name == "sources")
    done = events[-1][1]

    cited_projects = {s["projectId"] for s in sources}
    assert cited_projects == {spec["id"], policy["id"]}, "retrieval should draw on both documents"
    assert all(s.get("sourceName") for s in sources)
    assert "15 october 2026" in done["answer"].lower()
    assert "10 business days" in done["answer"].lower()

    reloaded = requests.get(f"{base_url}/chat/sessions/{session['id']}", headers=headers).json()["session"]
    assert len(reloaded["messages"]) == 2


def test_multi_document_chat_rejects_other_users_projects(base_url, user_a_credentials, user_b_credentials, create_text_project):
    project_a, _ = create_text_project(_auth(user_a_credentials), name="Owner_Only.txt", outputs=["Key Points"])
    res = requests.post(f"{base_url}/chat/sessions", headers=_auth(user_b_credentials), json={"projectIds": [project_a["id"]]})
    assert res.status_code == 403


def test_multi_document_chat_session_is_private(base_url, user_a_credentials, user_b_credentials, create_text_project):
    headers_a = _auth(user_a_credentials)
    project, _ = create_text_project(headers_a, name="Private_Session.txt", outputs=["Key Points"])
    session = requests.post(f"{base_url}/chat/sessions", headers=headers_a, json={"projectIds": [project["id"]]}).json()["session"]

    headers_b = _auth(user_b_credentials)
    assert requests.get(f"{base_url}/chat/sessions/{session['id']}", headers=headers_b).status_code == 403
    assert requests.delete(f"{base_url}/chat/sessions/{session['id']}", headers=headers_b).status_code == 403
    assert requests.post(f"{base_url}/chat/sessions/{session['id']}/ask/stream", headers=headers_b, json={"query": "hi"}).status_code == 403


def test_multi_document_chat_requires_documents(base_url, user_a_credentials):
    res = requests.post(f"{base_url}/chat/sessions", headers=_auth(user_a_credentials), json={"projectIds": []})
    assert res.status_code == 400
