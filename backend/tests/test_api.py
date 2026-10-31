import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from seed_data import seed_database

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db_seeded():
    seed_database()


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["total_active_schemes"] >= 10
    assert data["total_verified_schemes"] >= 10


def test_get_all_schemes():
    res = client.get("/api/schemes")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 10
    # Check that all schemes returned in default catalog are active & verified
    assert all(s.get("verified", True) is True for s in schemes)


def test_category_filtering():
    res = client.get("/api/schemes?category=pension")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 2
    for s in schemes:
        assert s["category"] == "pension" or "pension" in (s.get("sub_category") or "")


def test_search_schemes():
    res = client.get("/api/schemes?search=provident")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 1
    assert any(s["scheme_id"] in ["ppf_001", "ppf"] for s in schemes)


def test_get_scheme_by_id():
    res = client.get("/api/schemes/ppf_001")
    assert res.status_code == 200
    scheme = res.json()
    assert scheme["scheme_id"] == "ppf_001"
    assert "Public Provident Fund" in str(scheme["name"])
    assert scheme["verified"] is True
    assert scheme["official_url"].startswith("http")


def test_recommendations_endpoint():
    payload = {
        "profile": {
            "age": 32,
            "gender": "Female",
            "saving_for": "self",
            "residency_status": "resident"
        },
        "goal": {
            "goal": "wealth"
        },
        "preferences": {
            "monthly_budget": 2000.0,
            "horizon_years": 15,
            "liquidity_preference": "medium",
            "tax_preference": True
        }
    }
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["recommendation_type"] in ["exact_match", "exact_matches", "closest_fit"]
    assert len(data["recommendations"]) > 0
    top = data["recommendations"][0]
    assert top["fit_score"] > 0
    assert top["official_url"].startswith("http")
    assert top["last_verified_date"] != ""


def test_compare_endpoint():
    payload = {
        "scheme_ids": ["ppf_001", "nsc_001"],
        "profile": {
            "age": 30,
            "gender": "Male",
            "residency_status": "resident"
        }
    }
    res = client.post("/api/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_compared"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["scheme_id"] in ["ppf_001", "nsc_001"]


def test_admin_endpoints_protection():
    # 1. Unauthenticated request without header must be rejected with 403
    res_no_auth = client.get("/api/admin/schemes")
    assert res_no_auth.status_code == 403
    assert "Unauthorized" in res_no_auth.json().get("detail", "")

    # 2. Invalid admin key must be rejected with 403
    res_bad_key = client.get("/api/admin/schemes", headers={"X-Admin-Key": "invalid_wrong_key"})
    assert res_bad_key.status_code == 403
    assert "Unauthorized" in res_bad_key.json().get("detail", "")

    # 3. Post creation endpoint must also be protected with 403
    res_post_unauth = client.post("/api/admin/schemes", json={})
    assert res_post_unauth.status_code == 403

    # 4. Valid admin key must successfully authenticate and return full schema catalog
    headers = {"X-Admin-Key": "sanchay_admin_secret_key_2026"}
    res_auth = client.get("/api/admin/schemes", headers=headers)
    assert res_auth.status_code == 200
    all_schemes = res_auth.json()
    assert len(all_schemes) >= 184
    # Validate essential schema fields on admin records
    sample = all_schemes[0]
    assert "scheme_id" in sample and "name" in sample and "verification" in sample
