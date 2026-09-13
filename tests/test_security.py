import requests


def test_user_authorization_isolation(base_url, user_a_credentials, user_b_credentials, create_text_project):
    headers_a = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    headers_b = {"Authorization": f"Bearer {user_b_credentials['token']}"}

    # 1. User A creates a project
    proj_a, job_a = create_text_project(headers_a, name="User_A_Secret_Document.txt", outputs=["Executive Summary"])
    project_a_id = proj_a["id"]

    # 2. User B attempts GET User A's project
    get_res_b = requests.get(f"{base_url}/transformations/projects/{project_a_id}", headers=headers_b)
    assert get_res_b.status_code == 403

    # 3. User B attempts DELETE User A's project
    del_res_b = requests.delete(f"{base_url}/transformations/projects/{project_a_id}", headers=headers_b)
    assert del_res_b.status_code == 403

    # 4. User B attempts querying User A's project vectors
    qa_res_b = requests.post(f"{base_url}/qa/ask", headers=headers_b, json={
        "query": "What are the secret facts?",
        "projectId": project_a_id
    })
    assert qa_res_b.status_code == 403

    # 5. User B attempts to run verification on User A's project
    verify_res_b = requests.post(f"{base_url}/verification/audit", headers=headers_b, json={"projectId": project_a_id})
    assert verify_res_b.status_code == 403

    # 6. User B attempts to read User A's conversation history
    convo_res_b = requests.get(f"{base_url}/qa/{project_a_id}/conversation", headers=headers_b)
    assert convo_res_b.status_code == 403

    # 7. User A can access their own project
    get_res_a = requests.get(f"{base_url}/transformations/projects/{project_a_id}", headers=headers_a)
    assert get_res_a.status_code == 200


def test_stack_traces_never_leaked(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    # Malformed ObjectId should produce a clean 404, not a raw Mongoose CastError/stack trace.
    res = requests.get(f"{base_url}/transformations/projects/not-a-valid-id", headers=headers)
    assert res.status_code == 404
    body = res.json()
    assert "error" in body
    assert "at " not in body["error"]  # no stack-trace-shaped content
    assert "node_modules" not in body["error"]
