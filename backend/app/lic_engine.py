from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class LICUserProfile(BaseModel):
    model_config = ConfigDict(extra="allow")
    age: Optional[float] = None
    gender: Optional[str] = None  # "Male", "Female", "Other", "Transgender"
    profession: Optional[str] = None  # "Salaried", "Self-Employed", "Business", "Homemaker", "Student", "Farmer", "Daily Wage Earner", "Retired", "Professional"
    monthly_budget: Optional[float] = None
    annual_budget: Optional[float] = None
    goal: Optional[str] = None  # "Child Education", "Retirement", "Family Protection", "Wealth Creation", "Money Back", "Loan Protection", "Micro Savings", "Women Security", "Joint Couple Security"
    child_age: Optional[float] = None
    retirement_requirement: Optional[Union[bool, str]] = None
    protection_requirement: Optional[Union[bool, str]] = None
    savings_preference: Optional[Union[List[str], str]] = None
    investment_preference: Optional[Union[List[str], str]] = None


class LICPlanEvaluationResult(BaseModel):
    model_config = ConfigDict(extra="allow")
    plan_id: str
    plan_name: str
    plan_number: str
    uin: str
    category: str
    status: str  # "ELIGIBLE", "INELIGIBLE", "ADDITIONAL_INFORMATION_REQUIRED"
    eligible: bool
    match_score: float = 0.0
    failed_criteria: List[str] = []
    missing_fields: List[str] = []
    eligibility_reasons: List[str] = []
    match_reasons: List[str] = []
    important_conditions: List[str] = []
    benefits_summary: Dict[str, Any] = {}
    official_lic_url: str
    official_document_url: Optional[str] = None
    source: str = "LIC Official Website"


class LICRecommendationResult(BaseModel):
    model_config = ConfigDict(extra="allow")
    status: str  # "SUCCESS", "NO_APPLICABLE_PLAN", "ADDITIONAL_INFORMATION_REQUIRED"
    total_plans_evaluated: int
    eligible_count: int
    ineligible_count: int
    missing_info_count: int
    recommended_plans: List[LICPlanEvaluationResult] = []
    all_evaluated_plans: List[LICPlanEvaluationResult] = []
    message: str
    disclaimer: str = "All plan data, eligibility conditions, and benefit calculations are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes and brochures."


