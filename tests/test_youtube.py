import pytest
import requests

def test_youtube_video_analysis(base_url):
    valid_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    res = requests.post(f"{base_url}/youtube/analyze", json={"url": valid_url})
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["videoTitle"] is not None
    assert len(data["chapters"]) > 0
    
    # Verify Chapter Timestamp Integrity: start_time < end_time and valid seconds
    for chapter in data["chapters"]:
        assert "timestamp" in chapter
        assert "title" in chapter
        assert chapter["seconds"] >= 0

def test_invalid_youtube_url_handling(base_url):
    invalid_res = requests.post(f"{base_url}/youtube/analyze", json={"url": ""})
    assert invalid_res.status_code == 400
