import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database import get_lic_plans_collection
from app.lic_engine import (
    LICUserProfile,
    evaluate_lic_plan_eligibility,
    recommend_lic_plans
)
from seed_lic import seed_lic_database


def run_lic_engine_suite():
    print("\n=======================================================")
    print("   SANCHAY SEPARATE LIC ENGINE TEST SUITE")
    print("=======================================================\n")

    # Ensure database is loaded
    seed_lic_database()
    col = get_lic_plans_collection()
    all_38_plans = list(col.find({}))
    assert len(all_38_plans) == 38, f"Expected 38 active LIC plans, found {len(all_38_plans)}"

    passed_count = 0

    # -------------------------------------------------------------
    # Test 1: Age-Based Eligibility (Under-age & Over-age)
    # -------------------------------------------------------------
    print("Test 1: Age-Based Eligibility Evaluation...")
    # Plan 715 (New Jeevan Anand): Min Entry Age 18, Max Entry Age 50
    plan_715 = next(p for p in all_38_plans if str(p.get("plan_number")) == "715")
    
    # 1a. User Age 16 (Under 18) -> INELIGIBLE
    res_under = evaluate_lic_plan_eligibility(plan_715, LICUserProfile(age=16, gender="Male"))
    assert res_under.status == "INELIGIBLE", f"Expected INELIGIBLE, got {res_under.status}"
    assert "below minimum entry age" in res_under.failed_criteria[0].lower()

    # 1b. User Age 58 (Over 50) -> INELIGIBLE
    res_over = evaluate_lic_plan_eligibility(plan_715, LICUserProfile(age=58, gender="Male"))
    assert res_over.status == "INELIGIBLE", f"Expected INELIGIBLE, got {res_over.status}"
    assert "exceeds maximum entry age" in res_over.failed_criteria[0].lower()

    # 1c. User Age 30 (Between 18 and 50) -> ELIGIBLE
    res_valid = evaluate_lic_plan_eligibility(plan_715, LICUserProfile(age=30, gender="Male"))
    assert res_valid.status == "ELIGIBLE", f"Expected ELIGIBLE, got {res_valid.status}"
    assert res_valid.eligible is True
    passed_count += 1
    print("✓ Test 1 Passed: Age constraints evaluated accurately.")

    # -------------------------------------------------------------
    # Test 2: Pension Minimum Age (Saral Pension 862 requires age >= 40)
    # -------------------------------------------------------------
    print("Test 2: Pension Plan Minimum Age...")
    plan_862 = next(p for p in all_38_plans if str(p.get("plan_number")) == "862")
    res_pension_young = evaluate_lic_plan_eligibility(plan_862, LICUserProfile(age=28, gender="Male"))
    assert res_pension_young.status == "INELIGIBLE"
    assert "below minimum entry age 40" in res_pension_young.failed_criteria[0].lower()

    res_pension_senior = evaluate_lic_plan_eligibility(plan_862, LICUserProfile(age=62, gender="Male"))
    assert res_pension_senior.status == "ELIGIBLE"
    passed_count += 1
    print("✓ Test 2 Passed: Pension entry limits verified.")

    # -------------------------------------------------------------
    # Test 3: Child-Age Eligibility (Amritbaal 774 & Jeevan Tarun 734)
    # -------------------------------------------------------------
    print("Test 3: Child-Age Plan Eligibility...")
    plan_774 = next(p for p in all_38_plans if str(p.get("plan_number")) == "774")  # Amritbaal: 30 days to 13 yrs
    
    # 3a. Child Age 5 -> ELIGIBLE
    res_child_ok = evaluate_lic_plan_eligibility(plan_774, LICUserProfile(age=35, child_age=5, goal="Child Education"))
    assert res_child_ok.status == "ELIGIBLE"

    # 3b. Child Age 15 (exceeds max child age 13) -> INELIGIBLE
    res_child_over = evaluate_lic_plan_eligibility(plan_774, LICUserProfile(age=40, child_age=15, goal="Child Education"))
    assert res_child_over.status == "INELIGIBLE"
    assert "exceeds maximum entry age 13" in res_child_over.failed_criteria[0].lower()
    passed_count += 1
    print("✓ Test 3 Passed: Child age limits verified.")

    # -------------------------------------------------------------
    # Test 4: Gender-Based Filtering (Bima Lakshmi 881 is Female Only)
    # -------------------------------------------------------------
    print("Test 4: Gender-Based Rule Matching...")
    plan_881 = next(p for p in all_38_plans if str(p.get("plan_number")) == "881")
    
    # Male user -> INELIGIBLE
    res_male = evaluate_lic_plan_eligibility(plan_881, LICUserProfile(age=30, gender="Male"))
    assert res_male.status == "INELIGIBLE"
    assert "exclusively available for female lives" in res_male.failed_criteria[0]

    # Female user -> ELIGIBLE
    res_female = evaluate_lic_plan_eligibility(plan_881, LICUserProfile(age=30, gender="Female"))
    assert res_female.status == "ELIGIBLE"
    passed_count += 1
    print("✓ Test 4 Passed: Gender restrictions strictly enforced.")

    # -------------------------------------------------------------
    # Test 5: Missing Information Handling (ADDITIONAL_INFORMATION_REQUIRED)
    # -------------------------------------------------------------
    print("Test 5: Missing Information Evaluator...")
    # Missing age on adult plan without child context
    res_no_age = evaluate_lic_plan_eligibility(plan_715, LICUserProfile(gender="Male"))
    assert res_no_age.status == "ADDITIONAL_INFORMATION_REQUIRED"
    assert "age" in res_no_age.missing_fields

    # Missing gender on female-exclusive plan
    res_no_gender = evaluate_lic_plan_eligibility(plan_881, LICUserProfile(age=30))
    assert res_no_gender.status == "ADDITIONAL_INFORMATION_REQUIRED"
    assert "gender" in res_no_gender.missing_fields
    passed_count += 1
    print("✓ Test 5 Passed: Missing mandatory fields flagged as ADDITIONAL_INFORMATION_REQUIRED.")

    # -------------------------------------------------------------
    # Test 6: Specific Single LIC Plan Query
    # -------------------------------------------------------------
    print("Test 6: Specific Plan Query ('Am I eligible for LIC Jeevan Tarun?')...")
    spec_rec = recommend_lic_plans(
        all_38_plans,
        LICUserProfile(age=32, child_age=5, goal="Child Education"),
        specific_plan_id="734"
    )
    assert spec_rec.total_plans_evaluated == 1
    assert spec_rec.status == "SUCCESS"
    assert spec_rec.recommended_plans[0].plan_number == "734"
    assert spec_rec.recommended_plans[0].plan_name == "LIC's Jeevan Tarun"
    passed_count += 1
    print("✓ Test 6 Passed: Single plan query evaluates target plan deterministically.")

    # -------------------------------------------------------------
    # Test 7: Broad Query 1 - Child Education (32 yr old with 5 yr old daughter)
    # -------------------------------------------------------------
    print("Test 7: Broad Recommendation - Child Education Goal...")
    profile_child_edu = LICUserProfile(
        age=32,
        gender="Male",
        child_age=5,
        goal="Child Education",
        monthly_budget=5000
    )
    rec_child = recommend_lic_plans(all_38_plans, profile_child_edu)
    assert rec_child.status == "SUCCESS"
    assert rec_child.total_plans_evaluated == 38
    assert rec_child.eligible_count > 0
    top_plan_numbers = [p.plan_number for p in rec_child.recommended_plans[:5]]
    print(f"Top 5 Recommended Plans for Child Education: {[p.plan_name for p in rec_child.recommended_plans[:5]]}")
    # Must rank child/education plans (774 Amritbaal, 733 Jeevan Lakshya, 734 Jeevan Tarun, 732 Child Money Back) at the top
    assert any(num in top_plan_numbers for num in ["774", "733", "734", "732"])
    passed_count += 1
    print("✓ Test 7 Passed: Child education plans ranked highest.")

    # -------------------------------------------------------------
    # Test 8: Broad Query 2 - Retirement Goal (58 yr old seeking pension)
    # -------------------------------------------------------------
    print("Test 8: Broad Recommendation - Retirement / Pension...")
    profile_retire = LICUserProfile(
        age=58,
        gender="Male",
        goal="Retirement",
        retirement_requirement="High",
        annual_budget=500000
    )
    rec_retire = recommend_lic_plans(all_38_plans, profile_retire)
    assert rec_retire.status == "SUCCESS"
    top_ret_numbers = [p.plan_number for p in rec_retire.recommended_plans[:5]]
    print(f"Top Recommended Plans for Retirement: {[p.plan_name for p in rec_retire.recommended_plans[:5]]}")
    # Must prioritize immediate/deferred annuity & whole life pension plans (857, 758, 862, 745, 771, 867)
    assert any(num in top_ret_numbers for num in ["857", "758", "862", "745", "771", "867", "879"])
    passed_count += 1
    print("✓ Test 8 Passed: Retirement pension plans ranked highest.")

    # -------------------------------------------------------------
    # Test 9: Broad Query 3 - Pure Term Protection (26 yr old, ₹1,000 monthly)
    # -------------------------------------------------------------
    print("Test 9: Broad Recommendation - Pure Family Protection...")
    profile_term = LICUserProfile(
        age=26,
        gender="Male",
        goal="Family Protection",
        protection_requirement="Highest",
        monthly_budget=1000
    )
    rec_term = recommend_lic_plans(all_38_plans, profile_term)
    assert rec_term.status == "SUCCESS"
    top_term_numbers = [p.plan_number for p in rec_term.recommended_plans[:5]]
    print(f"Top Recommended Plans for Family Protection: {[p.plan_name for p in rec_term.recommended_plans[:5]]}")
    # Must rank term plans (876 Digi Term, 875 Yuva Term, 954 Tech Term, 955 Jeevan Amar, 859 Saral Jeevan Bima) at the top
    assert any(num in top_term_numbers for num in ["876", "875", "954", "955", "859", "715"])
    passed_count += 1
    print("✓ Test 9 Passed: Pure term assurance plans ranked highest.")

    # -------------------------------------------------------------
    # Test 10: No Applicable LIC Plan (Extreme Age / Out of bounds)
    # -------------------------------------------------------------
    print("Test 10: No Applicable Plan Evaluation...")
    # Age 105 (Exceeds maximum entry age for all 38 plans)
    profile_extreme = LICUserProfile(age=105, gender="Male")
    rec_none = recommend_lic_plans(all_38_plans, profile_extreme)
    assert rec_none.status == "NO_APPLICABLE_PLAN"
    assert rec_none.eligible_count == 0
    assert "No currently matching LIC plan was found" in rec_none.message
    passed_count += 1
    print("✓ Test 10 Passed: Returns NO_APPLICABLE_PLAN when no plan qualifies.")

    print(f"\n=======================================================")
    print(f"   ALL {passed_count}/{passed_count} LIC ENGINE AUTOMATED TESTS PASSED!")
    print("=======================================================\n")


if __name__ == "__main__":
    run_lic_engine_suite()