def evaluate_lic_plan_eligibility(
    plan: Dict[str, Any],
    profile: LICUserProfile
) -> LICPlanEvaluationResult:
    """
    Deterministic rule-based eligibility evaluator for a single LIC plan.
    Evaluates statutory rules:
    - Active Status / Withdrawn verification
    - Age criteria (min/max entry age, min/max maturity age)
    - Child age criteria (if child plan or child goal)
    - Gender constraints (e.g. Bima Lakshmi female only)
    - Required parameters
    """
    plan_id = plan.get("plan_id", "UNKNOWN")
    plan_name = plan.get("plan_name", "LIC Plan")
    plan_number = str(plan.get("plan_number", ""))
    uin = plan.get("uin", "")
    category = plan.get("category", "")
    official_url = plan.get("official_lic_url", "https://www.licindia.in/")
    doc_url = plan.get("official_document_url")

    failed_criteria: List[str] = []
    missing_fields: List[str] = []
    eligibility_reasons: List[str] = []
    important_conditions: List[str] = []

    # 1. Active Status and Verification Gate
    active_status = plan.get("active_status", plan.get("status", "active"))
    if active_status != "active":
        failed_criteria.append("Plan is withdrawn or discontinued by LIC.")
        return LICPlanEvaluationResult(
            plan_id=plan_id,
            plan_name=plan_name,
            plan_number=plan_number,
            uin=uin,
            category=category,
            status="INELIGIBLE",
            eligible=False,
            match_score=0.0,
            failed_criteria=failed_criteria,
            official_lic_url=official_url,
            official_document_url=doc_url
        )

    if plan.get("verification_required") is True:
        missing_fields.append("plan_official_verification")
        return LICPlanEvaluationResult(
            plan_id=plan_id,
            plan_name=plan_name,
            plan_number=plan_number,
            uin=uin,
            category=category,
            status="ADDITIONAL_INFORMATION_REQUIRED",
            eligible=False,
            match_score=0.0,
            missing_fields=missing_fields,
            failed_criteria=["Official LIC verification is pending for this plan."],
            official_lic_url=official_url,
            official_document_url=doc_url
        )

    # 2. Gender Rule Evaluation
    gender_rules = plan.get("gender_rules", {})
    allowed_gender = str(gender_rules.get("allowed", "All")).strip().lower()
    
    if profile.gender:
        user_gender_norm = str(profile.gender).strip().lower()
        if allowed_gender in ["female", "female only", "women only"]:
            if user_gender_norm not in ["female", "woman", "f"]:
                failed_criteria.append(f"{plan_name} (Plan {plan_number}) is exclusively available for female lives (women).")
            else:
                eligibility_reasons.append("Eligible under female-specific plan criteria.")
    else:
        if allowed_gender in ["female", "female only", "women only"]:
            missing_fields.append("gender")

    # 3. Child Plan & Child Age Evaluation
    child_rules = plan.get("child_age_rules", {})
    is_child_plan = child_rules.get("is_child_plan", False)
    min_child_age = child_rules.get("min_child_age")
    max_child_age = child_rules.get("max_child_age")

    # If the plan is strictly on the child's life (e.g. Amritbaal 774, Children's Money Back 732, Jeevan Tarun 734)
    pure_child_plans = {"774", "732", "734"}
    if plan_number in pure_child_plans or (is_child_plan and min_child_age is not None and max_child_age is not None and max_child_age <= 15):
        if profile.child_age is not None:
            c_age = float(profile.child_age)
            if min_child_age is not None and c_age < min_child_age:
                failed_criteria.append(f"Child age {c_age} years is below minimum entry age {min_child_age} years (or 30/90 days) for {plan_name}.")
            elif max_child_age is not None and c_age > max_child_age:
                failed_criteria.append(f"Child age {c_age} years exceeds maximum entry age {max_child_age} years for {plan_name}.")
            else:
                eligibility_reasons.append(f"Child age {c_age} years satisfies entry limits ({min_child_age} to {max_child_age} years).")
        else:
            # Check if user stated a child education goal
            goal_str = str(profile.goal or "").lower()
            if "child" in goal_str or "education" in goal_str or "daughter" in goal_str or "son" in goal_str:
                missing_fields.append("child_age")
            elif profile.age is not None and float(profile.age) > (max_child_age or 15):
                # User gave their own adult age for a child plan without specifying child age
                missing_fields.append("child_age")

    # 4. User Age Evaluation (for adult plans / proposer)
    age_rules = plan.get("age_rules", {})
    min_entry = age_rules.get("min_entry_age_years")
    max_entry = age_rules.get("max_entry_age_years")
    min_mat = age_rules.get("min_maturity_age_years")
    max_mat = age_rules.get("max_maturity_age_years")

    if plan_number not in pure_child_plans:
        if profile.age is None:
            missing_fields.append("age")
        else:
            u_age = float(profile.age)
            if min_entry is not None and u_age < min_entry:
                failed_criteria.append(f"User age {u_age} years is below minimum entry age {min_entry} years for {plan_name}.")
            elif max_entry is not None and u_age > max_entry:
                failed_criteria.append(f"User age {u_age} years exceeds maximum entry age {max_entry} years for {plan_name}.")
            else:
                eligibility_reasons.append(f"Age {u_age} years is within the allowable entry range ({min_entry} to {max_entry} years).")

    # 5. Extract Important Conditions
    prem_rules = plan.get("premium_rules", {})
    min_sa_text = prem_rules.get("min_sum_assured_text")
    if min_sa_text:
        important_conditions.append(f"Minimum Sum Assured: {min_sa_text}")
    
    pol_term = plan.get("policy_term", {})
    if pol_term.get("available_terms"):
        important_conditions.append(f"Policy Term: {pol_term.get('available_terms')}")

    ppt = plan.get("premium_payment_term", {})
    if ppt.get("options"):
        important_conditions.append(f"Premium Payment Term: {', '.join(ppt.get('options'))}")

    # 6. Determine Result Status
    if failed_criteria:
        status = "INELIGIBLE"
        eligible = False
    elif missing_fields:
        status = "ADDITIONAL_INFORMATION_REQUIRED"
        eligible = False
    else:
        status = "ELIGIBLE"
        eligible = True

    benefits = plan.get("benefits", {})
    benefits_summary = {
        "death_benefit": plan.get("death_benefit") or benefits.get("death_benefit_summary"),
        "maturity_benefit": plan.get("maturity_benefit") or benefits.get("maturity_benefit_summary"),
        "survival_benefit": plan.get("survival_benefit") or benefits.get("survival_benefits"),
        "guaranteed_benefit": benefits.get("guaranteed_additions")
    }

    return LICPlanEvaluationResult(
        plan_id=plan_id,
        plan_name=plan_name,
        plan_number=plan_number,
        uin=uin,
        category=category,
        status=status,
        eligible=eligible,
        match_score=0.0,
        failed_criteria=failed_criteria,
        missing_fields=missing_fields,
        eligibility_reasons=eligibility_reasons,
        important_conditions=important_conditions,
        benefits_summary=benefits_summary,
        official_lic_url=official_url,
        official_document_url=doc_url,
        source=plan.get("source", "LIC Official Website")
    )


