import pytest
import requests
import uuid

def test_user_registration_and_login(base_url):
    unique_email = f"qa_test_{uuid.uuid4().hex[:6]}@example.com"
    password = "TestPassword123!"

    # 1. Register User
    reg_res = requests.post(f"{base_url}/auth/register", json={
        "name": "Test User",
        "email": unique_email,
        "password": password
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "token" in reg_data
    assert reg_data["user"]["email"] == unique_email

    # 2. Duplicate Registration Rejection
    dup_res = requests.post(f"{base_url}/auth/register", json={
        "name": "Duplicate User",
        "email": unique_email,
        "password": password
    })
    assert dup_res.status_code == 400

    # 3. Successful Login
    login_res = requests.post(f"{base_url}/auth/login", json={
        "email": unique_email,
        "password": password
    })
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    assert token is not None

    # 4. Incorrect Password Failure
    bad_login = requests.post(f"{base_url}/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 5. Get Profile /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = requests.get(f"{base_url}/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == unique_email

    # 6. Unauthenticated Protection Test
    unauth_res = requests.get(f"{base_url}/auth/me")
    assert unauth_res.status_code == 401

    # 7. Invalid Token Test
    invalid_res = requests.get(f"{base_url}/auth/me", headers={"Authorization": "Bearer invalid_token_123"})
    assert invalid_res.status_code == 401
