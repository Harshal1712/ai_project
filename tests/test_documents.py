import io
import json
import requests
from fpdf import FPDF
import docx

from conftest import SAMPLE_DOCUMENT_TEXT, wait_for_job


def make_pdf_bytes(text: str) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 8, line)
    return bytes(pdf.output())


def make_docx_bytes(text: str) -> bytes:
    document = docx.Document()
    for para in text.split("\n\n"):
        document.add_paragraph(para)
    buf = io.BytesIO()
    document.save(buf)
    return buf.getvalue()


def upload_and_wait(base_url, headers, filename, content, mimetype, config=None, outputs=None, timeout=120):
    files = {"file": (filename, content, mimetype)}
    data = {
        "config": json.dumps(config or {"audience": "Technical Team", "detailLevel": "Detailed"}),
        "outputs": json.dumps(outputs or ["Detailed Summary", "Key Points"]),
    }
    res = requests.post(f"{base_url}/sources/upload", headers=headers, files=files, data=data)
    assert res.status_code == 202, res.text
    body = res.json()
    job = wait_for_job(base_url, headers, body["jobId"], timeout=timeout)
    assert job["status"] == "COMPLETED", f"Job failed: {job.get('error')}"
    project_res = requests.get(f"{base_url}/transformations/projects/{body['projectId']}", headers=headers)
    assert project_res.status_code == 200
    return project_res.json()["project"]


def test_pdf_document_processing(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    pdf_bytes = make_pdf_bytes(SAMPLE_DOCUMENT_TEXT)

    proj = upload_and_wait(base_url, headers, "Transformer_Architecture.pdf", pdf_bytes, "application/pdf")

    assert proj["status"] == "Completed"
    assert proj["source"]["type"] == "pdf"
    assert proj["documentData"] is not None
    assert proj["documentData"]["wordCount"] > 0
    # Real extraction should surface at least one real topic from this content.
    assert len(proj["documentData"]["keyTopics"]) > 0


def test_docx_processing(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    docx_bytes = make_docx_bytes(SAMPLE_DOCUMENT_TEXT)

    proj = upload_and_wait(
        base_url, headers, "Project_Proposal.docx", docx_bytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        config={"audience": "Executive"}, outputs=["Executive Summary"]
    )

    assert proj["status"] == "Completed"
    assert proj["source"]["type"] == "docx"
    assert proj["documentData"] is not None
    assert proj["documentData"]["wordCount"] > 0


def test_txt_file_upload_processing(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj = upload_and_wait(
        base_url, headers, "Meeting_Notes.txt", SAMPLE_DOCUMENT_TEXT.encode("utf-8"), "text/plain",
        config={"audience": "Employee"}, outputs=["Meeting Minutes"]
    )

    assert proj["status"] == "Completed"
    assert proj["source"]["type"] == "text"


def test_rawtext_source_processing(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj, job = create_text_project(headers, name="Pasted_Notes.txt", outputs=["Executive Summary"])

    assert proj["status"] == "Completed"
    assert len(proj["outputs"]) == 1
    assert proj["outputs"][0]["type"] == "Executive Summary"
    assert len(proj["outputs"][0]["content"]) > 0


def test_path_traversal_filename_sanitization(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    files = {"file": ("../../etc/passwd.txt", b"just some sample content for a security test", "text/plain")}
    data = {"config": "{}", "outputs": json.dumps(["Executive Summary"])}

    res = requests.post(f"{base_url}/sources/upload", headers=headers, files=files, data=data)
    assert res.status_code == 202

    job = wait_for_job(base_url, headers, res.json()["jobId"])
    assert job["status"] == "COMPLETED"

    project_res = requests.get(f"{base_url}/transformations/projects/{res.json()['projectId']}", headers=headers)
    sanitized_name = project_res.json()["project"]["source"]["name"]
    assert "../" not in sanitized_name
    assert ".." not in sanitized_name
    assert sanitized_name == "passwd.txt"


def test_unsupported_file_extension_rejected(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    files = {"file": ("malware.exe", b"not a real document", "application/octet-stream")}
    data = {"config": "{}", "outputs": json.dumps(["Executive Summary"])}

    res = requests.post(f"{base_url}/sources/upload", headers=headers, files=files, data=data)
    assert res.status_code == 400
