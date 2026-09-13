import json
import os
import pytest
from app.engine import evaluate_eligibility, evaluate_scheme_fit
from app.schemas import UserProfile, UserGoal, UserPreferences
from app.services.scheme_search import search_schemes
from app.services.gemini_adapter import GeminiSakhiAdapter

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "master_schemes.json")


@pytest.fixture
def master_schemes():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        schemes = json.load(f)
    return {s["scheme_id"]: s for s in schemes}


# =========================================================================
# TEST 1: Age 25 + Retirement Goal -> APY (18-40) is ELIGIBLE & High Fit Score
# =========================================================================
def test_user_age_25_retirement_goal(master_schemes):
    apy = master_schemes["apy_001"]
    profile = UserProfile(age=25, gender="all", residency="Resident Indian", residency_status="resident", saving_for="self")
    goal = UserGoal(goal="retirement")
    prefs = UserPreferences(monthly_budget=1000.0, horizon_years=25)

    res = evaluate_eligibility(apy, profile, goal)
    assert res.status == "ELIGIBLE"
    assert res.eligible is True
    assert len(res.failed_criteria) == 0

    scored = evaluate_scheme_fit(apy, profile, goal, prefs)
    assert scored.status == "ELIGIBLE"
    assert scored.fit_score >= 80.0
    assert scored.goal_match == 100.0


# =========================================================================
# TEST 2: Age Outside Joining Range -> APY (max_age 40) is INELIGIBLE for Age 55
# =========================================================================
def test_user_age_55_ineligible_for_apy(master_schemes):
    apy = master_schemes["apy_001"]
    profile = UserProfile(age=55, gender="all", residency="Resident Indian", residency_status="resident", saving_for="self")
    goal = UserGoal(goal="retirement")
    prefs = UserPreferences(monthly_budget=1000.0, horizon_years=10)

    res = evaluate_eligibility(apy, profile, goal)
    assert res.status == "INELIGIBLE"
    assert res.eligible is False
    assert any("exceeds the maximum entry age limit of 40" in f for f in res.failed_criteria)

    # Fit score must remain 0.0 for ineligible scheme
    scored = evaluate_scheme_fit(apy, profile, goal, prefs)
    assert scored.status == "INELIGIBLE"
    assert scored.fit_score == 0.0


# =========================================================================
# TEST 3: State Check -> State-Specific vs Central Schemes
# =========================================================================
def test_state_specific_scheme_filtering():
    # Synthetic state scheme test
    state_scheme = {
        "scheme_id": "test_raj_001",
        "name": {"en": "Rajasthan Farmer Subsidy"},
        "category": "AGRICULTURE",
        "ownership": {"level": "state", "state": "Rajasthan", "ministry": "Agriculture Dept Rajasthan"},
        "verification": {"status": "VERIFIED", "last_verified": "2026-08-28", "official_url": "https://rajasthan.gov.in"},
        "status": {"active": True, "legacy": False, "recommendation_enabled": True},
        "eligibility": {"min_age": None, "max_age": None, "gender": "all"}
    }

    # User in Maharashtra -> Ineligible
    user_mh = UserProfile(age=30, state="Maharashtra", saving_for="self")
    res_mh = evaluate_eligibility(state_scheme, user_mh)
    assert res_mh.status == "INELIGIBLE"
    assert any("Rajasthan" in f for f in res_mh.failed_criteria)

    # User in Rajasthan -> Eligible
    user_raj = UserProfile(age=30, state="Rajasthan", saving_for="self")
    res_raj = evaluate_eligibility(state_scheme, user_raj)
    assert res_raj.status == "ELIGIBLE"


