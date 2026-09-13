import requests


def test_youtube_video_analysis(base_url):
    # A long-standing public video with English captions available.
    valid_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    res = requests.post(f"{base_url}/youtube/analyze", json={"url": valid_url}, timeout=60)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["videoTitle"] is not None and len(data["videoTitle"]) > 0
    assert len(data["chapters"]) > 0

    # Chapter timestamp integrity: real, ordered, non-negative.
    for chapter in data["chapters"]:
        assert "timestamp" in chapter
        assert "title" in chapter
        assert chapter["seconds"] >= 0

    for i in range(1, len(data["chapters"])):
        assert data["chapters"][i]["seconds"] >= data["chapters"][i - 1]["seconds"]


def test_invalid_youtube_url_handling(base_url):
    invalid_res = requests.post(f"{base_url}/youtube/analyze", json={"url": ""})
    assert invalid_res.status_code == 400


def test_malformed_youtube_url_returns_real_error(base_url):
    res = requests.post(f"{base_url}/youtube/analyze", json={"url": "https://example.com/not-a-video"}, timeout=30)
    # A real, meaningful error — never a fabricated fallback video.
    assert res.status_code == 422
    assert "error" in res.json()
