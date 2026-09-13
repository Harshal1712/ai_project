def test_summarization_outputs(base_url, user_a_credentials, create_text_project):
    headers = {"Authorization": f"Bearer {user_a_credentials['token']}"}

    proj, job = create_text_project(
        headers, name="Enterprise_AI_Strategy.txt",
        config={"audience": "Executive", "tone": "Professional"},
        outputs=["Executive Summary", "Detailed Summary", "Key Points", "Presentation / PPT"]
    )

    assert proj["status"] == "Completed"
    outputs = proj["outputs"]
    assert len(outputs) == 4

    exec_summary = next(o for o in outputs if o["type"] == "Executive Summary")
    assert len(exec_summary["content"]) > 0

    detailed_summary = next(o for o in outputs if o["type"] == "Detailed Summary")
    assert len(detailed_summary["content"]) > 0
    # A real detailed summary should be at least as substantial as the executive one.
    assert len(detailed_summary["content"]) >= len(exec_summary["content"])

    key_points = next(o for o in outputs if o["type"] == "Key Points")
    assert len(key_points["content"]) > 0

    ppt_output = next(o for o in outputs if o["type"] == "Presentation / PPT")
    assert ppt_output["slides"] is not None
    assert len(ppt_output["slides"]) > 0
    first_slide = ppt_output["slides"][0]
    assert "slideNumber" in first_slide
    assert "title" in first_slide and len(first_slide["title"]) > 0
    assert "bulletPoints" in first_slide and len(first_slide["bulletPoints"]) > 0
