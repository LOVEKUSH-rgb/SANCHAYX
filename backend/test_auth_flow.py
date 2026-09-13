import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_auth_flow():
    print("1. Testing Register...")
    test_user = {
        "full_name": "Rohan Sharma",
        "email": "rohan.sharma.test@example.com",
        "mobile": "9876543210",
        "age": 29,
        "gender": "male",
        "profession": "Private Sector",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=test_user)
    print("Register response:", r.status_code, r.json())
    assert r.status_code == 200, f"Register failed: {r.text}"
    v_code = r.json().get("verification_code_preview")

    print("\n2. Testing Login before verification (should require verification)...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": test_user["email"], "password": "Password123!"})
    print("Login before verify response:", r.status_code, r.json())
    assert r.json().get("status") == "unverified"

    print("\n3. Testing Verify Email...")
    r = requests.post(f"{BASE_URL}/auth/verify-email", json={"email": test_user["email"], "code": v_code})
    print("Verify Email response:", r.status_code, r.json())
    assert r.status_code == 200
    token = r.json().get("token")
    assert token is not None

    print("\n4. Testing Login after verification...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": test_user["email"], "password": "Password123!"})
    print("Login response:", r.status_code, r.json())
    assert r.status_code == 200
    token = r.json().get("token")

    print("\n5. Testing /auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print("Me response:", r.status_code, r.json())
    assert r.json().get("full_name") == "Rohan Sharma"

    print("\n6. Testing Add to My Plans (ppf_001)...")
    r = requests.post(f"{BASE_URL}/auth/plans/add", json={"scheme_id": "ppf_001"}, headers=headers)
    print("Add plan response:", r.status_code, r.json())
    assert "ppf_001" in r.json().get("saved_plans")

    print("\n7. Testing Get Saved Plans...")
    r = requests.get(f"{BASE_URL}/auth/plans", headers=headers)
    print("Get plans response:", r.status_code, len(r.json()), "plans found")
    assert len(r.json()) >= 1

    print("\n8. Testing Remove Saved Plan...")
    r = requests.post(f"{BASE_URL}/auth/plans/remove", json={"scheme_id": "ppf_001"}, headers=headers)
    print("Remove plan response:", r.status_code, r.json())
    assert "ppf_001" not in r.json().get("saved_plans")

    print("\n9. Testing Google Login...")
    google_user = {
        "email": "ananya.google@example.com",
        "name": "Ananya Patel",
        "age": 31,
        "gender": "female",
        "profession": "Self-Employed",
        "mobile": "9811223344"
    }
    r = requests.post(f"{BASE_URL}/auth/google", json=google_user)
    print("Google Login response:", r.status_code, r.json())
    assert r.status_code == 200
    assert r.json().get("user", {}).get("is_verified") is True

    print("\n🎉 ALL BACKEND AUTH & PLANS TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_auth_flow()
