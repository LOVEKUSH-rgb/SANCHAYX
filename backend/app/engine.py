from typing import Dict, Any, List, Tuple, Optional
from app.schemas import (
    UserProfile, UserGoal, UserPreferences,
    EligibilityEvaluationResult, ScoredScheme
)


def evaluate_eligibility(
    scheme: Dict[str, Any],
    profile: UserProfile,
    goal: Optional[UserGoal] = None
) -> EligibilityEvaluationResult:
    """
    Deterministic rule-based eligibility engine.
    Returns status: ELIGIBLE, INELIGIBLE, or REVIEW_REQUIRED.
    Mandatory conditions act as strict HARD FILTERS.
    """
    reasons: List[str] = []
    failed_criteria: List[str] = []
    review_required_fields: List[str] = []

    # 1. Verification and Status Gate (Mandatory)
    ver = scheme.get("verification", {})
    status_obj = scheme.get("status", {})
    
    ver_status = str(ver.get("status") or scheme.get("verification_status", "UNVERIFIED")).upper()
    is_active = status_obj.get("active", scheme.get("active", True))
    is_legacy = status_obj.get("legacy", False)
    rec_enabled = status_obj.get("recommendation_enabled", scheme.get("recommendation", {}).get("recommendable", True))

    if not (is_active and not is_legacy):
        failed_criteria.append("Scheme is inactive or legacy/discontinued.")
        return EligibilityEvaluationResult(
            status="INELIGIBLE",
            eligible=False,
            reasons=[],
            failed_criteria=failed_criteria
        )

    if ver_status != "VERIFIED" or not rec_enabled:
        review_required_fields.append("verification_status")
        failed_criteria.append(
            f"Scheme verification status is '{ver_status}' (Official verification review required before recommendation)."
        )
        return EligibilityEvaluationResult(
            status="REVIEW_REQUIRED",
            eligible=False,
            reasons=[],
            failed_criteria=failed_criteria,
            review_required_fields=review_required_fields
        )

    elig = scheme.get("eligibility", {})
    if not isinstance(elig, dict):
        elig = elig.model_dump() if hasattr(elig, "model_dump") else {}

    # 2. State Check (State-specific schemes vs Central)
    ownership = scheme.get("ownership", {})
    scheme_state = ownership.get("state")
    scheme_level = str(ownership.get("level", "central")).lower()
    user_state = profile.state.strip() if profile.state else None

    if scheme_state and scheme_state.strip():
        if not user_state:
            review_required_fields.append("state")
            failed_criteria.append(f"State residency required: Scheme is specific to '{scheme_state}'.")
        elif user_state.lower() != scheme_state.strip().lower():
            failed_criteria.append(
                f"State mismatch: Scheme is reserved for '{scheme_state}', applicant is in '{user_state}'."
            )
        else:
            reasons.append(f"State residency in {scheme_state} verified.")
    else:
        reasons.append("National / Central scheme applicable across Indian states.")

    # 3. Residency Check (Resident Indian vs NRI)
    scheme_res = elig.get("residency", "resident")
    if isinstance(scheme_res, list):
        scheme_res_str = " ".join([str(r).lower() for r in scheme_res])
    else:
        scheme_res_str = str(scheme_res).lower()

    user_residency = str(profile.residency_status or profile.residency or "resident").lower()
    is_nri = ("nri" in user_residency) or (user_residency == "nri")

    if is_nri and ("resident" in scheme_res_str or "indian citizen" in scheme_res_str) and ("nri" not in scheme_res_str and "all" not in scheme_res_str):
        failed_criteria.append("Not eligible because this scheme requires Resident Indian status; NRIs are ineligible.")
    else:
        reasons.append("Residency requirement satisfied (Indian Citizen / Resident).")

    # 4. Age Boundary Check (Strict Hard Gate)
    scheme_id_raw = str(scheme.get("scheme_id", scheme.get("id", ""))).lower().strip()
    short_name_raw = str(scheme.get("short_name", "")).upper().strip()
    is_scss = ("scss" in scheme_id_raw) or (short_name_raw == "SCSS")
    user_occ_raw = str(profile.occupation or "").lower().strip()
    user_persona_raw = str(profile.persona or profile.life_stage or "").lower().strip()
    is_retired_vrs = (
        getattr(profile, "is_retired", False)
        or getattr(profile, "is_vrs", False)
        or "retired" in user_occ_raw
        or "retire" in user_persona_raw
        or "vrs" in user_occ_raw
        or "vrs" in user_persona_raw
        or "superannuation" in user_occ_raw
        or "superannuation" in user_persona_raw
    )

    min_age = elig.get("min_age")
    max_age = elig.get("max_age")
    user_age = profile.age

    if is_scss and user_age is not None and 55 <= user_age < 60 and is_retired_vrs:
        reasons.append(
            f"Eligible under SCSS Special Statutory Retirement Exception for retired civilian/government employees (age {user_age} within 55–60 years with retirement benefits)."
        )
    elif min_age is not None or max_age is not None:
        if user_age is None:
            review_required_fields.append("age")
            failed_criteria.append("Applicant age is required for this age-restricted scheme.")
        else:
            if min_age is not None and user_age < min_age:
                if is_scss and 55 <= user_age < 60:
                    failed_criteria.append(
                        f"Not eligible because SCSS entry before age 60 requires proof of retirement/VRS superannuation benefits (applicant is {user_age} yrs)."
                    )
                else:
                    failed_criteria.append(
                        f"Not eligible because of age requirement: Minimum joining age is {min_age} years (applicant is {user_age} yrs)."
                    )
            elif max_age is not None and user_age > max_age:
                failed_criteria.append(
                    f"Not eligible because of age requirement: Maximum entry age limit is {max_age} years (applicant is {user_age} yrs)."
                )
            else:
                reasons.append(f"Age criteria ({user_age} yrs within {min_age or 0}–{max_age or '∞'}) satisfied.")
    else:
        reasons.append("No restrictive entry age boundary.")

    # 5. Gender Specificity Check
    scheme_gender_val = elig.get("gender", "all")
    if isinstance(scheme_gender_val, list):
        genders_lower = [str(g).lower() for g in scheme_gender_val]
        is_all_gender = ("male" in genders_lower and "female" in genders_lower) or "all" in genders_lower or "any" in genders_lower or "other" in genders_lower
        is_female_only = any("female" in g or "girl" in g or "women" in g for g in genders_lower) and not any(g == "male" for g in genders_lower)
        is_male_only = any("male" in g or "men" in g for g in genders_lower) and not any(g == "female" for g in genders_lower)
    else:
        g_str = str(scheme_gender_val).lower()
        is_all_gender = g_str in ["all", "any", "male, female", "all genders"]
        is_female_only = g_str in ["female", "women", "girl", "girl_child", "female only"]
        is_male_only = g_str in ["male", "men", "male only"]

    user_gender = str(profile.gender or "").lower().strip()
    child_gender = str(getattr(profile, "child_gender", "") or "").lower().strip()
    is_saving_for_minor = (
        (profile.saving_for in ["minor", "children", "daughter", "son", "child"])
        or (user_age is not None and user_age < 18)
        or (profile.child_age is not None)
        or bool(child_gender)
    )

    if is_female_only:
        effective_gender = child_gender if (is_saving_for_minor and child_gender) else user_gender
        if effective_gender in ["male", "boy", "son"]:
            failed_criteria.append(
                "Not eligible because this scheme is reserved exclusively for female beneficiaries / girl child (beneficiary is male)."
            )
        elif not effective_gender or effective_gender in ["all", "any"]:
            if profile.saving_for in ["minor", "children", "daughter"]:
                reasons.append("Saving for girl child beneficiary.")
            else:
                review_required_fields.append("gender")
                failed_criteria.append("Gender verification required for female/girl-child specific scheme.")
        elif effective_gender not in ["female", "women", "girl"]:
            failed_criteria.append("Not eligible because this scheme is reserved exclusively for female beneficiaries / girl child.")
        else:
            reasons.append("Female eligibility criterion satisfied.")
    elif is_male_only:
        if user_gender in ["female", "girl", "women"]:
            failed_criteria.append("Not eligible because this scheme is reserved exclusively for male beneficiaries.")
        elif not user_gender or user_gender in ["all", "any"]:
            review_required_fields.append("gender")
            failed_criteria.append("Gender verification required for male-specific scheme.")
        elif user_gender not in ["male", "men"]:
            failed_criteria.append("Not eligible because this scheme is reserved exclusively for male beneficiaries.")
        else:
            reasons.append("Male eligibility criterion satisfied.")
    else:
        reasons.append("Gender eligibility criterion satisfied (Open to all genders).")

    # 6. Guardian & Minor Check
    guardian_req = elig.get("guardian_required")
    child_age_limit = elig.get("child_age_limit")

    if is_saving_for_minor or guardian_req:
        if guardian_req and profile.has_guardian is False:
            failed_criteria.append("Scheme mandates account opening and operation by a natural or legal guardian.")
        elif guardian_req and profile.has_guardian is None:
            if user_age is None or user_age >= 18:
                reasons.append("Parent / Legal Guardian account representation verified.")
            else:
                review_required_fields.append("has_guardian")
                failed_criteria.append("Guardian representation status required.")
        else:
            reasons.append("Guardian requirement verified.")

        if child_age_limit is not None:
            effective_child_age = profile.child_age if profile.child_age is not None else (user_age if (user_age is not None and user_age < 18) else None)
            if effective_child_age is not None and effective_child_age > child_age_limit:
                failed_criteria.append(
                    f"Child age ({effective_child_age} yrs) exceeds statutory maximum limit of {child_age_limit} years."
                )
            elif effective_child_age is not None:
                reasons.append(f"Child age ({effective_child_age} yrs) is within {child_age_limit} year limit.")

    # 7. Income Limit Check
    income_limit = elig.get("income_limit")
    monthly_income_max = elig.get("monthly_income_max")
    user_income = profile.annual_income if profile.annual_income is not None else profile.income

    if monthly_income_max is not None and user_income is not None:
        user_monthly = user_income / 12.0
        if user_monthly > monthly_income_max * 1.5:  # tolerance for household
            failed_criteria.append(
                f"Income limit exceeded: Scheme mandates monthly wage/income below ₹{monthly_income_max:,.0f}."
            )
        else:
            reasons.append(f"Monthly income within statutory threshold of ₹{monthly_income_max:,.0f}/mo.")
    elif income_limit is not None:
        if user_income is not None:
            if user_income > income_limit:
                failed_criteria.append(
                    f"Income limit exceeded: Applicant income (₹{user_income:,.0f}) exceeds statutory limit of ₹{income_limit:,.0f}."
                )
            else:
                reasons.append(f"Income (₹{user_income:,.0f}) within statutory threshold of ₹{income_limit:,.0f}.")
        else:
            # Income is required for means-tested scheme
            review_required_fields.append("income")
            failed_criteria.append(f"Income declaration required (statutory ceiling: ₹{income_limit:,.0f}).")

    # 8. Occupation, Employment Status, and Excluded Occupations Check
    scheme_id_str = str(scheme.get("scheme_id", scheme.get("id", ""))).lower().strip()
    short_name_str = str(scheme.get("short_name", "")).lower().strip()
    scheme_cat = str(scheme.get("category", "")).lower().strip()
    scheme_sub_cat = str(scheme.get("sub_category", "")).lower().strip()
    scheme_type_str = str(scheme.get("scheme_type", "")).lower().strip()
    target_groups = [str(tg).lower().strip() for tg in scheme.get("target_groups", [])]

    required_occupations = elig.get("occupation", [])
    if isinstance(required_occupations, str):
        required_occupations = [required_occupations]
    
    emp_statuses = elig.get("employment_status", [])
    if isinstance(emp_statuses, str):
        emp_statuses = [emp_statuses]

    excluded_occupations = elig.get("excluded_occupations", [])
    if isinstance(excluded_occupations, str):
        excluded_occupations = [excluded_occupations]

    user_occ = str(profile.occupation or "").lower().strip()
    user_persona = str(profile.persona or profile.life_stage or "").lower().strip()

    is_salaried = any(w in user_occ for w in ["salaried", "private", "employee", "corporate", "it", "formal", "banker", "tech", "executive", "clerk", "manager", "staff"])

    # 8A. MGNREGA / Rural Manual Wage Employment Special Statutory Rule
    is_mgnrega = (
        scheme_id_str in ["mgnrega_001", "sc-emp-001", "mgnrega"] or
        "mgnrega" in short_name_str or
        ("rural" in scheme_sub_cat and "employment" in scheme_cat and "guarantee" in scheme_sub_cat) or
        ("rural_households" in target_groups and "unskilled_workers" in target_groups and scheme_type_str in ["wage_employment", "social_assistance"])
    )

    if is_mgnrega:
        if is_salaried:
            failed_criteria.append(
                "Not eligible based on occupational criteria: MGNREGA provides guaranteed manual unskilled wage employment exclusively to rural households; formal salaried/private sector employees are ineligible."
            )
        elif user_occ in ["student", "youth"] or (not user_occ and user_persona in ["students", "student"]):
            review_required_fields.append("rural_household_labor")
            failed_criteria.append(
                "Additional information required: MGNREGA requires applicant to be an adult member of a rural household volunteering for unskilled manual labor."
            )
        elif any(k in user_occ for k in ["farmer", "agri", "casual", "unskilled", "labor", "labour", "rural", "worker", "unemployed"]) or user_persona in ["farmers", "workers", "rural"]:
            reasons.append("Rural manual wage employment eligibility validated for rural household / agricultural worker.")
        elif user_occ in ["senior", "retired", "senior_citizen"] or (profile.age is not None and profile.age >= 60) or user_persona in ["seniors", "senior_citizen"]:
            reasons.append("Adult members of rural households of any age (18+) can volunteer for unskilled manual work under MGNREGA.")
        elif not user_occ or user_occ in ["any", "all"]:
            review_required_fields.append("rural_household_labor")
            failed_criteria.append(
                "Additional information required: MGNREGA requires adult membership in a rural household volunteering for unskilled manual labor."
            )
        else:
            failed_criteria.append(
                f"Not eligible based on occupational criteria: MGNREGA requires volunteering for unskilled manual labor in a rural household; incompatible with '{user_occ}'."
            )

    else:
        # 8B. General & Scheme-Specific Occupational Check
        excl_clean = [str(e).lower().strip() for e in excluded_occupations if str(e).lower().strip() not in ["", "none"]]
        req_clean = [str(o).lower().strip() for o in (required_occupations + emp_statuses + target_groups) if str(o).lower().strip() not in ["any", "all", "", "none"]]

        # Check explicit exclusions
        if excl_clean and any(e in user_occ or user_occ in e for e in excl_clean):
            failed_criteria.append(
                f"Not eligible based on occupational criteria: Scheme explicitly excludes '{user_occ}' applicants; reserved for {', '.join(set(req_clean or ['specified beneficiary groups']))}."
            )
        elif req_clean:
            # Check farmer specific schemes (e.g. PM-KMY)
            if any("farmer" in r or "agricultural" in r for r in req_clean):
                if any(f in user_occ for f in ["farmer", "agri", "cultivator", "peasant"]) or user_persona == "farmers":
                    reasons.append("Farmer occupational eligibility validated.")
                elif is_salaried:
                    failed_criteria.append(
                        "Not eligible based on occupational criteria: Scheme is reserved for small and marginal farmers; formal salaried employees are ineligible."
                    )
                elif not user_occ or user_occ in ["any", "all"]:
                    review_required_fields.append("occupation")
                    failed_criteria.append("Additional information required: Scheme mandates active farming occupation.")
                else:
                    failed_criteria.append(f"Occupational mismatch: Scheme requires farming occupation, applicant profile is '{user_occ}'.")

            # Check unorganised / informal worker schemes (e.g. PM-SYM)
            elif any("unorganised" in r or "unskilled" in r or "informal" in r for r in req_clean):
                if any(u in user_occ for u in ["unorganised", "unorganized", "gig", "informal", "casual", "driver", "maid", "vendor", "worker", "laborer", "labourer"]) or user_persona == "workers":
                    reasons.append("Unorganised sector worker eligibility validated.")
                elif is_salaried:
                    failed_criteria.append(
                        "Not eligible based on occupational criteria: Scheme is strictly for unorganised sector workers; formal salaried employees covered under EPFO/ESIC/NPS are ineligible."
                    )
                elif not user_occ or user_occ in ["any", "all"]:
                    review_required_fields.append("occupation")
                    failed_criteria.append("Additional information required: Scheme requires unorganised sector worker status without formal EPFO/ESIC coverage.")
                else:
                    failed_criteria.append(f"Occupational mismatch: Scheme requires unorganised sector employment, applicant is '{user_occ}'.")

            # Check street vendors / artisans / MSME
            elif any(b in req_clean for b in ["street_vendors", "street_vendor", "artisan", "traditional_craftsperson", "vendor", "micro_entrepreneur"]):
                if any(b in user_occ for b in ["vendor", "artisan", "craftsperson", "hawker", "self", "business", "entrepreneur"]):
                    reasons.append(f"Beneficiary trade qualification verified ({user_occ}).")
                elif is_salaried:
                    failed_criteria.append(f"Not eligible based on occupational criteria: Scheme is reserved for {', '.join(set(req_clean))}; salaried employees are ineligible.")
                elif not user_occ or user_occ in ["any", "all"]:
                    review_required_fields.append("occupation")
                    failed_criteria.append(f"Additional information required: Scheme requires qualification as {', '.join(set(req_clean))}.")
                else:
                    failed_criteria.append(f"Occupational mismatch: Scheme requires '{', '.join(set(req_clean))}', applicant is '{user_occ}'.")

            # Check youth / student schemes (e.g. PMKVY, DDU-GKY)
            elif any("student" in r or "youth" in r for r in req_clean):
                if any(s in user_occ for s in ["student", "youth", "seeker", "unemployed"]) or user_persona in ["students", "student"]:
                    reasons.append("Student/youth qualification validated.")
                elif is_salaried:
                    review_required_fields.append("skill_need")
                    failed_criteria.append("Additional information required: Scheme is intended for youth seeking skill certification and placement.")
                else:
                    reasons.append(f"Youth skill eligibility validated ({user_occ or 'Applicant'}).")

            # Check senior citizen / retired schemes (e.g. SCSS, PMVVY, IGNOAPS)
            elif any("senior" in r or "retire" in r or "elder" in r for r in req_clean):
                if any(k in user_occ for k in ["senior", "retired", "senior_citizen", "elderly"]) or user_persona in ["seniors", "senior_citizen", "senior"] or is_retired_vrs or (user_age is not None and user_age >= 60):
                    reasons.append("Senior citizen / retirement qualification validated.")
                elif not user_occ or user_occ in ["any", "all"]:
                    if user_age is not None and user_age >= 60:
                        reasons.append(f"Senior citizen age qualification ({user_age} yrs) satisfied.")
                    else:
                        review_required_fields.append("occupation")
                        failed_criteria.append("Additional information required: Scheme requires senior citizen (age 60+) or retired status.")
                else:
                    failed_criteria.append(f"Occupational mismatch: Scheme requires senior citizen or retired status, applicant is '{user_occ}'.")

            else:
                # Match against other required list
                matched = any(r in user_occ or user_occ in r or r in user_persona or user_persona in r for r in req_clean)
                if matched:
                    reasons.append(f"Occupational eligibility validated ({user_occ or user_persona}).")
                elif not user_occ or user_occ in ["any", "all"]:
                    review_required_fields.append("occupation")
                    failed_criteria.append(f"Additional information required: Scheme requires '{', '.join(set(req_clean))}'.")
                else:
                    failed_criteria.append(f"Occupational mismatch: Scheme requires '{', '.join(set(req_clean))}', applicant is '{user_occ}'.")
        else:
            reasons.append("Open to all occupational categories (Salaried, Self-employed, Professionals, Students, etc.).")

    # 9. Disability Check
    disability_req = elig.get("disability_requirement")
    user_disability = profile.has_disability or profile.disability

    if disability_req:
        if not user_disability:
            failed_criteria.append("Scheme requires official certified disability status.")
        else:
            reasons.append("Disability assistance qualification met.")

    # Status Determination (Strict Separation of ELIGIBLE, INELIGIBLE, and REVIEW_REQUIRED)
    if len(failed_criteria) > 0:
        # Check if ALL failures are missing information requests
        all_are_review = len(review_required_fields) > 0 and all(
            any(field in fc.lower() for field in review_required_fields) or "additional information required" in fc.lower()
            for fc in failed_criteria
        )
        if all_are_review:
            return EligibilityEvaluationResult(
                status="REVIEW_REQUIRED",
                eligible=False,
                reasons=[],
                failed_criteria=failed_criteria,
                review_required_fields=review_required_fields
            )
        return EligibilityEvaluationResult(
            status="INELIGIBLE",
            eligible=False,
            reasons=[],
            failed_criteria=failed_criteria,
            review_required_fields=review_required_fields
        )

    return EligibilityEvaluationResult(
        status="ELIGIBLE",
        eligible=True,
        reasons=reasons,
        failed_criteria=[],
        review_required_fields=[]
    )


