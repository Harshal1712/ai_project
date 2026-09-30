import requests


def _auth(creds):
    return {"Authorization": f"Bearer {creds['token']}"}


def test_flashcard_generation_and_spaced_repetition(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Flashcard_Source.txt", outputs=["Key Points"])

    gen = requests.post(f"{base_url}/study/{project['id']}/flashcards", headers=headers, json={"count": 5}, timeout=180)
    assert gen.status_code == 201, gen.text
    deck = gen.json()["deck"]
    assert 1 <= len(deck["cards"]) <= 5
    assert deck["stats"]["due"] == len(deck["cards"])
    assert all(c["front"].strip() and c["back"].strip() and c["box"] == 1 for c in deck["cards"])

    card = deck["cards"][0]

    good = requests.post(f"{base_url}/study/{project['id']}/flashcards/{card['id']}/review", headers=headers, json={"grade": "good"})
    assert good.status_code == 200
    assert good.json()["card"]["box"] == 2
    assert good.json()["stats"]["due"] == len(deck["cards"]) - 1  # no longer due today

    again = requests.post(f"{base_url}/study/{project['id']}/flashcards/{card['id']}/review", headers=headers, json={"grade": "again"})
    assert again.json()["card"]["box"] == 1  # a miss sends the card back to the first box

    bad = requests.post(f"{base_url}/study/{project['id']}/flashcards/{card['id']}/review", headers=headers, json={"grade": "perfect"})
    assert bad.status_code == 400


def test_adding_more_flashcards_skips_duplicates(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Flashcard_More.txt", outputs=["Key Points"])

    first = requests.post(f"{base_url}/study/{project['id']}/flashcards", headers=headers, json={"count": 5}, timeout=180).json()["deck"]
    second = requests.post(f"{base_url}/study/{project['id']}/flashcards", headers=headers, json={"count": 5}, timeout=180)
    assert second.status_code == 201, second.text
    cards = second.json()["deck"]["cards"]

    assert len(cards) > len(first["cards"])
    fronts = [c["front"].strip().lower() for c in cards]
    assert len(fronts) == len(set(fronts))


def test_quiz_attempts_are_validated_and_tracked(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Quiz_Tracking.txt", outputs=["Key Points"])

    assert requests.post(f"{base_url}/study/{project['id']}/quiz-attempts", headers=headers, json={"score": 6, "total": 5}).status_code == 400
    assert requests.post(f"{base_url}/study/{project['id']}/quiz-attempts", headers=headers, json={"score": 4, "total": 5}).status_code == 201

    study = requests.get(f"{base_url}/study/{project['id']}", headers=headers).json()
    assert study["quizAttempts"][0]["score"] == 4

    overview = requests.get(f"{base_url}/study/overview", headers=headers).json()
    entry = next(p for p in overview["projects"] if p["id"] == project["id"])
    assert entry["quiz"]["bestPercent"] == 80


def test_study_endpoints_are_private(base_url, user_a_credentials, user_b_credentials, create_text_project):
    project, _ = create_text_project(_auth(user_a_credentials), name="Study_Private.txt", outputs=["Key Points"])
    headers_b = _auth(user_b_credentials)

    assert requests.get(f"{base_url}/study/{project['id']}", headers=headers_b).status_code == 403
    assert requests.post(f"{base_url}/study/{project['id']}/flashcards", headers=headers_b, json={"count": 5}).status_code == 403
    assert requests.post(f"{base_url}/study/{project['id']}/quiz-attempts", headers=headers_b, json={"score": 1, "total": 1}).status_code == 403


def test_translate_output_creates_new_output_and_blocks_duplicates(base_url, user_a_credentials, create_text_project):
    headers = _auth(user_a_credentials)
    project, _ = create_text_project(headers, name="Translate_Me.txt", outputs=["Key Points"])
    original = project["outputs"][0]

    res = requests.post(f"{base_url}/transformations/outputs/{original['id']}/translate", headers=headers, json={"language": "Hindi"}, timeout=180)
    assert res.status_code == 201, res.text
    translated = res.json()["output"]
    assert translated["language"] == "Hindi"
    assert translated["translatedFromId"] == original["id"]
    assert translated["type"] == original["type"]
    assert any("ऀ" <= ch <= "ॿ" for ch in translated["content"])

    refreshed = requests.get(f"{base_url}/transformations/projects/{project['id']}", headers=headers).json()["project"]
    assert len(refreshed["outputs"]) == len(project["outputs"]) + 1
    # The original output is left untouched.
    assert next(o for o in refreshed["outputs"] if o["id"] == original["id"])["content"] == original["content"]

    duplicate = requests.post(f"{base_url}/transformations/outputs/{original['id']}/translate", headers=headers, json={"language": "Hindi"})
    assert duplicate.status_code == 409


def test_translate_output_validation_and_privacy(base_url, user_a_credentials, user_b_credentials, create_text_project):
    project, _ = create_text_project(_auth(user_a_credentials), name="Translate_Private.txt", outputs=["Key Points"])
    output_id = project["outputs"][0]["id"]

    unsupported = requests.post(f"{base_url}/transformations/outputs/{output_id}/translate", headers=_auth(user_a_credentials), json={"language": "Klingon"})
    assert unsupported.status_code == 400

    foreign = requests.post(f"{base_url}/transformations/outputs/{output_id}/translate", headers=_auth(user_b_credentials), json={"language": "Hindi"})
    assert foreign.status_code == 403
