import pytest
import requests

def test_user_authorization_isolation(base_url, user_a_credentials, user_b_credentials):
    headers_a = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    headers_b = {"Authorization": f"Bearer {user_b_credentials['token']}"}

    # 1. User A creates a project
    create_res = requests.post(f"{base_url}/transformations/generate", headers=headers_a, json={
        "source": {"type": "pdf", "name": "User_A_Secret_Document.pdf"},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary"]
    })
    assert create_res.status_code == 201
    project_a_id = create_res.json()["project"]["id"]

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

    # 5. User A can access their own project
    get_res_a = requests.get(f"{base_url}/transformations/projects/{project_a_id}", headers=headers_a)
    assert get_res_a.status_code == 200
