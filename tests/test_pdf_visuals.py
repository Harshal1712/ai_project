import io
import requests
from fpdf import FPDF
from PIL import Image, ImageDraw

from test_documents import upload_and_wait

# Values that appear ONLY inside the chart image — never in the PDF's text
# layer — so a correct answer proves the visual analysis actually read the chart.
QUARTERLY_REVENUE = {"Q1": 120, "Q2": 185, "Q3": 240, "Q4": 310}


def make_bar_chart_png() -> bytes:
    width, height = 640, 400
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    draw.text((170, 15), "Quarterly Revenue 2025 (USD thousands)", fill="black")
    draw.line((60, 350, 600, 350), fill="black", width=2)
    draw.line((60, 50, 60, 350), fill="black", width=2)

    max_value = max(QUARTERLY_REVENUE.values())
    for i, (quarter, value) in enumerate(QUARTERLY_REVENUE.items()):
        x0 = 100 + i * 125
        bar_height = int(value / max_value * 260)
        draw.rectangle((x0, 350 - bar_height, x0 + 70, 350), fill=(79, 70, 229))
        draw.text((x0 + 22, 360), quarter, fill="black")
        draw.text((x0 + 22, 350 - bar_height - 16), str(value), fill="black")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_pdf_with_chart() -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(0, 8, "Annual Business Review\n\nThis report summarizes company performance for 2025. "
                         "Figure 1 on this page shows revenue by quarter. The operations team expanded to three regions this year.")
    pdf.image(io.BytesIO(make_bar_chart_png()), x=15, y=60, w=180)
    return bytes(pdf.output())


def test_pdf_chart_is_described_and_answerable(base_url, user_a_credentials):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}
    proj = upload_and_wait(base_url, headers, "Annual_Review_With_Chart.pdf", make_pdf_with_chart(), "application/pdf", outputs=["Key Points"], timeout=240)
    assert proj["status"] == "Completed", proj.get("failureReason")

    visuals = proj["documentData"]["visualElements"]
    assert len(visuals) >= 1, "the bar chart should be detected as a visual element"
    chart = visuals[0]
    assert chart["page"] == 1
    assert chart["kind"] in ("chart", "infographic", "image")

    # Q3's value exists only inside the chart image.
    res = requests.post(f"{base_url}/qa/ask", headers=headers, json={"query": "What was the revenue in Q3?", "projectId": proj["id"]}, timeout=180)
    assert res.status_code == 200
    result = res.json()["result"]
    assert "240" in result["answer"]
    assert any(s.get("page") == 1 for s in result["sources"])
