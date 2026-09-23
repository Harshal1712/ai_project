import uuid
import requests


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _fresh_user(base_url):
    email = f"pw_{uuid.uuid4().hex[:8]}@example.com"
    password = "OriginalPass123!"
    res = requests.post(f"{base_url}/auth/register", json={"name": "Password Tester", "email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"email": email, "password": password, "token": res.json()["token"]}


def test_forgot_password_response_does_not_reveal_accounts(base_url):
    user = _fresh_user(base_url)
    existing = requests.post(f"{base_url}/auth/forgot-password", json={"email": user["email"]})
    missing = requests.post(f"{base_url}/auth/forgot-password", json={"email": f"nobody_{uuid.uuid4().hex[:8]}@example.com"})

    assert existing.status_code == 200
    assert missing.status_code == 200
    # Identical bodies — the endpoint must not be usable to enumerate registered emails.
    assert existing.json() == missing.json()


def test_reset_password_rejects_invalid_token(base_url):
    res = requests.post(f"{base_url}/auth/reset-password", json={"token": "not-a-real-token", "newPassword": "BrandNewPass123!"})
    assert res.status_code == 400
    assert "invalid or has expired" in res.json()["error"]


def test_reset_password_enforces_minimum_length(base_url):
    res = requests.post(f"{base_url}/auth/reset-password", json={"token": "whatever", "newPassword": "short"})
    assert res.status_code == 400


def test_change_password_requires_current_password(base_url):
    user = _fresh_user(base_url)
    res = requests.post(
        f"{base_url}/auth/change-password",
        headers=_auth(user["token"]),
        json={"currentPassword": "WrongPassword!", "newPassword": "AnotherPass123!"},
    )
    assert res.status_code == 400
    assert "incorrect" in res.json()["error"].lower()


def test_change_password_requires_authentication(base_url):
    res = requests.post(f"{base_url}/auth/change-password", json={"currentPassword": "x", "newPassword": "AnotherPass123!"})
    assert res.status_code == 401


def test_change_password_then_login_with_new_password(base_url):
    user = _fresh_user(base_url)
    new_password = "UpdatedPass456!"

    res = requests.post(
        f"{base_url}/auth/change-password",
        headers=_auth(user["token"]),
        json={"currentPassword": user["password"], "newPassword": new_password},
    )
    assert res.status_code == 200, res.text
    assert res.json()["user"]["hasPassword"] is True

    old_login = requests.post(f"{base_url}/auth/login", json={"email": user["email"], "password": user["password"]})
    assert old_login.status_code == 401

    new_login = requests.post(f"{base_url}/auth/login", json={"email": user["email"], "password": new_password})
    assert new_login.status_code == 200


def test_change_password_rejects_reusing_current_password(base_url):
    user = _fresh_user(base_url)
    res = requests.post(
        f"{base_url}/auth/change-password",
        headers=_auth(user["token"]),
        json={"currentPassword": user["password"], "newPassword": user["password"]},
    )
    assert res.status_code == 400


def test_google_login_rejects_missing_or_forged_credential(base_url):
    missing = requests.post(f"{base_url}/auth/google", json={})
    # 501 when Google sign-in isn't configured on this server, 400 when it is.
    assert missing.status_code in (400, 501)

    forged = requests.post(f"{base_url}/auth/google", json={"credential": "eyJhbGciOiJSUzI1NiJ9.forged.token"})
    assert forged.status_code in (401, 501)
