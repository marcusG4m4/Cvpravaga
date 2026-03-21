from fastapi.testclient import TestClient
from main import app
import io
import docx

client = TestClient(app)

def create_dummy_docx(text="Dummy resume text for testing purposes. Experienced Python Developer."):
    doc = docx.Document()
    doc.add_paragraph(text)
    target = io.BytesIO()
    doc.save(target)
    target.seek(0)
    return target

def test_scan_endpoint_valid_docx():
    docx_file = create_dummy_docx()
    job_description = "We need a Python Developer."
    
    response = client.post(
        "/scan",
        files={"file": ("test_resume.docx", docx_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"job_description": job_description}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "match_score" in data
    assert "resume_text" in data
    assert "test_resume.docx" == data["filename"]

def test_scan_endpoint_empty_docx():
    # An empty docx
    docx_file = create_dummy_docx("")
    job_description = "Some job description"
    
    response = client.post(
        "/scan",
        files={"file": ("empty.docx", docx_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"job_description": job_description}
    )
    
    assert response.status_code == 200
    assert response.json()["match_score"] == 0

def test_auto_optimize_no_key():
    # Should fail with 400 because GEMINI_API_KEY is ideally not set in this pure test env
    # If it is set, this might pass depending on environment, so we just check it doesn't return 500
    response = client.post(
        "/auto-optimize-resume",
        json={"resume_text": "text", "job_description": "job"}
    )
    assert response.status_code in [200, 400]
