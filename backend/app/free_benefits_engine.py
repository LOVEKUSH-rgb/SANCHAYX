"""
Deterministic Free Benefits Eligibility Engine for SANCHAY.
Zero-hallucination, strictly rules-based engine supporting:
- ELIGIBLE
- INELIGIBLE
- ADDITIONAL_INFORMATION_REQUIRED
- NO_APPLICABLE_BENEFIT

Evaluates user profile against verified structured eligibility criteria.
Never guesses or makes unverified assumptions.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class FreeBenefitUserProfile(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    occupation: Optional[str] = None
    annual_family_income: Optional[float] = None
    category: Optional[str] = None  # General, SC, ST, OBC, EWS, VJNT, SEBC, DNT
    rural_urban: Optional[str] = None
    marital_status: Optional[str] = None
    disability: Optional[bool] = None

    # Additional contextual fields for specific benefit types
    has_ration_card: Optional[bool] = None
    ration_card_type: Optional[str] = None  # AAY, PHH, BPL, NFSA, Above Poverty Line
    is_transgender: Optional[bool] = None
    has_transgender_certificate: Optional[bool] = None
    is_student: Optional[bool] = None
    student_standard_or_course: Optional[str] = None  # e.g., "1-10", "Undergraduate", "Engineering/Technical", "Diploma"
    has_merit_rank: Optional[bool] = None
    residency_years: Optional[int] = None


class FreeBenefitEvaluationResult(BaseModel):
    benefit_id: str
    name: str
    level: str
    state: str
    category: str
    benefit_type: str
    status: str  # ELIGIBLE | INELIGIBLE | ADDITIONAL_INFORMATION_REQUIRED | NO_APPLICABLE_BENEFIT
    eligible: bool
    eligibility_reasons: List[str] = Field(default_factory=list)
    failed_criteria: List[str] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list)
    missing_information_prompt: Optional[str] = None
    benefit_summary: str = ""
    application_mode: str = ""
    application_url: Optional[str] = None
    official_source: str = ""
    last_verified: str = ""


def normalize_str(val: Optional[str]) -> str:
    return str(val or "").strip().lower()


def evaluate_single_free_benefit(benefit: Dict[str, Any], profile: FreeBenefitUserProfile) -> FreeBenefitEvaluationResult:
    benefit_id = benefit.get("benefit_id", "")
    name = benefit.get("name", "")
    level = benefit.get("level", "central")
    state = benefit.get("state", "All India")
    cat = benefit.get("category", "")
    benefit_type = benefit.get("benefit_type", "")
    structured = benefit.get("structured_eligibility", {})

    eligibility_reasons: List[str] = []
    failed_criteria: List[str] = []
    missing_fields: List[str] = []
    missing_prompts: List[str] = []

    # 1. State / Residency Match
    allowed_states = structured.get("allowed_states", ["All India"])
    if "All India" not in allowed_states and state != "All India":
        if not profile.state:
            missing_fields.append("state")
            missing_prompts.append(f"State of residence (this benefit is exclusive to {state})")
        else:
            p_state_norm = normalize_str(profile.state)
            state_match = any(
                normalize_str(s) in p_state_norm or p_state_norm in normalize_str(s)
                for s in allowed_states
            )
            if not state_match:
                failed_criteria.append(f"Resident state mismatch: Benefit is restricted to residents of {', '.join(allowed_states)}, but user state is '{profile.state}'.")
            else:
                eligibility_reasons.append(f"Resident of eligible state ({profile.state}).")

    # 1.1 Minimum Residency Years (e.g., Puducherry 5 years)
    min_residency = structured.get("min_residency_years")
    if min_residency is not None:
        if profile.residency_years is None:
            missing_fields.append("residency_years")
            missing_prompts.append(f"Number of continuous years living in {state} (Requires min. {min_residency} years)")
        elif profile.residency_years < min_residency:
            failed_criteria.append(f"Requires at least {min_residency} years of continuous residence; provided: {profile.residency_years} years.")
        else:
            eligibility_reasons.append(f"Meets minimum {min_residency} years residency requirement.")

    # 2. Age Checks
    min_age = structured.get("min_age")
    max_age = structured.get("max_age")
    if min_age is not None or max_age is not None:
        if profile.age is None:
            missing_fields.append("age")
            missing_prompts.append(f"Your age (Requires age {min_age or 0} to {max_age or 'any'})")
        else:
            if min_age is not None and profile.age < min_age:
                failed_criteria.append(f"Age {profile.age} is below minimum required age of {min_age} years.")
            elif max_age is not None and profile.age > max_age:
                failed_criteria.append(f"Age {profile.age} exceeds maximum allowable age of {max_age} years.")
            else:
                eligibility_reasons.append(f"Age {profile.age} is within eligible bracket ({min_age or 0}-{max_age or 'any'}).")

    # 3. Gender / Transgender criteria
    allowed_genders = structured.get("allowed_genders")
    requires_transgender = structured.get("requires_transgender_certificate", False)

    if requires_transgender or allowed_genders:
        p_gender_norm = normalize_str(profile.gender)
        is_trans = profile.is_transgender or p_gender_norm in ["transgender", "trans", "other"]
        
        if not is_trans and p_gender_norm in ["male", "female"]:
            failed_criteria.append("Benefit is specifically for Transgender persons holding official certificate/ID.")
        elif not is_trans and not profile.gender:
            missing_fields.append("gender")
            missing_prompts.append("Gender / Transgender identity")
        else:
            # Check certificate
            if profile.has_transgender_certificate is None:
                missing_fields.append("has_transgender_certificate")
                missing_prompts.append("Whether you hold an official Transgender Certificate/Identity Card under the Transgender Persons Act")
            elif not profile.has_transgender_certificate:
                failed_criteria.append("Official Transgender Certificate / Identity Card is mandatory for this benefit.")
            else:
                eligibility_reasons.append("Transgender person with valid certificate.")

    # 4. Social Category / Caste criteria (SC, ST, OBC, EWS, VJNT, SEBC, DNT)
    allowed_categories = structured.get("allowed_categories")
    if allowed_categories:
        if not profile.category:
            missing_fields.append("category")
            missing_prompts.append(f"Social Category / Caste (Requires one of: {', '.join(allowed_categories)})")
        else:
            p_cat_norm = normalize_str(profile.category)
            cat_match = any(
                normalize_str(c) in p_cat_norm or p_cat_norm in normalize_str(c)
                for c in allowed_categories
            )
            if not cat_match:
                failed_criteria.append(f"Category '{profile.category}' does not match required categories ({', '.join(allowed_categories)}).")
            else:
                eligibility_reasons.append(f"Category matches eligible target groups ({profile.category}).")

    # 5. Income Limits
    max_income = structured.get("max_annual_income")
    if max_income is not None:
        if profile.annual_family_income is None:
            missing_fields.append("annual_family_income")
            missing_prompts.append(f"Annual family income (Must be up to ₹{int(max_income):,})")
        else:
            if profile.annual_family_income > max_income:
                failed_criteria.append(f"Annual family income of ₹{int(profile.annual_family_income):,} exceeds the maximum ceiling of ₹{int(max_income):,}.")
            else:
                eligibility_reasons.append(f"Annual income (₹{int(profile.annual_family_income):,}) is within permissible limit of ₹{int(max_income):,}.")

    # 6. Student / Education Criteria
    if structured.get("student_only", False):
        p_occ_norm = normalize_str(profile.occupation)
        is_student = profile.is_student is True or "student" in p_occ_norm
        
        if profile.is_student is False or (profile.occupation and "student" not in p_occ_norm and profile.is_student is None):
            failed_criteria.append("Benefit is reserved exclusively for actively enrolled students.")
        elif not is_student and not profile.occupation and profile.is_student is None:
            missing_fields.append("is_student")
            missing_prompts.append("Whether you are currently an enrolled student")
        else:
            eligibility_reasons.append("Enrolled student.")

        # Merit rank requirement (e.g. Haryana HSMIS)
        if structured.get("requires_merit_rank", False):
            if profile.has_merit_rank is None:
                missing_fields.append("has_merit_rank")
                missing_prompts.append("Whether you secured 1st, 2nd, or 3rd position/merit in your university examinations")
            elif not profile.has_merit_rank:
                failed_criteria.append("Scheme requires securing 1st, 2nd, or 3rd position/rank in university examination.")
            else:
                eligibility_reasons.append("Secured qualifying merit position in university exams.")

        # Technical courses requirement (e.g. Nagaland Technical ST)
        if structured.get("technical_courses_only", False):
            course_norm = normalize_str(profile.student_standard_or_course)
            if not course_norm:
                missing_fields.append("student_standard_or_course")
                missing_prompts.append("Course enrolled (Must be Diploma / Degree / PG in Engineering or Forestry)")
            elif not any(k in course_norm for k in ["tech", "eng", "diploma", "degree", "forest", "b.tech", "b.e", "m.tech", "polytechnic"]):
                failed_criteria.append(f"Course '{profile.student_standard_or_course}' is not a covered engineering or technical/forestry course.")
            else:
                eligibility_reasons.append("Enrolled in eligible technical / engineering program.")

    # 7. Ration Card / BPL Requirements (e.g. PMGKAY, Puducherry Free Rice)
    if structured.get("requires_ration_card", False) or structured.get("requires_bpl", False):
        allowed_cards = structured.get("allowed_card_types", ["AAY", "PHH", "BPL", "NFSA"])
        card_type = str(profile.ration_card_type or "").upper().strip()
        
        if profile.has_ration_card is False:
            failed_criteria.append("Valid NFSA / AAY / PHH / BPL Ration Card is mandatory.")
        elif not card_type and profile.has_ration_card is None:
            missing_fields.append("ration_card_type")
            missing_prompts.append(f"Ration Card status and category ({'/'.join(allowed_cards)})")
        elif card_type:
            matched_card = any(ac in card_type for ac in allowed_cards)
            if not matched_card and ("APL" in card_type or "ABOVE" in card_type):
                failed_criteria.append(f"Ration card category '{card_type}' is ineligible. Requires {', '.join(allowed_cards)}.")
            elif matched_card:
                eligibility_reasons.append(f"Holds valid eligible {card_type} Ration Card.")

    # 7.5 Disability Criteria
    if structured.get("requires_disability", False):
        if profile.disability is None:
            missing_fields.append("disability")
            missing_prompts.append("Whether you have a benchmark disability (40% or more) / valid UDID card")
        elif not profile.disability:
            failed_criteria.append("Benefit is reserved specifically for Persons with Benchmark Disabilities (PwD) holding valid UDID/Certificate.")
        else:
            eligibility_reasons.append("Person with Benchmark Disability (PwD).")

    # 8. Excluded Occupations (e.g. Puducherry free rice excludes fishermen who get fisheries dept aid)
    excluded_occ = structured.get("excluded_occupations", [])
    if excluded_occ and profile.occupation:
        occ_norm = normalize_str(profile.occupation)
        if any(normalize_str(eo) in occ_norm for eo in excluded_occ):
            failed_criteria.append(f"Occupation '{profile.occupation}' is covered under separate department assistance and excluded here.")

    # Resolve Final Status
    if failed_criteria:
        final_status = "INELIGIBLE"
        is_eligible = False
    elif missing_fields:
        final_status = "ADDITIONAL_INFORMATION_REQUIRED"
        is_eligible = False
    else:
        final_status = "ELIGIBLE"
        is_eligible = True

    missing_prompt_text = None
    if missing_prompts:
        missing_prompt_text = "To verify your eligibility, please provide: " + "; ".join(missing_prompts) + "."

    return FreeBenefitEvaluationResult(
        benefit_id=benefit_id,
        name=name,
        level=level,
        state=state,
        category=cat,
        benefit_type=benefit_type,
        status=final_status,
        eligible=is_eligible,
        eligibility_reasons=eligibility_reasons,
        failed_criteria=failed_criteria,
        missing_fields=missing_fields,
        missing_information_prompt=missing_prompt_text,
        benefit_summary=benefit.get("benefit", ""),
        application_mode=benefit.get("application_mode", ""),
        application_url=benefit.get("application_url"),
        official_source=benefit.get("official_source", "https://www.myscheme.gov.in"),
        last_verified=benefit.get("last_verified", "2026-09-10")
    )


def evaluate_all_free_benefits(
    benefits_list: List[Dict[str, Any]],
    profile: FreeBenefitUserProfile
) -> List[FreeBenefitEvaluationResult]:
    """
    Evaluates all benefits in the verified database against user profile.
    Returns results prioritized by:
    1. ELIGIBLE
    2. ADDITIONAL_INFORMATION_REQUIRED
    3. INELIGIBLE
    """
    results: List[FreeBenefitEvaluationResult] = []
    for b in benefits_list:
        res = evaluate_single_free_benefit(b, profile)
        results.append(res)

    def sort_key(r: FreeBenefitEvaluationResult):
        if r.status == "ELIGIBLE":
            return 0
        if r.status == "ADDITIONAL_INFORMATION_REQUIRED":
            return 1
        return 2

    results.sort(key=sort_key)
    return results
