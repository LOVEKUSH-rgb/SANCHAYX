import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.main import app
from seed_lic import seed_lic_database

client = TestClient(app)


def run_lic_api_suite():
    print("\n=======================================================")
    print("   SANCHAY SEPARATE LIC REST API TEST SUITE")
    print("=======================================================\n")

    # Ensure database is seeded
    seed_lic_database()
    passed_count = 0

    # -------------------------------------------------------------
    # Test 1: GET All Active LIC Plans (/api/v1/lic/plans)
    # -------------------------------------------------------------
    print("Test 1: GET /api/v1/lic/plans (All Active Plans)...")
    res = client.get("/api/v1/lic/plans")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    plans = res.json()
    assert len(plans) == 38, f"Expected 38 active plans, got {len(plans)}"
    
    # Ensure no withdrawn plans
    plan_numbers = {p.get("plan_number") for p in plans}
    withdrawn_numbers = {"760", "914", "915", "917", "945"}
    assert not (plan_numbers & withdrawn_numbers), "Withdrawn plans found in active plans endpoint!"

    # Ensure official URL on all plans
    for p in plans:
        assert p.get("official_lic_url"), f"Missing official_lic_url in {p.get('plan_id')}"
        assert "licindia.in" in p.get("official_lic_url")
    
    passed_count += 1
    print("✓ Test 1 Passed: Exactly 38 active plans returned with official LIC links.")

    # -------------------------------------------------------------
    # Test 2: GET Single LIC Plan (/api/v1/lic/plans/{plan_id})
    # -------------------------------------------------------------
    print("Test 2: GET /api/v1/lic/plans/LIC-001 & /api/v1/lic/plans/717...")
    # 2a. By Plan ID
    res_id = client.get("/api/v1/lic/plans/LIC-001")
    assert res_id.status_code == 200
    p1 = res_id.json()
    assert p1.get("plan_id") == "LIC-001"
    assert p1.get("plan_number") == "717"
    assert p1.get("plan_name") == "LIC's Single Premium Endowment Plan"
    assert p1.get("uin") == "512N283V03"

    # 2b. By Plan Number
    res_num = client.get("/api/v1/lic/plans/717")
    assert res_num.status_code == 200
    assert res_num.json().get("plan_id") == "LIC-001"

    passed_count += 1
    print("✓ Test 2 Passed: Single plan retrieved successfully by ID and Number.")

    # -------------------------------------------------------------
    # Test 3: Invalid Plan ID (404 Not Found)
    # -------------------------------------------------------------
    print("Test 3: GET /api/v1/lic/plans/INVALID-99999 (404 Expectation)...")
    res_404 = client.get("/api/v1/lic/plans/INVALID-99999")
    assert res_404.status_code == 404
    assert "not found" in res_404.json().get("detail", "").lower()
    passed_count += 1
    print("✓ Test 3 Passed: 404 returned correctly for non-existent plan.")

    # -------------------------------------------------------------
    # Test 4: Category Filtering (/api/v1/lic/plans?category=Pension)
    # -------------------------------------------------------------
    print("Test 4: Category Filtering (Pension, Term, Unit Linked, Micro)...")
    # Pension filter (5 plans)
    res_pension = client.get("/api/v1/lic/plans?category=Pension")
    assert res_pension.status_code == 200
    pension_plans = res_pension.json()
    assert len(pension_plans) == 5, f"Expected 5 pension plans, got {len(pension_plans)}"

    # Unit Linked filter (4 plans)
    res_ulip = client.get("/api/v1/lic/plans?category=Unit Linked")
    assert res_ulip.status_code == 200
    ulip_plans = res_ulip.json()
    assert len(ulip_plans) == 4, f"Expected 4 ULIP plans, got {len(ulip_plans)}"

    # Micro Insurance filter (2 plans)
    res_micro = client.get("/api/v1/lic/plans?category=Micro")
    assert res_micro.status_code == 200
    micro_plans = res_micro.json()
    assert len(micro_plans) == 2, f"Expected 2 micro plans, got {len(micro_plans)}"

    passed_count += 1
    print("✓ Test 4 Passed: Category filtering operates accurately across all categories.")

    # -------------------------------------------------------------
    # Test 5: GET LIC Corporate Information (/api/v1/lic/info)
    # -------------------------------------------------------------
    print("Test 5: GET /api/v1/lic/info...")
    res_info = client.get("/api/v1/lic/info")
    assert res_info.status_code == 200
    info = res_info.json()
    assert info.get("short_name") == "LIC"
    assert info.get("irdai_registration_number") == "512"
    assert "1956" in str(info.get("establishment_date"))
    assert "official_product_pages" in info
    assert info["official_product_pages"].get("insurance_plans")
    passed_count += 1
    print("✓ Test 5 Passed: Official LIC corporate and statutory info returned.")

    # -------------------------------------------------------------
    # Test 6: POST /api/v1/lic/recommend - Broad Child Education Query
    # -------------------------------------------------------------
    print("Test 6: POST /api/v1/lic/recommend (Child Education Goal)...")
    payload_child = {
        "age": 32,
        "gender": "Male",
        "child_age": 5,
        "goal": "Child Education",
        "monthly_budget": 5000
    }
    res_rec = client.post("/api/v1/lic/recommend", json=payload_child)
    assert res_rec.status_code == 200
    rec_data = res_rec.json()
    assert rec_data.get("status") == "SUCCESS"
    assert rec_data.get("total_plans_evaluated") == 38
    assert rec_data.get("eligible_count") > 0
    top_p = rec_data.get("recommended_plans", [])[0]
    assert top_p.get("eligible") is True
    assert top_p.get("fit_score") > 60.0
    assert top_p.get("official_lic_url")
    assert "why_it_matches" in top_p
    passed_count += 1
    print(f"✓ Test 6 Passed: Top child education recommendation: {top_p.get('plan_name')} (Score: {top_p.get('fit_score')}%)")

    # -------------------------------------------------------------
    # Test 7: POST /api/v1/lic/recommend - Specific Plan Query
    # -------------------------------------------------------------
    print("Test 7: POST /api/v1/lic/recommend (Specific Plan Query 734)...")
    payload_spec = {
        "age": 32,
        "child_age": 5,
        "goal": "Child Education",
        "specific_plan_id": "734"
    }
    res_spec = client.post("/api/v1/lic/recommend", json=payload_spec)
    assert res_spec.status_code == 200
    spec_data = res_spec.json()
    assert spec_data.get("total_plans_evaluated") == 1
    assert spec_data.get("recommended_plans")[0].get("plan_number") == "734"
    passed_count += 1
    print("✓ Test 7 Passed: Specific plan evaluation returned single result successfully.")

    # -------------------------------------------------------------
    # Test 8: POST /api/v1/lic/recommend - Missing Required Information
    # -------------------------------------------------------------
    print("Test 8: POST /api/v1/lic/recommend (Missing Information on Specific Plan)...")
    payload_missing = {
        "gender": "Male",
        "specific_plan_id": "715"  # New Jeevan Anand without age
    }
    res_missing = client.post("/api/v1/lic/recommend", json=payload_missing)
    assert res_missing.status_code == 200
    missing_data = res_missing.json()
    assert missing_data.get("status") == "ADDITIONAL_INFORMATION_REQUIRED"
    assert "age" in missing_data.get("message").lower()
    passed_count += 1
    print("✓ Test 8 Passed: Missing age flagged as ADDITIONAL_INFORMATION_REQUIRED.")

    # -------------------------------------------------------------
    # Test 9: POST /api/v1/lic/recommend - No Applicable Plan
    # -------------------------------------------------------------
    print("Test 9: POST /api/v1/lic/recommend (No Applicable Plan)...")
    payload_none = {
        "age": 108,
        "gender": "Male"
    }
    res_none = client.post("/api/v1/lic/recommend", json=payload_none)
    assert res_none.status_code == 200
    none_data = res_none.json()
    assert none_data.get("status") == "NO_APPLICABLE_PLAN"
    assert none_data.get("eligible_count") == 0
    assert "No currently matching LIC plan was found" in none_data.get("message")
    passed_count += 1
    print("✓ Test 9 Passed: No applicable plan handled gracefully.")

    # -------------------------------------------------------------
    # Test 10: Invalid Request Validation (Pydantic Safety)
    # -------------------------------------------------------------
    print("Test 10: POST /api/v1/lic/recommend (Invalid Input Validation)...")
    payload_invalid = {
        "age": -15  # Invalid negative age
    }
    res_invalid = client.post("/api/v1/lic/recommend", json=payload_invalid)
    assert res_invalid.status_code == 422  # Unprocessable Entity
    passed_count += 1
    print("✓ Test 10 Passed: Negative age rejected by schema validator with 422.")

    # -------------------------------------------------------------
    # Test 11: Route Aliasing (/api/v1/lic/plans, /api/lic/plans, /lic/plans)
    # -------------------------------------------------------------
    print("Test 11: Route Aliasing Cross-Check...")
    r1 = client.get("/api/v1/lic/plans")
    r2 = client.get("/api/lic/plans")
    r3 = client.get("/lic/plans")
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 200
    assert len(r1.json()) == len(r2.json()) == len(r3.json()) == 38
    passed_count += 1
    print("✓ Test 11 Passed: All URL prefixes (/api/v1/lic, /api/lic, /lic) operational.")

    print(f"\n=======================================================")
    print(f"   ALL {passed_count}/{passed_count} LIC API TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")


if __name__ == "__main__":
    run_lic_api_suite()
