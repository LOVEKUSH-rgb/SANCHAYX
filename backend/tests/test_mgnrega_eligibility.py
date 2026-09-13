import sys
import os
import json
import pytest

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import UserProfile, UserGoal, UserPreferences
from app.engine import evaluate_eligibility, evaluate_scheme_fit


def load_master_schemes():
    master_path = os.path.join(os.path.dirname(backend_dir), "sanchay_master_schemes.json")
    with open(master_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def schemes():
    return load_master_schemes()


def get_scheme(schemes_list, scheme_id_or_short):
    for s in schemes_list:
        if s.get("scheme_id") == scheme_id_or_short or s.get("short_name") == scheme_id_or_short:
            return s
    raise ValueError(f"Scheme not found: {scheme_id_or_short}")


def test_case_a_age_25_salaried_mgnrega(schemes):
    """
    Test Case A: Age 25 + salaried/private employee
    MGNREGA must be INELIGIBLE (formal salaried/private sector employees are ineligible).
    """
    mgnrega = get_scheme(schemes, "mgnrega_001")
    profile = UserProfile(
        age=25,
        gender="male",
        state="Maharashtra",
        residency_status="Resident Indian",
        occupation="salaried",
        annual_income=600000.0
    )
    result = evaluate_eligibility(mgnrega, profile)
    print(f"\n[Test A - MGNREGA Salaried]: Status={result.status}, Eligible={result.eligible}, Failed={result.failed_criteria}")
    
    assert result.status == "INELIGIBLE", f"Expected INELIGIBLE, got {result.status}"
    assert result.eligible is False
    assert any("salaried" in fc.lower() or "occupational" in fc.lower() for fc in result.failed_criteria)


def test_case_b_age_25_student_mgnrega(schemes):
    """
    Test Case B: Age 25 + student
    MGNREGA requires rural household volunteering for unskilled manual labor.
    Since student profile lacks confirmed rural manual labor volunteering, it must return REVIEW_REQUIRED.
    """
    mgnrega = get_scheme(schemes, "mgnrega_001")
    profile = UserProfile(
        age=25,
        gender="female",
        state="Uttar Pradesh",
        residency_status="Resident Indian",
        occupation="student",
        persona="students"
    )
    result = evaluate_eligibility(mgnrega, profile)
    print(f"\n[Test B - MGNREGA Student]: Status={result.status}, Eligible={result.eligible}, ReviewFields={result.review_required_fields}")
    
    assert result.status == "REVIEW_REQUIRED", f"Expected REVIEW_REQUIRED, got {result.status}"
    assert result.eligible is False
    assert "rural_household_labor" in result.review_required_fields


def test_case_c_age_45_farmer_mgnrega(schemes):
    """
    Test Case C: Age 45 + farmer
    Farmer / rural agricultural worker is ELIGIBLE for statutory unskilled wage employment.
    """
    mgnrega = get_scheme(schemes, "mgnrega_001")
    profile = UserProfile(
        age=45,
        gender="male",
        state="Madhya Pradesh",
        residency_status="Resident Indian",
        occupation="farmer",
        persona="farmers"
    )
    result = evaluate_eligibility(mgnrega, profile)
    print(f"\n[Test C - MGNREGA Farmer]: Status={result.status}, Eligible={result.eligible}, Reasons={result.reasons}")
    
    assert result.status == "ELIGIBLE", f"Expected ELIGIBLE, got {result.status}"
    assert result.eligible is True
    assert len(result.reasons) > 0


def test_case_d_age_65_senior_mgnrega(schemes):
    """
    Test Case D: Age 65 + senior citizen
    Adult members of rural households of any age (18+) can volunteer for unskilled manual work under MGNREGA.
    """
    mgnrega = get_scheme(schemes, "mgnrega_001")
    profile = UserProfile(
        age=65,
        gender="male",
        state="Rajasthan",
        residency_status="Resident Indian",
        occupation="senior_citizen",
        persona="seniors"
    )
    result = evaluate_eligibility(mgnrega, profile)
    print(f"\n[Test D - MGNREGA Senior]: Status={result.status}, Eligible={result.eligible}, Reasons={result.reasons}")
    
    assert result.status == "ELIGIBLE", f"Expected ELIGIBLE, got {result.status}"
    assert result.eligible is True


def test_case_e_unrelated_schemes_salaried_age_25(schemes):
    """
    Test Case E: Test PPF, NSC, KVP, APY, SCSS for Age 25 Salaried User
    - PPF: ELIGIBLE
    - NSC: ELIGIBLE
    - KVP: ELIGIBLE
    - APY: ELIGIBLE (Age 25 is within 18-40)
    - SCSS: INELIGIBLE (Age 25 is below 60)
    """
    profile = UserProfile(
        age=25,
        gender="male",
        state="Karnataka",
        residency_status="Resident Indian",
        occupation="salaried",
        annual_income=750000.0
    )

    ppf = get_scheme(schemes, "ppf_001")
    res_ppf = evaluate_eligibility(ppf, profile)
    assert res_ppf.status == "ELIGIBLE", f"PPF expected ELIGIBLE, got {res_ppf.status}"

    nsc = get_scheme(schemes, "nsc_001")
    res_nsc = evaluate_eligibility(nsc, profile)
    assert res_nsc.status == "ELIGIBLE", f"NSC expected ELIGIBLE, got {res_nsc.status}"

    kvp = get_scheme(schemes, "kvp_001")
    res_kvp = evaluate_eligibility(kvp, profile)
    assert res_kvp.status == "ELIGIBLE", f"KVP expected ELIGIBLE, got {res_kvp.status}"

    apy = get_scheme(schemes, "apy_001")
    res_apy = evaluate_eligibility(apy, profile)
    assert res_apy.status == "ELIGIBLE", f"APY expected ELIGIBLE, got {res_apy.status}"

    scss = get_scheme(schemes, "scss_001")
    res_scss = evaluate_eligibility(scss, profile)
    assert res_scss.status == "INELIGIBLE", f"SCSS expected INELIGIBLE for age 25, got {res_scss.status}"
    assert any("age" in fc.lower() for fc in res_scss.failed_criteria)


def test_case_f_fit_score_engine_ineligible_isolation(schemes):
    """
    Test Case F: An ineligible scheme must NEVER receive a fit score or appear in recommendations.
    """
    mgnrega = get_scheme(schemes, "mgnrega_001")
    profile = UserProfile(
        age=25,
        gender="female",
        state="Delhi",
        residency_status="Resident Indian",
        occupation="salaried",
        annual_income=900000.0
    )
    goal = UserGoal(goal="employment", target_amount=100000.0, horizon_years=2)
    pref = UserPreferences(monthly_budget=5000.0, horizon_years=2)

    scored = evaluate_scheme_fit(mgnrega, profile, goal, pref)
    print(f"\n[Test F - Ineligible Isolation]: FitScore={scored.fit_score}, Status={scored.status}")
    
    assert scored.fit_score == 0.0, f"Expected 0.0 fit score for ineligible scheme, got {scored.fit_score}"
    assert scored.status == "INELIGIBLE"


if __name__ == "__main__":
    schemes_data = load_master_schemes()
    print("Running MGNREGA and Eligibility Engine Test Suite...")
    
    test_case_a_age_25_salaried_mgnrega(schemes_data)
    print("PASS: Test Case A (Age 25 Salaried -> MGNREGA INELIGIBLE)")
    
    test_case_b_age_25_student_mgnrega(schemes_data)
    print("PASS: Test Case B (Age 25 Student -> MGNREGA REVIEW_REQUIRED)")
    
    test_case_c_age_45_farmer_mgnrega(schemes_data)
    print("PASS: Test Case C (Age 45 Farmer -> MGNREGA ELIGIBLE)")
    
    test_case_d_age_65_senior_mgnrega(schemes_data)
    print("PASS: Test Case D (Age 65 Senior -> MGNREGA ELIGIBLE)")
    
    test_case_e_unrelated_schemes_salaried_age_25(schemes_data)
    print("PASS: Test Case E (PPF, NSC, KVP, APY ELIGIBLE, SCSS INELIGIBLE for Age 25 Salaried)")
    
    test_case_f_fit_score_engine_ineligible_isolation(schemes_data)
    print("PASS: Test Case F (Ineligible Scheme Fit Score Isolated to 0.0)")
    
    print("\nALL 6 CRITICAL TEST CASES PASSED SUCCESSFULLY!")
