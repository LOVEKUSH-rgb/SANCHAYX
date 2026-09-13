import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database import init_db, get_lic_plans_collection, get_lic_information_collection
from app.lic_engine import recommend_lic_plans, LICUserProfile
from seed_lic import seed_lic_database
from seed_master import seed_master_schemes


def test_frontend_lic_integration_endpoints():
    print("\n=======================================================")
    print("   LIC FRONTEND MODULE API INTEGRATION TESTS")
    print("=======================================================\n")
    
    init_db()
    seed_master_schemes()
    seed_lic_database()

    col = get_lic_plans_collection()
    info_col = get_lic_information_collection()

    # 1. Test 38 Active Plans Fetch
    all_active_plans = list(col.find({"$or": [{"active_status": "active"}, {"status": "active"}]}))
    print(f"1. Total Active LIC Plans for Frontend: {len(all_active_plans)}")
    assert len(all_active_plans) == 38, f"Expected 38 active plans, got {len(all_active_plans)}"

    # 2. Test Category Counts for Category Tabs
    categories = {
        "Endowment": 0,
        "Term Assurance": 0,
        "Whole Life": 0,
        "Money Back": 0,
        "Child Plans": 0,
        "Pension": 0,
        "Unit Linked": 0,
        "Micro Insurance": 0
    }
    for p in all_active_plans:
        cat = str(p.get("category", "")).lower()
        if "endowment" in cat:
            categories["Endowment"] += 1
        elif "term" in cat:
            categories["Term Assurance"] += 1
        elif "whole life" in cat:
            categories["Whole Life"] += 1
        elif "money back" in cat:
            categories["Money Back"] += 1
        elif "pension" in cat or "annuity" in cat:
            categories["Pension"] += 1
        elif "unit linked" in cat or "ulip" in cat:
            categories["Unit Linked"] += 1
        elif "micro" in cat:
            categories["Micro Insurance"] += 1

        if p.get("child_age_rules", {}).get("is_child_plan") or str(p.get("plan_number")) in ["774", "732", "734", "733", "890"]:
            categories["Child Plans"] += 1

    print(f"2. Frontend Category Breakdown: {categories}")
    assert categories["Endowment"] == 9
    assert categories["Term Assurance"] == 8
    assert categories["Whole Life"] == 2
    assert categories["Money Back"] == 4
    assert categories["Pension"] == 5
    assert categories["Unit Linked"] == 4
    assert categories["Micro Insurance"] == 2
    assert categories["Child Plans"] >= 4

    # 3. Test Frontend Plan Card Required Fields
    required_card_fields = ["plan_id", "plan_name", "plan_number", "uin", "category", "short_description", "official_lic_url"]
    for p in all_active_plans:
        for f in required_card_fields:
            assert f in p and p[f], f"Plan {p.get('plan_id')} missing mandatory field '{f}'"
        assert "licindia.in" in p["official_lic_url"]

    # 4. Test Recommendation API with Frontend Form Fields
    print("4. Testing Recommendation Form Submissions...")
    
    # 4a. Child Education Goal (e.g. 32 yr old with 5 yr old child)
    res_child = recommend_lic_plans(
        all_active_plans,
        LICUserProfile(age=32, gender="Male", profession="Salaried", monthly_budget=5000, goal="Child Education", child_age=5)
    )
    assert res_child.status == "SUCCESS"
    assert res_child.eligible_count > 0
    assert res_child.recommended_plans[0].match_score > 0
    assert len(res_child.recommended_plans[0].match_reasons) > 0
    assert len(res_child.recommended_plans[0].important_conditions) > 0

    # 4b. Pension Goal (e.g. 58 yr old with ₹50,000/yr budget)
    res_pension = recommend_lic_plans(
        all_active_plans,
        LICUserProfile(age=58, gender="Male", annual_budget=50000, goal="Retirement", retirement_requirement="High")
    )
    assert res_pension.status == "SUCCESS"
    assert res_pension.eligible_count > 0

    # 4c. Ineligible Scenario (e.g. 105 yr old -> NO_APPLICABLE_PLAN)
    res_none = recommend_lic_plans(
        all_active_plans,
        LICUserProfile(age=105, gender="Male")
    )
    assert res_none.status == "NO_APPLICABLE_PLAN"
    assert "No currently matching LIC plan was found" in res_none.message

    # 5. Test Corporate Info
    lic_info = info_col.find_one({"organization_name": "Life Insurance Corporation of India"})
    assert lic_info is not None
    assert lic_info.get("irdai_registration_number") == "512"
    assert "licindia.in" in lic_info.get("official_website")

    print("\n✓ ALL LIC FRONTEND API INTEGRATION TESTS PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    test_frontend_lic_integration_endpoints()