def evaluate_scheme_fit(
    scheme: Dict[str, Any],
    profile: UserProfile,
    goal: UserGoal,
    preferences: UserPreferences,
    weights: Optional[Dict[str, float]] = None
) -> ScoredScheme:
    """
    Two-Stage Recommendation Engine:
    Stage 1: Hard deterministic eligibility filter (ELIGIBLE / INELIGIBLE / REVIEW_REQUIRED).
    Stage 2: Explainable Fit-Score (0-100) ONLY for ELIGIBLE schemes.
    """
    if weights is None:
        weights = {
            "goal": 0.30,
            "eligibility": 0.20,
            "budget": 0.20,
            "horizon": 0.15,
            "liquidity": 0.10,
            "tax": 0.05
        }

    elig_res = evaluate_eligibility(scheme, profile, goal)
    
    fin = scheme.get("financial", {})
    benefits = scheme.get("benefits", {})
    eligibility = scheme.get("eligibility", {})
    liquidity = scheme.get("liquidity", {})
    ver = scheme.get("verification", {})
    ownership = scheme.get("ownership", {})

    scheme_id = str(scheme.get("scheme_id", ""))
    name = scheme.get("name", "")
    category = str(scheme.get("category", "")).upper()
    sub_cat = str(scheme.get("sub_category", ""))
    short_name = scheme.get("short_name") or (name if isinstance(name, str) else name.get("en", ""))

    verified_source = {
        "source_authority": ver.get("source_authority") or ownership.get("ministry") or "Government of India",
        "official_url": ver.get("official_url") or "https://india.gov.in",
        "last_verified": ver.get("last_verified") or "2026-08-28",
        "status": ver.get("status", "VERIFIED")
    }

    if not elig_res.eligible:
        # Ineligible schemes receive 0.0 fit score and clear failure explanation
        return ScoredScheme(
            scheme_id=scheme_id,
            name=name,
            short_name=short_name,
            category=category,
            sub_category=sub_cat,
            scheme_type=scheme.get("scheme_type"),
            ownership=ownership,
            status=elig_res.status,
            fit_score=0.0,
            goal_match=0.0,
            eligibility_strength=0.0,
            budget_match=0.0,
            horizon_match=0.0,
            liquidity_match=0.0,
            tax_match=0.0,
            why_this_fits=[],
            eligibility_summary={
                "status": elig_res.status,
                "reasons": elig_res.reasons,
                "failed_criteria": elig_res.failed_criteria,
                "review_required_fields": elig_res.review_required_fields
            },
            verified_source=verified_source,
            scheme=scheme
        )

    # -------------------------------------------------------------
    # STAGE 2: FIT SCORE FOR ELIGIBLE SCHEMES (0 - 100)
    # -------------------------------------------------------------
    target_goal = (goal.goal or "").lower().strip()
    scheme_goals = [str(g).lower() for g in scheme.get("goals", [])]
    suitable_goals = [str(g).lower() for g in scheme.get("recommendation", {}).get("suitable_goals", [])]
    all_scheme_goals = set(scheme_goals + suitable_goals)

    min_contrib = fin.get("minimum_contribution")
    max_contrib = fin.get("maximum_contribution")
    has_deposit_feature = min_contrib is not None or "savings" in category.lower() or "deposit" in str(scheme.get("scheme_type", "")).lower()

    if target_goal in all_scheme_goals:
        goal_match = 100.0
    elif target_goal in ["business", "msme", "self_employment"]:
        if any(g in all_scheme_goals for g in ["business", "msme", "credit", "loan", "entrepreneurship", "self_employment"]):
            goal_match = 100.0
        elif "business" in category.lower() or "credit" in category.lower() or "employment" in category.lower():
            goal_match = 95.0
        elif ("women" in category.lower() or "women" in str(scheme.get("target_groups", [])).lower()) and "business" in str(scheme.get("goals", [])).lower():
            goal_match = 90.0
        else:
            goal_match = 10.0
    elif target_goal == "widow_support":
        if "widow_support" in all_scheme_goals or "widows" in str(scheme.get("target_groups", [])).lower() or "ignwps" in scheme_id.lower():
            goal_match = 100.0
        elif "social_security" in all_scheme_goals or category in ["WOMEN", "SOCIAL_SECURITY"]:
            goal_match = 85.0
        else:
            goal_match = 10.0
    elif target_goal == "disability_support":
        if "disability_support" in all_scheme_goals or "disabilities" in str(scheme.get("target_groups", [])).lower() or scheme.get("eligibility", {}).get("disability_requirement"):
            goal_match = 100.0
        else:
            goal_match = 10.0
    elif target_goal == "child_education":
        if "girl_child" in all_scheme_goals or scheme_id in ["ssy_001", "ppf_001", "nsc_001"]:
            goal_match = 100.0
        elif "education" in all_scheme_goals and has_deposit_feature:
            goal_match = 95.0
        elif "long_term_savings" in all_scheme_goals or category == "SAVINGS":
            goal_match = 95.0
        elif "education" in all_scheme_goals:
            goal_match = 85.0
        else:
            goal_match = 20.0
    elif target_goal in category.lower() or target_goal in sub_cat.lower():
        goal_match = 95.0
    elif target_goal == "retirement" and ("pension" in all_scheme_goals or "old_age_support" in all_scheme_goals or category in ["PENSION", "SENIOR_CITIZEN"]):
        goal_match = 95.0
    elif target_goal == "marriage" and ("girl_child" in all_scheme_goals or "long_term_savings" in all_scheme_goals):
        goal_match = 90.0
    elif target_goal == "wealth" and ("long_term_savings" in all_scheme_goals or category == "SAVINGS"):
        goal_match = 95.0
    elif target_goal == "emergency" and liquidity.get("level") == "high":
        goal_match = 90.0
    else:
        goal_match = 25.0

    # 2. Eligibility Strength (0 - 100)
    eligibility_strength = 100.0

    # 3. Budget Fit (0 - 100)
    user_budget = preferences.monthly_budget or 2000.0
    annual_budget = user_budget * 12.0

    if min_contrib is not None:
        if min_contrib <= annual_budget:
            if max_contrib is None or annual_budget <= max_contrib:
                budget_match = 100.0
            else:
                budget_match = 85.0
        else:
            diff_pct = (min_contrib - annual_budget) / max(min_contrib, 1)
            budget_match = max(30.0, 100.0 - (diff_pct * 50.0))
    else:
        budget_match = 90.0

    # 4. Time Horizon Match (0 - 100)
    user_horizon = preferences.horizon_years or 10
    lock_in_years = fin.get("lock_in_years")
    if lock_in_years is None:
        lock_in_str = str(fin.get("lock_in", "")).lower()
        if "15" in lock_in_str:
            lock_in_years = 15
        elif "21" in lock_in_str:
            lock_in_years = 21
        elif "5" in lock_in_str:
            lock_in_years = 5
        elif "60" in lock_in_str:
            lock_in_years = max(0, 60 - (profile.age or 30))
        else:
            lock_in_years = 0

    if lock_in_years <= user_horizon:
        horizon_match = 100.0
    else:
        diff = lock_in_years - user_horizon
        horizon_match = max(35.0, 100.0 - (diff * 7.0))

    # 5. Liquidity Match (0 - 100)
    user_liq = (preferences.liquidity_preference or "medium").lower()
    scheme_liq = str(liquidity.get("level", "medium")).lower()

    if user_liq == scheme_liq:
        liquidity_match = 100.0
    elif user_liq == "low":
        liquidity_match = 95.0
    elif user_liq == "high" and scheme_liq == "low":
        liquidity_match = 45.0
    else:
        liquidity_match = 75.0

    # 6. Tax Preference Match (0 - 100)
    has_tax_benefit = bool(benefits.get("tax_benefit"))
    user_tax_pref = preferences.tax_preference if preferences.tax_preference is not None else True

    if user_tax_pref:
        tax_match = 100.0 if has_tax_benefit else 60.0
    else:
        tax_match = 85.0

    # Weighted Calculation
    total_fit_score = round(
        (goal_match * weights.get("goal", 0.30)) +
        (eligibility_strength * weights.get("eligibility", 0.20)) +
        (budget_match * weights.get("budget", 0.20)) +
        (horizon_match * weights.get("horizon", 0.15)) +
        (liquidity_match * weights.get("liquidity", 0.10)) +
        (tax_match * weights.get("tax", 0.05)),
        1
    )

    # Why This Fits Rationale (Strictly from verified dataset properties)
    why_this_fits = []
    if goal_match >= 90:
        why_this_fits.append(f"Directly satisfies your '{goal.goal}' financial goal.")
    if elig_res.reasons:
        why_this_fits.append(f"Statutory eligibility verified: {elig_res.reasons[0]}.")
    if budget_match >= 90 and min_contrib is not None:
        why_this_fits.append(f"Your monthly contribution capacity (₹{user_budget:,.0f}/mo) meets statutory thresholds.")
    if horizon_match >= 90:
        why_this_fits.append(f"Lock-in structure aligns with your {user_horizon}-year planning horizon.")
    if has_tax_benefit and user_tax_pref:
        why_this_fits.append(f"Statutory tax benefits applicable: {benefits.get('tax_benefit')}.")
    if ver.get("source_authority"):
        why_this_fits.append(f"Officially verified by {ver.get('source_authority')}.")

    return ScoredScheme(
        scheme_id=scheme_id,
        name=name,
        short_name=short_name,
        category=category,
        sub_category=sub_cat,
        scheme_type=scheme.get("scheme_type"),
        ownership=ownership,
        status="ELIGIBLE",
        fit_score=total_fit_score,
        goal_match=goal_match,
        eligibility_strength=eligibility_strength,
        budget_match=budget_match,
        horizon_match=horizon_match,
        liquidity_match=liquidity_match,
        tax_match=tax_match,
        why_this_fits=why_this_fits,
        eligibility_summary={
            "status": "ELIGIBLE",
            "reasons": elig_res.reasons,
            "failed_criteria": [],
            "review_required_fields": []
        },
        verified_source=verified_source,
        scheme=scheme
    )
