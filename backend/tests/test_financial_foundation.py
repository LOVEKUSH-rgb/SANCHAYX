"""
backend/tests/test_financial_foundation.py

Focused tests for the deterministic Smart Budget & Financial Health backend foundation.
Verifies:
1. 50/30/20 budget allocations and surplus calculations.
2. Annual to monthly conversion (without silent overwrite of explicit monthly income).
3. Zero-income and edge-case handling (no division by zero).
4. Savings, emergency, EMI proportional, and protection pillar scoring.
5. Missing/unspecified protection status handled as provisional, not confirmed absent.
6. Public guest access to POST /api/financial/calculate.
7. Authenticated save (PUT) and retrieval (GET) via /api/financial/my-health.
8. Strict user isolation between different user IDs.
9. Existing user attributes (saved_plans, full_name, email) remaining intact after updates.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.schemas import FinancialProfileInput
from app.services.financial_health_engine import calculate_financial_health
from app.services.auth_service import generate_token
from app.database import get_users_collection


@pytest.fixture
def client():
    return TestClient(app)


# ==============================================================================
# 1. CORE DETERMINISTIC CALCULATIONS & SCORING TESTS
# ==============================================================================

def test_budget_and_surplus_calculations():
    inputs = FinancialProfileInput(
        monthly_income=50000.0,
        essential_expenses=20000.0,
        lifestyle_expenses=10000.0,
        monthly_emi=5000.0,
        liquid_savings=120000.0,
        has_life_insurance=True,
        has_health_insurance=True
    )
    result = calculate_financial_health(inputs)

    assert result.monthly_income == 50000.0
    assert result.income_source_type == "explicit_monthly"
    assert result.total_outflow == 35000.0
    assert result.monthly_surplus == 15000.0
    assert result.is_surplus_positive is True

    # 50/30/20 Guidelines
    assert result.budget_50_30_20.needs_guideline_50 == 25000.0
    assert result.budget_50_30_20.wants_guideline_30 == 15000.0
    assert result.budget_50_30_20.savings_guideline_20 == 10000.0
    assert result.budget_50_30_20.actual_needs == 25000.0  # 20k essential + 5k EMI
    assert result.budget_50_30_20.actual_wants == 10000.0
    assert result.budget_50_30_20.actual_savings == 15000.0
    assert result.budget_50_30_20.savings_percentage == 30.0

    # Pillars
    # 30% savings rate (>= 20% benchmark) -> 25.0 pts
    assert result.pillars.savings_score == 25.0
    # 120k / 20k = 6.0 months (>= 6.0 benchmark) -> 25.0 pts
    assert result.pillars.emergency_score == 25.0
    assert result.pillars.emergency_runway_months == 6.0
    # 5k / 50k = 10% (<= 30% benchmark) -> 25.0 pts
    assert result.pillars.emi_score == 25.0
    assert result.pillars.emi_ratio_pct == 10.0
    # Both insured -> 12.5 + 12.5 = 25.0 pts
    assert result.pillars.protection_score == 25.0

    # Refined Semantic Fields
    assert result.budget_50_30_20.potential_savings == 15000.0
    assert result.budget_50_30_20.surplus_percentage == 30.0
    assert result.pillars.surplus_rate_pct == 30.0
    assert result.pillars.potential_savings_rate_pct == 30.0
    assert result.pillars.essential_expense_runway_months == 6.0

    # Ensure insights are purely educational diagnostics and do not prescribe specific investment schemes
    for insight in result.insights:
        assert "PPF" not in insight
        assert "SSY" not in insight
        assert "Post Office" not in insight
        assert "PMJJBY" not in insight

    assert result.total_health_score == 100.0
    assert result.score_grade == "EXCELLENT"


def test_annual_income_conversion_without_overwriting():
    # 1. Derived from annual when monthly is absent
    input_annual_only = FinancialProfileInput(
        annual_income=600000.0,
        essential_expenses=20000.0
    )
    res1 = calculate_financial_health(input_annual_only)
    assert res1.monthly_income == 50000.0
    assert res1.income_source_type == "derived_from_annual"

    # 2. Explicit monthly must NOT be overwritten when both are provided
    input_both = FinancialProfileInput(
        monthly_income=65000.0,
        annual_income=600000.0,
        essential_expenses=20000.0
    )
    res2 = calculate_financial_health(input_both)
    assert res2.monthly_income == 65000.0
    assert res2.income_source_type == "explicit_monthly"


def test_zero_income_and_edge_cases():
    inputs = FinancialProfileInput(
        monthly_income=0.0,
        essential_expenses=12000.0,
        lifestyle_expenses=4000.0,
        monthly_emi=2000.0,
        liquid_savings=0.0
    )
    result = calculate_financial_health(inputs)

    assert result.monthly_income == 0.0
    assert result.income_source_type == "zero_income"
    assert result.total_outflow == 18000.0
    assert result.monthly_surplus == -18000.0
    assert result.is_surplus_positive is False

    assert result.pillars.savings_score == 0.0
    assert result.pillars.emergency_score == 0.0
    assert result.pillars.emi_score == 0.0
    assert result.total_health_score == 0.0
    assert result.score_grade == "CRITICAL"


def test_emi_burden_proportional_scoring():
    # Income = 100,000
    # At 30% EMI (30,000) -> 25.0 pts
    res_30 = calculate_financial_health(FinancialProfileInput(monthly_income=100000.0, monthly_emi=30000.0))
    assert res_30.pillars.emi_score == 25.0

    # At 40% EMI (40,000) -> 12.5 pts (midway between 30% and 50%)
    res_40 = calculate_financial_health(FinancialProfileInput(monthly_income=100000.0, monthly_emi=40000.0))
    assert res_40.pillars.emi_score == 12.5

    # At 50% EMI (50,000) -> 0.0 pts
    res_50 = calculate_financial_health(FinancialProfileInput(monthly_income=100000.0, monthly_emi=50000.0))
    assert res_50.pillars.emi_score == 0.0

    # At 60% EMI (60,000) -> 0.0 pts (cannot be negative)
    res_60 = calculate_financial_health(FinancialProfileInput(monthly_income=100000.0, monthly_emi=60000.0))
    assert res_60.pillars.emi_score == 0.0


def test_protection_scoring_and_unspecified_handling():
    # 1. Both unspecified -> 0 pts, flagged as provisional
    inputs_unspec = FinancialProfileInput(monthly_income=50000.0)
    res_unspec = calculate_financial_health(inputs_unspec)
    assert res_unspec.pillars.protection_score == 0.0
    assert res_unspec.pillars.life_insurance_status == "UNSPECIFIED"
    assert res_unspec.pillars.health_insurance_status == "UNSPECIFIED"
    assert res_unspec.pillars.is_protection_complete is False
    assert res_unspec.data_completeness["is_provisional_score"] is True
    assert "has_life_insurance" in res_unspec.data_completeness["unspecified_fields"]
    assert "has_health_insurance" in res_unspec.data_completeness["unspecified_fields"]

    # 2. Confirmed Life True, Health False -> 12.5 pts, complete
    inputs_partial = FinancialProfileInput(
        monthly_income=50000.0,
        has_life_insurance=True,
        has_health_insurance=False
    )
    res_partial = calculate_financial_health(inputs_partial)
    assert res_partial.pillars.protection_score == 12.5
    assert res_partial.pillars.life_insurance_status == "CONFIRMED_COVERED"
    assert res_partial.pillars.health_insurance_status == "CONFIRMED_UNINSURED"
    assert res_partial.pillars.is_protection_complete is True


# ==============================================================================
# 2. API ENDPOINTS & AUTHENTICATION TESTS
# ==============================================================================

def test_guest_api_calculate_endpoint(client):
    payload = {
        "monthly_income": 40000.0,
        "essential_expenses": 16000.0,
        "lifestyle_expenses": 8000.0,
        "monthly_emi": 4000.0,
        "liquid_savings": 50000.0,
        "has_life_insurance": True,
        "has_health_insurance": True
    }
    # No auth header needed for calculation
    resp = client.post("/api/financial/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["monthly_income"] == 40000.0
    assert data["total_outflow"] == 28000.0
    assert data["monthly_surplus"] == 12000.0
    assert data["total_health_score"] > 0
    assert "pillars" in data
    assert "budget_50_30_20" in data


def test_authenticated_save_and_retrieval(client):
    users_col = get_users_collection()
    test_user_id = "test_user_journey_001"
    test_email = "journey001@example.com"

    # Ensure user exists in collection
    users_col.update_one(
        {"user_id": test_user_id},
        {"$set": {
            "user_id": test_user_id,
            "email": test_email,
            "full_name": "Journey Test User",
            "saved_plans": ["ppf_001"]
        }},
        upsert=True
    )

    token = generate_token(test_user_id, test_email)
    auth_header = {"Authorization": f"Bearer {token}"}

    # 1. Save financial journey
    profile_data = {
        "monthly_income": 60000.0,
        "essential_expenses": 25000.0,
        "lifestyle_expenses": 10000.0,
        "monthly_emi": 8000.0,
        "liquid_savings": 100000.0,
        "has_life_insurance": True,
        "has_health_insurance": False
    }
    put_resp = client.put("/api/financial/my-health", json=profile_data, headers=auth_header)
    assert put_resp.status_code == 200
    put_data = put_resp.json()
    assert put_data["status"] == "success"
    assert put_data["financial_journey"]["inputs"]["monthly_income"] == 60000.0
    assert put_data["financial_journey"]["results"]["total_outflow"] == 43000.0
    assert put_data["financial_journey"]["results"]["monthly_surplus"] == 17000.0

    # 2. Retrieve financial journey
    get_resp = client.get("/api/financial/my-health", headers=auth_header)
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["status"] == "success"
    assert get_data["has_data"] is True
    assert get_data["user_id"] == test_user_id
    assert get_data["financial_journey"]["inputs"]["monthly_income"] == 60000.0


def test_user_isolation_between_two_users(client):
    users_col = get_users_collection()
    user_a_id = "test_user_a_iso"
    user_b_id = "test_user_b_iso"

    users_col.update_one({"user_id": user_a_id}, {"$set": {"user_id": user_a_id, "email": "usera@test.com"}}, upsert=True)
    users_col.update_one({"user_id": user_b_id}, {"$set": {"user_id": user_b_id, "email": "userb@test.com"}}, upsert=True)

    token_a = generate_token(user_a_id, "usera@test.com")
    token_b = generate_token(user_b_id, "userb@test.com")

    # User A saves income ₹80,000
    client.put("/api/financial/my-health", json={"monthly_income": 80000.0, "essential_expenses": 30000.0}, headers={"Authorization": f"Bearer {token_a}"})

    # User B saves income ₹35,000
    client.put("/api/financial/my-health", json={"monthly_income": 35000.0, "essential_expenses": 15000.0}, headers={"Authorization": f"Bearer {token_b}"})

    # GET User A -> Must return 80,000
    resp_a = client.get("/api/financial/my-health", headers={"Authorization": f"Bearer {token_a}"})
    assert resp_a.json()["financial_journey"]["inputs"]["monthly_income"] == 80000.0
    assert resp_a.json()["user_id"] == user_a_id

    # GET User B -> Must return 35,000 (never User A's data)
    resp_b = client.get("/api/financial/my-health", headers={"Authorization": f"Bearer {token_b}"})
    assert resp_b.json()["financial_journey"]["inputs"]["monthly_income"] == 35000.0
    assert resp_b.json()["user_id"] == user_b_id


def test_existing_user_fields_and_saved_plans_intact(client):
    users_col = get_users_collection()
    user_id = "test_preserve_user_001"
    email = "preserve@example.com"

    users_col.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "email": email,
            "full_name": "Priya Sharma",
            "profession": "Software Engineer",
            "saved_plans": ["ppf_001", "ssy_001", "lic-905"],
            "profile_photo": "data:image/jpeg;base64,mockphoto"
        }},
        upsert=True
    )

    token = generate_token(user_id, email)
    auth_header = {"Authorization": f"Bearer {token}"}

    # Save financial journey
    client.put("/api/financial/my-health", json={"monthly_income": 90000.0, "essential_expenses": 35000.0}, headers=auth_header)

    # Re-fetch raw user document from database
    user_doc = users_col.find_one({"user_id": user_id})

    # Assert existing user fields are completely intact
    assert user_doc["full_name"] == "Priya Sharma"
    assert user_doc["profession"] == "Software Engineer"
    assert user_doc["saved_plans"] == ["ppf_001", "ssy_001", "lic-905"]
    assert user_doc["profile_photo"] == "data:image/jpeg;base64,mockphoto"
    assert "financial_journey" in user_doc
    assert user_doc["financial_journey"]["inputs"]["monthly_income"] == 90000.0
