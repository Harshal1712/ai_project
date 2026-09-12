import pytest
import requests

def test_pdf_document_processing(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    pdf_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {
            "type": "pdf",
            "name": "Transformer_Architecture.pdf",
            "size": "1.2 MB",
            "language": "English"
        },
        "config": {"audience": "Technical Team", "detailLevel": "Detailed"},
        "outputs": ["Detailed Summary", "Key Points"]
    })
    assert pdf_res.status_code == 201
    proj = pdf_res.json()["project"]
    assert proj["status"] == "Completed"
    assert proj["documentData"] is not None
    assert len(proj["documentData"]["entities"]) > 0

def test_docx_and_txt_processing(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    # DOCX
    docx_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "docx", "name": "Project_Proposal.docx"},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary"]
    })
    assert docx_res.status_code == 201

    # TXT
    txt_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "text", "name": "Meeting_Notes.txt"},
        "config": {"audience": "Employee"},
        "outputs": ["Meeting Minutes"]
    })
    assert txt_res.status_code == 201

def test_path_traversal_filename_sanitization(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    malicious_res = requests.post(f"{base_url}/transformations/generate", headers=headers, json={
        "source": {"type": "pdf", "name": "../../etc/passwd.pdf"},
        "config": {"audience": "Executive"},
        "outputs": ["Executive Summary"]
    })
    assert malicious_res.status_code == 201
    sanitized_name = malicious_res.json()["project"]["source"]["name"]
    assert "../../" not in sanitized_name
    assert sanitized_name == "passwd.pdf"
