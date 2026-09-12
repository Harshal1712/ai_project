import pytest
import requests

def test_project_crud_lifecycle(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    # 1. Create Project
    create_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "pdf", "name": "Q3_Financial_Analysis.pdf", "size": "3.5 MB"},
        "config": {"audience": "Executive", "language": "English", "tone": "Professional"},
        "outputs": ["Executive Summary", "Key Points", "Action Items"]
    })
    assert create_res.status_code == 201
    project_data = create_res.json()["project"]
    project_id = project_data["id"]

    # 2. Get User Projects
    list_res = requests.get(f"{base_url}/transformations/projects", headers=headers)
    assert list_res.status_code == 200
    projects = list_res.json()["projects"]
    assert any(p["id"] == project_id for p in projects)

    # 3. Get Single Project
    get_res = requests.get(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["project"]["name"] == "Q3_Financial_Analysis Transformation"

    # 4. Delete Project
    del_res = requests.delete(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert del_res.status_code == 200

    # 5. Verify Deleted Project Is Not Found
    get_after_del = requests.get(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert get_after_del.status_code == 404
