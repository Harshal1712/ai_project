import pytest
import requests
import uuid

BASE_URL = "http://localhost:5000/api"

@pytest.fixture(scope="session")
def base_url():
    return BASE_URL

@pytest.fixture(scope="session")
def user_a_credentials():
    unique_id = str(uuid.uuid4())[:8]
    email = f"user_a_{unique_id}@example.com"
    password = "SecurePassword123!"
    name = "User A"
    
    # Register User A
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    token = res.json()["token"]
    user_id = res.json()["user"]["id"]
    return {"email": email, "password": password, "token": token, "id": user_id}

@pytest.fixture(scope="session")
def user_b_credentials():
    unique_id = str(uuid.uuid4())[:8]
    email = f"user_b_{unique_id}@example.com"
    password = "SecurePassword456!"
    name = "User B"
    
    # Register User B
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    token = res.json()["token"]
    user_id = res.json()["user"]["id"]
    return {"email": email, "password": password, "token": token, "id": user_id}
