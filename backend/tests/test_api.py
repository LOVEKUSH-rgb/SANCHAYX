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
    assert data["active_verified_schemes"] >= 10
    assert len(data["supported_categories"]) >= 10


def test_get_all_schemes():
    res = client.get("/api/schemes")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 10
    # Check that unverified test scheme is excluded from default catalog
    assert not any(s["scheme_id"] == "test_unverified_scheme" for s in schemes)


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
    assert any(s["scheme_id"] == "ppf" for s in schemes)


def test_get_scheme_by_id():
    res = client.get("/api/schemes/ppf")
    assert res.status_code == 200
    scheme = res.json()
    assert scheme["scheme_id"] == "ppf"
    assert scheme["name"] == "Public Provident Fund"
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
    assert data["recommendation_type"] in ["exact_matches", "closest_fit"]
    assert len(data["recommendations"]) > 0
    top = data["recommendations"][0]
    assert top["fit_score"] > 0
    assert top["verified"] is True
    assert top["official_url"] != ""


def test_compare_endpoint():
    payload = {
        "scheme_ids": ["ppf", "nsc"],
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
    assert data["items"][0]["scheme_id"] in ["ppf", "nsc"]


def test_admin_endpoints_protection():
    # Without header -> 403
    res = client.get("/api/admin/schemes")
    assert res.status_code == 403

    # With valid header -> 200
    headers = {"X-Admin-Key": "sanchay_admin_secret_key_2026"}
    res = client.get("/api/admin/schemes", headers=headers)
    assert res.status_code == 200
    all_schemes = res.json()
    # Admin sees unverified test schemes as well
    assert any(s["scheme_id"] == "test_unverified_scheme" for s in all_schemes)
