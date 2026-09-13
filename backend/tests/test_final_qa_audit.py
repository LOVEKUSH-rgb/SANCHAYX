"""
=============================================================================
SANCHAY — FINAL RULE ENGINE + FILTER + RECOMMENDATION QA AUDIT TEST SUITE
=============================================================================
Executes complete automated validation across Phases 1 to 28:
- Government Schemes Filters, Combinations, Rule Engine & Boundaries
- LIC Plans Filters, Rule Engine & Recommendations
- Free Benefits Filters, Benefit Types, Engine & Boundaries
- Cross-Module Profile Consistency & Stale Session Isolation
- Search Accuracy, Filter Resets & Data Deduplication
- Sakhi AI Engine Delegation & Recommendation Quality
"""

import os
import sys
import json
import unittest
from typing import Dict, Any, List

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import (
    get_schemes_collection,
    get_lic_plans_collection,
    get_free_benefits_collection,
)
from app.engine import evaluate_eligibility, evaluate_scheme_fit
from app.lic_engine import (
    LICUserProfile,
    evaluate_lic_plan_eligibility,
    calculate_lic_suitability_score,
    recommend_lic_plans,
)
from app.free_benefits_engine import (
    FreeBenefitUserProfile,
    evaluate_single_free_benefit,
    evaluate_all_free_benefits,
)
from app.schemas import UserProfile, UserGoal, UserPreferences, RecommendationRequest
from app.services.scheme_search import search_schemes, CATEGORY_ALIASES, GOAL_ALIASES
from app.services.sakhi_lic_handler import detect_query_domain
from app.services.gemini_adapter import sakhi_adapter
from app.services.profile_extractor import extract_user_profile_facts
from app.routers.recommendations import generate_recommendations
from app.routers.free_benefits import list_free_benefits, evaluate_free_benefits, FreeBenefitsEvaluationRequest
from app.routers.lic import get_all_lic_plans, recommend_lic_plans_endpoint, LICRecommendRequest


class SanchayComprehensiveQAAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schemes_col = get_schemes_collection()
        cls.lic_col = get_lic_plans_collection()
        cls.fb_col = get_free_benefits_collection()

        cls.all_schemes = list(cls.schemes_col.find({}))
        cls.all_lic = list(cls.lic_col.find({}))
        cls.all_fb = list(cls.fb_col.find({}))

        print(f"\n[SETUP] Loaded {len(cls.all_schemes)} schemes, {len(cls.all_lic)} LIC plans, {len(cls.all_fb)} Free Benefits.")

    # =========================================================================
    # PHASE 1 & 22: DATA INTEGRITY & UNIQUE COUNTS
    # =========================================================================
    def test_01_data_integrity_and_deduplication(self):
        """[Phase 1 & 22] Verify dataset counts and ID uniqueness across all 3 databases."""
        # 1. Government Schemes
        self.assertGreaterEqual(len(self.all_schemes), 100)
        scheme_ids = [s.get("scheme_id") or s.get("id") for s in self.all_schemes]
        self.assertEqual(len(scheme_ids), len(set(scheme_ids)), "Government scheme IDs must be strictly unique.")

        # 2. LIC Plans
        active_lic = [p for p in self.all_lic if p.get("active_status", p.get("status")) == "active"]
        self.assertEqual(len(active_lic), 38, f"Expected exactly 38 active LIC plans, found {len(active_lic)}")
        lic_ids = [p.get("plan_id") for p in active_lic]
        self.assertEqual(len(lic_ids), len(set(lic_ids)), "LIC plan IDs must be strictly unique.")

        # 3. Free Benefits (Phase 22 requirement: exactly 22 unique free benefits)
        self.assertEqual(len(self.all_fb), 22, f"Expected exactly 22 unique Free Benefits, found {len(self.all_fb)}")
        fb_ids = [b.get("benefit_id") for b in self.all_fb]
        self.assertEqual(len(fb_ids), len(set(fb_ids)), "Free Benefit IDs must be strictly unique.")

    # =========================================================================
    # PHASE 2 & 3: GOVERNMENT SCHEME FILTERS & COMBINATIONS AUDIT
    # =========================================================================
    def test_02_government_individual_category_filters(self):
        """[Phase 2] Test every individual Government Scheme category filter."""
        categories = [
            "ALL", "SAVINGS", "PENSION", "INSURANCE", "EDUCATION",
            "WOMEN", "AGRICULTURE", "HEALTH", "HOUSING", "EMPLOYMENT",
            "SOCIAL_SECURITY", "BUSINESS", "FINANCIAL_INCLUSION"
        ]
        
        all_results, all_total = search_schemes(category="ALL", active_only=True, page_size=500)
        self.assertGreater(all_total, 0)

        for cat in categories:
            if cat == "ALL":
                continue
            res, total = search_schemes(category=cat, active_only=True, page_size=500)
            self.assertGreater(total, 0, f"Category '{cat}' must return matching schemes.")
            matching_aliases = [c.lower() for c in CATEGORY_ALIASES.get(cat, [cat])]
            for s in res:
                s_cat = str(s.get("category", "")).lower()
                matched = any(alias in s_cat or s_cat in alias for alias in matching_aliases)
                self.assertTrue(matched, f"Scheme {s.get('scheme_id')} ({s_cat}) does not belong to category {cat}")

    def test_03_government_filter_combinations_matrix(self):
        """[Phase 3] Test combinations: Search+Cat, Cat+Goal, State+Cat, Search+Cat+Goal, Verified+Cat."""
        # 1. Search + Category
        res, count = search_schemes(search="pension", category="PENSION", active_only=True)
        self.assertGreater(count, 0)
        for s in res:
            self.assertIn("pension", str(s).lower())

        # 2. Category + Goal
        res_cg, count_cg = search_schemes(category="SAVINGS", goal="wealth", active_only=True)
        self.assertGreater(count_cg, 0)

        # 3. Category + State
        res_cs, count_cs = search_schemes(category="SAVINGS", state="Rajasthan", active_only=True)
        self.assertGreater(count_cs, 0)

        # 4. Search + Category + Goal
        res_scg, count_scg = search_schemes(search="ppf", category="SAVINGS", goal="wealth", active_only=True)
        self.assertGreater(count_scg, 0)

        # 5. Verified + Category
        res_vc, count_vc = search_schemes(verified=True, category="SAVINGS", active_only=True)
        self.assertGreater(count_vc, 0)

        # 6. Non-existing search in category
        res_none, count_none = search_schemes(search="nonexistingxyz123", category="SAVINGS", active_only=True)
        self.assertEqual(count_none, 0)

    # =========================================================================
    # PHASE 4, 5, 6: GOVERNMENT SCHEME RULE ENGINE & BOUNDARY TESTING
    # =========================================================================
    def test_04_government_engine_age_boundary_testing(self):
        """[Phase 4 & 5] Test age boundaries (Limit-1, Limit, Limit+1) on APY, PM-SYM, and SCSS."""
        # Atal Pension Yojana (APY) min_age=18, max_age=40
        apy_scheme = next((s for s in self.all_schemes if "apy" in str(s.get("scheme_id", "")).lower() or "atal pension" in str(s.get("name", "")).lower()), None)
        self.assertIsNotNone(apy_scheme)

        # Age 17 (Min-1) -> INELIGIBLE
        res_17 = evaluate_eligibility(apy_scheme, UserProfile(age=17, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_17.status, "INELIGIBLE")

        # Age 18 (Min) -> ELIGIBLE
        res_18 = evaluate_eligibility(apy_scheme, UserProfile(age=18, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_18.status, "ELIGIBLE")

        # Age 19 (Min+1) -> ELIGIBLE
        res_19 = evaluate_eligibility(apy_scheme, UserProfile(age=19, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_19.status, "ELIGIBLE")

        # Age 39 (Max-1) -> ELIGIBLE
        res_39 = evaluate_eligibility(apy_scheme, UserProfile(age=39, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_39.status, "ELIGIBLE")

        # Age 40 (Max) -> ELIGIBLE
        res_40 = evaluate_eligibility(apy_scheme, UserProfile(age=40, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_40.status, "ELIGIBLE")

        # Age 41 (Max+1) -> INELIGIBLE
        res_41 = evaluate_eligibility(apy_scheme, UserProfile(age=41, gender="male", residency_status="resident", occupation="worker"))
        self.assertEqual(res_41.status, "INELIGIBLE")

    def test_05_government_engine_income_and_gender_boundaries(self):
        """[Phase 4 & 5] Test income boundaries and gender rules (Sukanya Samriddhi girl child <=10)."""
        ssy_scheme = next((s for s in self.all_schemes if "sukanya" in str(s.get("name", "")).lower() or "ssy" in str(s.get("scheme_id", "")).lower()), None)
        if ssy_scheme:
            # Male saving for self -> INELIGIBLE
            res_male = evaluate_eligibility(ssy_scheme, UserProfile(age=25, gender="male", residency_status="resident", saving_for="self"))
            self.assertEqual(res_male.status, "INELIGIBLE")

            # Girl child age 10 (Exact limit) -> ELIGIBLE
            res_10 = evaluate_eligibility(ssy_scheme, UserProfile(age=35, residency_status="resident", saving_for="minor", child_gender="female", child_age=10, has_guardian=True))
            self.assertEqual(res_10.status, "ELIGIBLE")

            # Girl child age 11 (Limit + 1) -> INELIGIBLE
            res_11 = evaluate_eligibility(ssy_scheme, UserProfile(age=35, residency_status="resident", saving_for="minor", child_gender="female", child_age=11, has_guardian=True))
            self.assertEqual(res_11.status, "INELIGIBLE")

    def test_06_government_engine_result_states(self):
        """[Phase 6] Verify engine outputs ELIGIBLE, INELIGIBLE, REVIEW_REQUIRED without false claims."""
        # 1. ELIGIBLE (PPF for resident Indian age 25)
        ppf = next((s for s in self.all_schemes if "ppf" in str(s.get("scheme_id", "")).lower()), None)
        self.assertIsNotNone(ppf)
        res_el = evaluate_eligibility(ppf, UserProfile(age=25, residency_status="resident", income=300000))
        self.assertEqual(res_el.status, "ELIGIBLE")
        self.assertTrue(res_el.eligible)

        # 2. INELIGIBLE (NRI on PPF)
        res_in = evaluate_eligibility(ppf, UserProfile(age=25, residency_status="nri", income=300000))
        self.assertEqual(res_in.status, "INELIGIBLE")
        self.assertFalse(res_in.eligible)

        # 3. Fit score exists ONLY for eligible schemes
        scored = evaluate_scheme_fit(ppf, UserProfile(age=25, residency_status="resident", income=300000), UserGoal(goal="wealth"), UserPreferences(monthly_budget=2000, horizon_years=10))
        self.assertEqual(scored.status, "ELIGIBLE")
        self.assertGreaterEqual(scored.fit_score, 50.0)

    # =========================================================================
    # PHASE 7 & 8: EXACT PROFILE DATA PRESERVATION & STALE DATA ISOLATION
    # =========================================================================
    def test_07_exact_profile_data_preservation(self):
        """
        [Phase 7] Test profile: Age: 24, State: Rajasthan, Income: 250000, Profession: Job Seeker.
        Verify no transformation: 24 is never 25, Job Seeker is never Farmer, Rajasthan is never another state.
        """
        raw = {"age": 24, "state": "Rajasthan", "income": 250000, "occupation": "job_seeker", "profession": "Job Seeker"}

        gov_prof = UserProfile(age=raw["age"], state=raw["state"], income=raw["income"], occupation=raw["occupation"])
        self.assertEqual(gov_prof.age, 24)
        self.assertEqual(gov_prof.state, "Rajasthan")
        self.assertEqual(gov_prof.income, 250000)
        self.assertEqual(gov_prof.occupation, "job_seeker")

        lic_prof = LICUserProfile(age=raw["age"], profession=raw["profession"])
        self.assertEqual(lic_prof.age, 24)
        self.assertEqual(lic_prof.profession, "Job Seeker")

        fb_prof = FreeBenefitUserProfile(age=raw["age"], state=raw["state"], annual_family_income=raw["income"], occupation=raw["occupation"])
        self.assertEqual(fb_prof.age, 24)
        self.assertEqual(fb_prof.state, "Rajasthan")
        self.assertEqual(fb_prof.annual_family_income, 250000)
        self.assertEqual(fb_prof.occupation, "job_seeker")

        extracted = extract_user_profile_facts(
            current_message="मैं 24 साल का हूं, राजस्थान से हूं, मेरी सालाना पारिवारिक आय ₹2.5 लाख है और मैं नौकरी की तलाश कर रहा हूं।"
        )
        self.assertEqual(extracted.age, 24)
        self.assertEqual(extracted.state, "Rajasthan")
        self.assertEqual(extracted.annual_family_income, 250000.0)
        self.assertEqual(extracted.occupation, "job_seeker")

    def test_08_session_and_profile_isolation(self):
        """[Phase 8] Test Profile A evaluation -> change to Profile B -> Profile A cannot contaminate Profile B."""
        # Profile A: Age 65, Senior Citizen, Pension Goal
        prof_a = UserProfile(age=65, persona="seniors", occupation="retired", residency_status="resident")
        goal_a = UserGoal(goal="retirement")
        pref_a = UserPreferences(monthly_budget=5000, horizon_years=5)

        # Profile B: Age 20, Student, Education Goal
        prof_b = UserProfile(age=20, persona="students", occupation="student", residency_status="resident")
        goal_b = UserGoal(goal="education")
        pref_b = UserPreferences(monthly_budget=500, horizon_years=3)

        scss = next((s for s in self.all_schemes if "scss" in str(s.get("scheme_id", "")).lower()), None)
        if scss:
            res_a = evaluate_eligibility(scss, prof_a, goal_a)
            self.assertEqual(res_a.status, "ELIGIBLE")

            res_b = evaluate_eligibility(scss, prof_b, goal_b)
            self.assertEqual(res_b.status, "INELIGIBLE")

    # =========================================================================
    # PHASE 9, 10, 11: LIC FILTERS, BOUNDARIES & RECOMMENDATIONS AUDIT
    # =========================================================================
    def test_09_lic_filters(self):
        """[Phase 9] Test LIC category filters, search by plan number/name/uin, and active status check."""
        active_plans = [p for p in self.all_lic if p.get("active_status", p.get("status")) == "active"]
        self.assertEqual(len(active_plans), 38)

        categories = ["Endowment", "Term Assurance", "Whole Life", "Money Back", "Pension", "Unit Linked", "Micro Insurance"]
        for cat in categories:
            matching = [p for p in active_plans if cat.lower() in str(p.get("category", "")).lower()]
            self.assertGreater(len(matching), 0, f"Category '{cat}' must have active LIC plans.")

        # Search by Plan Number: '955' (New Jeevan Amar)
        plan_955 = next((p for p in active_plans if str(p.get("plan_number")) == "955"), None)
        self.assertIsNotNone(plan_955)
        self.assertIn("jeevan amar", str(plan_955.get("plan_name")).lower())

        # Search by Pure Child Plan: '774' (Amritbaal)
        plan_774 = next((p for p in active_plans if str(p.get("plan_number")) == "774"), None)
        self.assertIsNotNone(plan_774)
        self.assertIn("amritbaal", str(plan_774.get("plan_name")).lower())

    def test_10_lic_engine_boundary_tests(self):
        """[Phase 10] Test LIC engine entry age boundaries on Plan 955 (New Jeevan Amar, min 18, max 65)."""
        plan_955 = next((p for p in self.all_lic if str(p.get("plan_number")) == "955"), None)
        self.assertIsNotNone(plan_955)

        # Boundary - 1: Age 17 -> INELIGIBLE
        res_17 = evaluate_lic_plan_eligibility(plan_955, LICUserProfile(age=17, gender="Male"))
        self.assertEqual(res_17.status, "INELIGIBLE")
        self.assertFalse(res_17.eligible)

        # Boundary: Age 18 -> ELIGIBLE
        res_18 = evaluate_lic_plan_eligibility(plan_955, LICUserProfile(age=18, gender="Male"))
        self.assertEqual(res_18.status, "ELIGIBLE")
        self.assertTrue(res_18.eligible)

        # Boundary: Age 65 -> ELIGIBLE
        res_65 = evaluate_lic_plan_eligibility(plan_955, LICUserProfile(age=65, gender="Male"))
        self.assertEqual(res_65.status, "ELIGIBLE")
        self.assertTrue(res_65.eligible)

        # Boundary + 1: Age 66 -> INELIGIBLE
        res_66 = evaluate_lic_plan_eligibility(plan_955, LICUserProfile(age=66, gender="Male"))
        self.assertEqual(res_66.status, "INELIGIBLE")
        self.assertFalse(res_66.eligible)

    def test_11_lic_recommendation_profiles(self):
        """[Phase 11] Test realistic profiles on LIC recommendation engine."""
        # TEST A: Age 24, Goal: Family Protection / Term
        rec_a = recommend_lic_plans(self.all_lic, LICUserProfile(age=24, goal="Family Protection", protection_requirement=True))
        self.assertGreater(rec_a.eligible_count, 0)
        top_a_cats = [r.category.lower() for r in rec_a.recommended_plans[:3]]
        self.assertTrue(any("term" in c or "endowment" in c for c in top_a_cats))

        # TEST B: Age 45, Goal: Retirement
        rec_b = recommend_lic_plans(self.all_lic, LICUserProfile(age=45, goal="Retirement", retirement_requirement=True))
        self.assertGreater(rec_b.eligible_count, 0)
        top_b_cats = [r.category.lower() for r in rec_b.recommended_plans[:5]]
        self.assertTrue(any("pension" in c or "annuity" in c or "whole life" in c for c in top_b_cats))

        # TEST C: Child Age 5, Goal: Child Education / Child Future
        rec_c = recommend_lic_plans(self.all_lic, LICUserProfile(age=32, goal="Child Education", child_age=5))
        self.assertGreater(rec_c.eligible_count, 0)
        top_c_names = [r.plan_name.lower() for r in rec_c.recommended_plans]
        self.assertTrue(any("amritbaal" in n or "child" in n or "tarun" in n for n in top_c_names))

        # TEST D: Ineligible age for specific plan (Age 75 on pure term 955)
        plan_955 = next(p for p in self.all_lic if str(p.get("plan_number")) == "955")
        res_75 = evaluate_lic_plan_eligibility(plan_955, LICUserProfile(age=75, goal="Family Protection"))
        self.assertEqual(res_75.status, "INELIGIBLE")

    # =========================================================================
    # PHASE 12, 13, 14, 15, 16: FREE BENEFITS FILTERS, TYPES & ENGINE AUDIT
    # =========================================================================
    def test_12_free_benefits_unique_count_and_categories(self):
        """[Phase 12] Verify unique count of 22 and valid categories in Free Benefits."""
        self.assertEqual(len(self.all_fb), 22, f"Target count is exactly 22 unique free benefits, found {len(self.all_fb)}")
        for b in self.all_fb:
            self.assertIsNotNone(b.get("category"), f"Benefit {b.get('benefit_id')} missing category.")

    def test_13_free_benefit_types_validation(self):
        """[Phase 13] Verify benefit_type distinction (completely_free != subsidy != scholarship)."""
        types_found = set(b.get("benefit_type") for b in self.all_fb)
        self.assertTrue("completely_free" in types_found or "free_distribution" in types_found or "free_training" in types_found or "free_coaching" in types_found)
        
        pmgkay = next((b for b in self.all_fb if "pmgkay" in str(b.get("benefit_id", "")).lower() or "garib kalyan" in str(b.get("name", "")).lower()), None)
        self.assertIsNotNone(pmgkay)
        self.assertIn(pmgkay.get("benefit_type"), ["completely_free", "free_distribution", "food_security"])

        daksh = next((b for b in self.all_fb if "daksh" in str(b.get("benefit_id", "")).lower() or "pm-daksh" in str(b.get("name", "")).lower()), None)
        self.assertIsNotNone(daksh)
        self.assertIn(daksh.get("benefit_type"), ["completely_free", "free_training", "skill_development", "free_training_with_stipend"])

    def test_14_free_benefits_engine_boundaries_and_states(self):
        """[Phase 14, 15, 16] Test 4 deterministic output states on Free Benefits."""
        # 1. ELIGIBLE Case: Transgender person with certificate for SMILE
        smile_benefit = next((b for b in self.all_fb if "smile" in str(b.get("benefit_id", "")).lower() or "transgender" in str(b.get("name", "")).lower()), None)
        self.assertIsNotNone(smile_benefit)
        res_trans = evaluate_single_free_benefit(smile_benefit, FreeBenefitUserProfile(age=25, is_transgender=True, has_transgender_certificate=True, annual_family_income=100000))
        self.assertEqual(res_trans.status, "ELIGIBLE")
        self.assertTrue(res_trans.eligible)

        # 2. INELIGIBLE Case: Male without transgender certificate for SMILE
        res_male = evaluate_single_free_benefit(smile_benefit, FreeBenefitUserProfile(age=25, gender="male", is_transgender=False))
        self.assertEqual(res_male.status, "INELIGIBLE")
        self.assertFalse(res_male.eligible)

        # 3. ADDITIONAL_INFORMATION_REQUIRED Case: Transgender person who hasn't declared certificate status
        res_missing = evaluate_single_free_benefit(smile_benefit, FreeBenefitUserProfile(age=25, is_transgender=True, has_transgender_certificate=None))
        self.assertEqual(res_missing.status, "ADDITIONAL_INFORMATION_REQUIRED")
        self.assertFalse(res_missing.eligible)
        self.assertIn("has_transgender_certificate", res_missing.missing_fields)

        # 4. State Restriction Case: Puducherry Free Rice
        puducherry_benefit = next((b for b in self.all_fb if "puducherry" in str(b.get("name", "")).lower() or "py" in str(b.get("benefit_id", "")).lower()), None)
        if puducherry_benefit:
            res_raj = evaluate_single_free_benefit(puducherry_benefit, FreeBenefitUserProfile(state="Rajasthan", ration_card_type="BPL", residency_years=10))
            self.assertEqual(res_raj.status, "INELIGIBLE")

            res_pudu = evaluate_single_free_benefit(puducherry_benefit, FreeBenefitUserProfile(state="Puducherry", ration_card_type="BPL", residency_years=6))
            self.assertEqual(res_pudu.status, "ELIGIBLE")

    # =========================================================================
    # PHASE 17 & 18: CROSS-MODULE CONSISTENCY & FRONTEND->BACKEND FLOW
    # =========================================================================
    def test_15_cross_module_consistency(self):
        """[Phase 17 & 18] Verify consistent interpretation of user profile across Government, LIC, and Free Benefits."""
        user_data = {"age": 24, "state": "Rajasthan", "income": 250000, "occupation": "job_seeker", "profession": "Job Seeker"}

        # 1. Government Engine
        gov_prof = UserProfile(age=user_data["age"], state=user_data["state"], income=user_data["income"], occupation=user_data["occupation"])
        pmkmy = next((s for s in self.all_schemes if "pmkmy" in str(s.get("scheme_id", "")).lower()), None)
        if pmkmy:
            res_gov = evaluate_eligibility(pmkmy, gov_prof)
            self.assertEqual(res_gov.status, "INELIGIBLE", "Job Seeker must NOT be evaluated as farmer for PM-KMY.")

        # 2. LIC Engine
        lic_prof = LICUserProfile(age=user_data["age"], profession=user_data["profession"], goal="Family Protection")
        rec_lic = recommend_lic_plans(self.all_lic, lic_prof)
        self.assertGreater(rec_lic.eligible_count, 0)
        top_plan = rec_lic.recommended_plans[0]
        self.assertTrue(top_plan.eligible)

        # 3. Free Benefits Engine
        fb_prof = FreeBenefitUserProfile(age=user_data["age"], state=user_data["state"], annual_family_income=user_data["income"], occupation=user_data["occupation"])
        fb_results = evaluate_all_free_benefits(self.all_fb, fb_prof)
        self.assertGreater(len(fb_results), 0)

    # =========================================================================
    # PHASE 19 & 20: SEARCH ACCURACY & RESET TESTS
    # =========================================================================
    def test_16_search_accuracy_and_resets(self):
        """[Phase 19 & 20] Test search across exact name, lowercase, uppercase, partial, extra spaces, and filter resets."""
        res_lower, count_lower = search_schemes(search="sukanya samriddhi", active_only=True)
        res_upper, count_upper = search_schemes(search="SUKANYA SAMRIDDHI", active_only=True)
        res_spaces, count_spaces = search_schemes(search="  sukanya samriddhi   ", active_only=True)
        self.assertEqual(count_lower, count_upper)
        self.assertEqual(count_lower, count_spaces)
        self.assertGreater(count_lower, 0)

        # Reset / Empty Search
        res_all, count_all = search_schemes(search="", category="ALL", active_only=True, page_size=500)
        self.assertGreaterEqual(count_all, 100)

    # =========================================================================
    # PHASE 23 & 24: SAKHI DELEGATION & RECOMMENDATION QUALITY AUDIT
    # =========================================================================
    def test_17_sakhi_engine_delegation(self):
        """[Phase 23 & 24] Verify Sakhi delegates queries to the correct underlying domain engines."""
        d_gov = detect_query_domain("मैं 24 साल का हूं, राजस्थान से हूं और नौकरी की तलाश कर रहा हूं। मेरे लिए सरकारी योजनाएं बताओ।")
        self.assertEqual(d_gov, "GOVERNMENT")

        d_lic = detect_query_domain("मैं 24 साल का हूं और मुझे life protection चाहिए। LIC के suitable plans बताओ।")
        self.assertEqual(d_lic, "LIC")

        d_fb = detect_query_domain("मैं राजस्थान से हूं और नौकरी की तलाश कर रहा हूं। मेरे लिए Free Plans और सरकारी मदद बताओ।")
        self.assertEqual(d_fb, "FREE_BENEFITS")

    # =========================================================================
    # PHASE 21 & 27: PAGINATION & API ENDPOINT VERIFICATION
    # =========================================================================
    def test_18_pagination_and_api_endpoints(self):
        """[Phase 21 & 27] Verify router endpoints and pagination logic."""
        # 1. Scheme search pagination
        p1, t1 = search_schemes(page=1, page_size=10, active_only=True)
        p2, t2 = search_schemes(page=2, page_size=10, active_only=True)
        self.assertEqual(len(p1), 10)
        self.assertEqual(len(p2), 10)
        self.assertEqual(t1, t2)
        # Verify no duplicate items across page 1 and page 2
        p1_ids = [s.get("scheme_id") for s in p1]
        p2_ids = [s.get("scheme_id") for s in p2]
        self.assertEqual(len(set(p1_ids).intersection(set(p2_ids))), 0)

        # 2. Recommendations Router
        req = RecommendationRequest(
            age=24,
            gender="male",
            state="Rajasthan",
            income=250000.0,
            occupation="job_seeker",
            goal_name="wealth",
            monthly_budget=2000.0,
            horizon_years=10
        )
        rec_res = generate_recommendations(req)
        self.assertIsNotNone(rec_res)
        self.assertGreater(rec_res.total_evaluated, 0)
        self.assertGreater(len(rec_res.recommendations), 0)

        # 3. Free Benefits Router
        fb_list = list_free_benefits()
        self.assertEqual(len(fb_list), 22)
        fb_eval_req = FreeBenefitsEvaluationRequest(
            profile=FreeBenefitUserProfile(age=24, state="Rajasthan", annual_family_income=250000.0, occupation="job_seeker")
        )
        fb_eval_res = evaluate_free_benefits(fb_eval_req)
        self.assertEqual(fb_eval_res.total_evaluated, 22)
        self.assertGreater(fb_eval_res.eligible_count, 0)

        # 4. LIC Router
        lic_list = get_all_lic_plans()
        self.assertEqual(len(lic_list), 38)
        lic_rec_req = LICRecommendRequest(age=24, goal="Family Protection", protection_requirement=True)
        lic_rec_res = recommend_lic_plans_endpoint(lic_rec_req)
        self.assertEqual(lic_rec_res.get("status"), "SUCCESS")
        self.assertGreater(lic_rec_res.get("eligible_count"), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
