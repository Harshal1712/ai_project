import requests


def test_project_crud_lifecycle(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    proj, job = create_text_project(
        headers, name="Q3_Financial_Analysis.txt",
        config={"audience": "Executive", "language": "English", "tone": "Professional"},
        outputs=["Executive Summary", "Key Points", "Action Items"]
    )
    project_id = proj["id"]
    assert proj["status"] == "Completed"
    assert proj["name"] == "Q3_Financial_Analysis Transformation"
    assert len(proj["outputs"]) == 3

    list_res = requests.get(f"{base_url}/transformations/projects", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json()["projects"])

    get_res = requests.get(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["project"]["name"] == "Q3_Financial_Analysis Transformation"

    del_res = requests.delete(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert del_res.status_code == 200

    get_after_del = requests.get(f"{base_url}/transformations/projects/{project_id}", headers=headers)
    assert get_after_del.status_code == 404


def test_get_nonexistent_project_returns_404(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    res = requests.get(f"{base_url}/transformations/projects/000000000000000000000000", headers=headers)
    assert res.status_code == 404


def test_unauthenticated_project_access_rejected(base_url):
    res = requests.get(f"{base_url}/transformations/projects")
    assert res.status_code == 401