# =========================================================================
# TEST 4: Female + Girl-Child Goal -> SSY (Sukanya) Requires Guardian & Age <= 10
# =========================================================================
def test_girl_child_ssy_eligibility(master_schemes):
    ssy = master_schemes["ssy_001"]

    # Valid girl child (age 6, female, guardian=True)
    girl_profile = UserProfile(age=6, gender="female", saving_for="minor", has_guardian=True, child_age=6)
    res_girl = evaluate_eligibility(ssy, girl_profile)
    assert res_girl.status == "ELIGIBLE"

    # Male child -> Ineligible
    boy_profile = UserProfile(age=6, gender="male", saving_for="minor", has_guardian=True, child_age=6)
    res_boy = evaluate_eligibility(ssy, boy_profile)
    assert res_boy.status == "INELIGIBLE"

    # Girl child exceeding max entry age (age 14 > child_age_limit 10)
    overage_girl = UserProfile(age=14, gender="female", saving_for="minor", has_guardian=True, child_age=14)
    res_overage = evaluate_eligibility(ssy, overage_girl)
    assert res_overage.status == "INELIGIBLE"
    assert any("exceeds statutory maximum limit of 10" in f for f in res_overage.failed_criteria)


# =========================================================================
# TEST 5: Farmer Support -> Senior Citizen vs Farmer Qualification
# =========================================================================
def test_senior_citizen_scss_eligibility(master_schemes):
    scss = master_schemes["scss_001"]

    # Young applicant (age 35) -> Ineligible for SCSS (min age 60)
    young_user = UserProfile(age=35, saving_for="self")
    res_young = evaluate_eligibility(scss, young_user)
    assert res_young.status == "INELIGIBLE"
    assert any("below the minimum joining age of 60" in f for f in res_young.failed_criteria)

    # Senior applicant (age 65) -> Eligible for SCSS
    senior_user = UserProfile(age=65, saving_for="self")
    res_senior = evaluate_eligibility(scss, senior_user)
    assert res_senior.status == "ELIGIBLE"


# =========================================================================
# TEST 6: Zero Eligible Schemes -> No Exact Match Handling
# =========================================================================
def test_zero_eligible_schemes_nri_age_85(master_schemes):
    # PPF is resident-only; SCSS has max investment and APY max age is 40
    ppf = master_schemes["ppf_001"]
    nri_profile = UserProfile(age=85, residency="nri", residency_status="nri", saving_for="self")
    
    res = evaluate_eligibility(ppf, nri_profile)
    assert res.status == "INELIGIBLE"
    assert any("reserved for Resident Indian" in f for f in res.failed_criteria)


# =========================================================================
# TEST 7: Missing Mandatory Information -> REVIEW_REQUIRED
# =========================================================================
def test_missing_mandatory_information(master_schemes):
    apy = master_schemes["apy_001"]
    # Missing age for age-restricted scheme (min_age 18, max_age 40)
    no_age_profile = UserProfile(age=None, saving_for="self")
    
    res = evaluate_eligibility(apy, no_age_profile)
    assert res.status == "REVIEW_REQUIRED"
    assert "age" in res.review_required_fields


# =========================================================================
# TEST 8 & 9: Multi-field Search Across Master Catalog
# =========================================================================
def test_search_master_catalog():
    # Search 'pension'
    pension_results, pension_count = search_schemes(search="pension")
    assert len(pension_results) >= 4
    assert any(s["scheme_id"] in ["apy_001", "nps_001", "eps_001"] for s in pension_results)

    # Search 'education'
    edu_results, edu_count = search_schemes(search="education")
    assert len(edu_results) >= 2


# =========================================================================
# TEST 10: Sakhi Grounded Explanation & Out-of-Scope Guardrail
# =========================================================================
def test_sakhi_guardrail_and_grounded_explanation():
    sakhi = GeminiSakhiAdapter()

    # Out of scope stock query
    stock_resp = sakhi.generate_grounded_response("Which stock or cryptocurrency should I buy?")
    assert stock_resp.intent == "OUT_OF_SCOPE_FINANCIAL_ADVICE"
    assert "stock-picking" in stock_resp.answer or "शेयर बाजार" in stock_resp.answer

    # Contextual recommendation explanation
    context = {
        "scheme_name": "Public Provident Fund",
        "scheme_id": "ppf_001",
        "fit_score": 94,
        "goal": "long_term_savings",
        "monthly_budget": 2500,
        "horizon_years": 15
    }
    rec_resp = sakhi.generate_grounded_response("Why did you recommend this scheme to me?", context=context)
    assert rec_resp.intent == "RECOMMENDATION_EXPLANATION"
    assert "94% Fit Score" in rec_resp.answer or "Public Provident Fund" in rec_resp.answer