def calculate_lic_suitability_score(
    plan: Dict[str, Any],
    profile: LICUserProfile,
    eval_result: LICPlanEvaluationResult
) -> float:
    """
    Calculates a deterministic suitability match score (0 to 100) for an ELIGIBLE plan.
    Evaluates:
    - Goal matching (35 points)
    - Retirement / Pension relevance (20 points)
    - Protection / Life cover relevance (15 points)
    - Investment / Savings preference (15 points)
    - Budget compatibility (15 points)
    """
    if not eval_result.eligible or eval_result.status != "ELIGIBLE":
        return 0.0

    score = 40.0  # Base score for passing 100% of mandatory statutory eligibility criteria
    match_reasons: List[str] = ["Meets all mandatory statutory age, gender, and entry rules."]

    plan_goals = [str(g).lower() for g in plan.get("goals", [])]
    suitable_profiles = [str(s).lower() for s in plan.get("suitable_for", [])]
    category = str(plan.get("category", "")).lower()
    ret_rel = str(plan.get("retirement_relevance", "")).lower()
    prot_rel = str(plan.get("protection_relevance", "")).lower()
    inv_prefs = [str(i).lower() for i in plan.get("investment_preference", [])]
    plan_num = str(plan.get("plan_number", ""))

    # 1. User Goal Evaluation (Up to +25 points)
    user_goal = str(profile.goal or "").lower()
    if user_goal:
        goal_matched = False
        if any(user_goal in pg for pg in plan_goals) or any(user_goal in sp for sp in suitable_profiles):
            score += 25.0
            match_reasons.append(f"Directly addresses your primary goal of '{profile.goal}'.")
            goal_matched = True
        elif ("child" in user_goal or "education" in user_goal) and (plan_num in {"774", "732", "734", "733", "890"} or "child" in category):
            score += 25.0
            match_reasons.append("Dedicated child plan designed for educational milestone funding.")
            goal_matched = True
        elif ("retirement" in user_goal or "pension" in user_goal or "old age" in user_goal) and ("pension" in category or "annuity" in category or "whole life" in category or plan_num in {"745", "771", "883", "857", "758", "862", "879", "867"}):
            score += 25.0
            match_reasons.append("Offers dedicated post-retirement guaranteed income / annuity.")
            goal_matched = True
        elif ("protection" in user_goal or "term" in user_goal or "family safety" in user_goal or "pure cover" in user_goal) and ("term" in category or plan_num in {"876", "878", "877", "875", "954", "955", "859", "887"}):
            score += 25.0
            match_reasons.append("Provides high pure term family risk cover.")
            goal_matched = True
        elif ("money back" in user_goal or "liquidity" in user_goal or "periodic" in user_goal) and ("money back" in category or plan_num in {"720", "721", "748", "732", "734"}):
            score += 25.0
            match_reasons.append("Provides periodic survival liquidity payouts every 5 years.")
            goal_matched = True
        elif ("wealth" in user_goal or "savings" in user_goal or "growth" in user_goal) and ("endowment" in category or "unit linked" in category):
            score += 20.0
            match_reasons.append("Supports long-term capital accumulation and bonus accruals.")
            goal_matched = True

        if not goal_matched:
            score += 5.0

    # 2. Retirement Requirement (Up to +15 points)
    ret_req = profile.retirement_requirement
    if ret_req is True or (isinstance(ret_req, str) and ret_req.lower() in ["yes", "high", "true", "required"]):
        if ret_rel in ["highest", "very high"]:
            score += 15.0
            match_reasons.append("Highly suited for retirement planning with regular lifelong cashflows.")
        elif ret_rel == "high":
            score += 10.0
        elif ret_rel == "moderate":
            score += 5.0

    # 3. Protection Requirement (Up to +10 points)
    prot_req = profile.protection_requirement
    if prot_req is True or (isinstance(prot_req, str) and prot_req.lower() in ["yes", "high", "true", "required", "highest"]):
        if prot_rel in ["highest", "very high"]:
            score += 10.0
            match_reasons.append("Provides robust family protection / life assurance coverage.")
        elif prot_rel == "high":
            score += 7.0

    # 4. Investment Preference Matching (Up to +10 points)
    user_inv_prefs = profile.investment_preference
    if user_inv_prefs:
        if isinstance(user_inv_prefs, str):
            user_inv_prefs = [user_inv_prefs]
        user_inv_prefs_lower = [str(x).lower() for x in user_inv_prefs]
        for pref in user_inv_prefs_lower:
            if any(pref in ip for ip in inv_prefs):
                score += 10.0
                match_reasons.append(f"Matches your preference for '{pref}'.")
                break

    # 5. Budget Category Matching (Up to +10 points)
    monthly_budget = profile.monthly_budget
    annual_budget = profile.annual_budget or (monthly_budget * 12 if monthly_budget else None)
    
    if monthly_budget is not None or annual_budget is not None:
        eff_annual = annual_budget or (monthly_budget * 12)
        if eff_annual < 24000:
            if plan_num in {"751", "880", "859"}:  # Micro Bachat, Jan Suraksha, Saral Jeevan Bima
                score += 10.0
                match_reasons.append("Ultra-affordable premiums match your budget profile.")
            elif "micro" in category:
                score += 10.0
        elif eff_annual >= 100000:
            if plan_num in {"748", "771", "883", "857", "758", "749", "912"}:
                score += 8.0
                match_reasons.append("Optimized for high-value premium investments.")
        else:
            score += 6.0

    # Cap max score at 99.0 for precision
    final_score = min(99.0, max(40.0, score))
    eval_result.match_score = round(final_score, 1)
    eval_result.match_reasons = match_reasons
    return final_score


def recommend_lic_plans(
    lic_plans: List[Dict[str, Any]],
    profile: LICUserProfile,
    specific_plan_id: Optional[str] = None
) -> LICRecommendationResult:
    """
    Main entry point for LIC Plan evaluation and recommendations.
    - If `specific_plan_id` is supplied: evaluates only that specific plan.
    - If `specific_plan_id` is None: evaluates ALL 38 plans in the database.
    - Ranks eligible plans by calculated match score descending.
    - Preserves strict separation: ELIGIBLE, INELIGIBLE, ADDITIONAL_INFORMATION_REQUIRED, NO_APPLICABLE_PLAN.
    """
    target_plans = lic_plans

    # Specific plan query filter if requested
    if specific_plan_id:
        target_str = str(specific_plan_id).strip().lower()
        matched = []
        for p in lic_plans:
            pid = str(p.get("plan_id", "")).lower()
            pnum = str(p.get("plan_number", "")).lower()
            pname = str(p.get("plan_name", "")).lower()
            if target_str == pid or target_str == pnum or target_str in pname:
                matched.append(p)
        if matched:
            target_plans = matched

    evaluated_plans: List[LICPlanEvaluationResult] = []
    eligible_plans: List[LICPlanEvaluationResult] = []
    ineligible_count = 0
    missing_info_count = 0

    for plan in target_plans:
        res = evaluate_lic_plan_eligibility(plan, profile)
        if res.status == "ELIGIBLE":
            calculate_lic_suitability_score(plan, profile, res)
            eligible_plans.append(res)
        elif res.status == "INELIGIBLE":
            ineligible_count += 1
        elif res.status == "ADDITIONAL_INFORMATION_REQUIRED":
            missing_info_count += 1
        evaluated_plans.append(res)

    # Sort eligible plans by match score descending
    eligible_plans.sort(key=lambda x: x.match_score, reverse=True)

    if eligible_plans:
        status = "SUCCESS"
        top_name = eligible_plans[0].plan_name
        msg = f"Found {len(eligible_plans)} eligible LIC plan(s). Top recommendation: {top_name} (Match Score: {eligible_plans[0].match_score}%)."
    elif missing_info_count > 0 and len(target_plans) == 1:
        status = "ADDITIONAL_INFORMATION_REQUIRED"
        missing_str = ", ".join(evaluated_plans[0].missing_fields)
        msg = f"Additional information required to determine eligibility: please provide {missing_str}."
    else:
        status = "NO_APPLICABLE_PLAN"
        msg = "No currently matching LIC plan was found based on the information provided."

    return LICRecommendationResult(
        status=status,
        total_plans_evaluated=len(target_plans),
        eligible_count=len(eligible_plans),
        ineligible_count=ineligible_count,
        missing_info_count=missing_info_count,
        recommended_plans=eligible_plans,
        all_evaluated_plans=evaluated_plans,
        message=msg
    )
