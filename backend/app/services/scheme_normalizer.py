import re
from typing import Dict, Any, Optional, List


def normalize_category(cat: str) -> str:
    c = (cat or "").lower().strip()
    if any(k in c for k in ["saving", "fixed", "deposit", "growth"]):
        return "savings"
    if any(k in c for k in ["pension", "retire", "senior"]):
        return "pension"
    if any(k in c for k in ["protection", "insurance", "bima", "lic"]):
        return "protection"
    if any(k in c for k in ["education", "scholarship", "student"]):
        return "education"
    if any(k in c for k in ["women", "girl", "mahila", "beti", "matru"]):
        return "women"
    if any(k in c for k in ["agriculture", "farmer", "kisan", "crop", "agri"]):
        return "agriculture"
    if any(k in c for k in ["health", "medical", "ayushman", "swasthya"]):
        return "health"
    if any(k in c for k in ["housing", "awas", "home", "shelter"]):
        return "housing"
    if any(k in c for k in ["employment", "skill", "kaushal", "rozgar", "internship"]):
        return "employment"
    if any(k in c for k in ["social", "security", "maandhan", "unorganized"]):
        return "social_security"
    if any(k in c for k in ["business", "msme", "mudra", "svanidhi", "udyam"]):
        return "business"
    if any(k in c for k in ["rural", "nrlm", "gramin", "mgnrega", "panchayat"]):
        return "rural"
    return "savings"


def normalize_scheme_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cleanses, normalizes, and validates a scheme record to match SANCHAY's official schema.
    """
    scheme_id = str(raw.get("scheme_id") or raw.get("id") or "").lower().strip()
    if not scheme_id:
        name_clean = re.sub(r'[^a-zA-Z0-9]', '_', str(raw.get("name", "scheme")).lower()).strip('_')
        scheme_id = name_clean[:30]

    category = normalize_category(raw.get("category", ""))
    sub_category = raw.get("sub_category") or category
    
    # Financial normalization
    fin_raw = raw.get("financial", {})
    min_contrib = fin_raw.get("minimum_contribution") or raw.get("minimum_contribution") or raw.get("minimumContribution")
    max_contrib = fin_raw.get("maximum_contribution") or raw.get("maximum_contribution") or raw.get("maximumContribution")
    lock_in_years = fin_raw.get("lock_in_years") or raw.get("lock_in_years") or raw.get("lockInYears") or 0
    lock_in_period = fin_raw.get("lock_in_period") or raw.get("lock_in_period") or f"{lock_in_years} Years" if lock_in_years else "Flexible"
    tax_treatment = fin_raw.get("tax_treatment") or raw.get("tax_treatment") or raw.get("taxBenefit") or "Subject to statutory tax provisions"

    # Eligibility normalization
    elig_raw = raw.get("eligibility", {})
    age_min = elig_raw.get("age_min") if "age_min" in elig_raw else raw.get("min_age", raw.get("minAge"))
    age_max = elig_raw.get("age_max") if "age_max" in elig_raw else raw.get("max_age", raw.get("maxAge"))
    gender = elig_raw.get("gender") or raw.get("gender_requirement") or raw.get("gender") or "any"
    residency = elig_raw.get("residency") or ["resident"]
    nri_allowed = elig_raw.get("nri_allowed", False) or raw.get("nri_eligibility", False)

    # Benefits normalization
    ben_raw = raw.get("benefits", {})
    interest_rate = ben_raw.get("interest_rate") or raw.get("interest_rate") or raw.get("currentInterestRate") or raw.get("returnType")

    # Image mapping
    media_raw = raw.get("media", {})
    img_url = media_raw.get("image_url") or raw.get("image_url") or raw.get("imageUrl") or None

    authority = raw.get("authority") or raw.get("official_authority") or raw.get("officialAuthority") or "Government of India"
    official_url = raw.get("official_url") or raw.get("official_source_url") or raw.get("officialSourceUrl") or "https://india.gov.in"
    verified = raw.get("verified", True)
    verification_status = raw.get("verification_status", "verified")
    last_verified = raw.get("last_verified_date") or raw.get("last_verified") or "2026-08-28"

    return {
        "scheme_id": scheme_id,
        "name": raw.get("name", "").strip(),
        "short_name": raw.get("short_name") or raw.get("shortName") or raw.get("name", "").strip(),
        "short_description": raw.get("short_description") or raw.get("description_simple") or raw.get("descriptionSimple") or raw.get("benefitsOverview") or "",
        "full_description": raw.get("full_description") or raw.get("detailed_description") or raw.get("short_description") or "",
        "category": category,
        "sub_category": sub_category,
        "scheme_type": raw.get("scheme_type", "government_scheme"),
        
        "authority": authority,
        "ministry": raw.get("ministry") or authority,
        "source_name": raw.get("source_name") or authority,
        "official_url": official_url,
        
        "verified": verified,
        "verification_status": verification_status,
        "last_verified_date": last_verified,
        
        "eligibility": {
            "age_min": int(age_min) if age_min is not None else None,
            "age_max": int(age_max) if age_max is not None else None,
            "gender": str(gender).lower(),
            "residency": residency if isinstance(residency, list) else ["resident"],
            "income_limit": float(elig_raw.get("income_limit")) if elig_raw.get("income_limit") is not None else None,
            "occupation": elig_raw.get("occupation", []),
            "employment_status": elig_raw.get("employment_status", []),
            "marital_status": elig_raw.get("marital_status", []),
            "disability_required": elig_raw.get("disability_required", False),
            "farmer_required": elig_raw.get("farmer_required", False) or raw.get("farmer_required", False),
            "student_required": elig_raw.get("student_required", False) or raw.get("student_required", False),
            "senior_citizen_required": elig_raw.get("senior_citizen_required", False) or (int(age_min) >= 60 if age_min is not None else False),
            "woman_specific": elig_raw.get("woman_specific", False) or str(gender).lower() in ["female", "women", "girl"],
            "minor_allowed": elig_raw.get("minor_allowed", True),
            "guardian_required": elig_raw.get("guardian_required", False),
            "nri_allowed": nri_allowed,
            "special_conditions": elig_raw.get("special_conditions") or raw.get("special_conditions")
        },
        
        "benefits": {
            "benefit_type": ben_raw.get("benefit_type", ["statutory_yield"]),
            "benefit_amount": ben_raw.get("benefit_amount") or raw.get("benefit_amount"),
            "interest_rate": interest_rate,
            "subsidy": ben_raw.get("subsidy"),
            "insurance_coverage": ben_raw.get("insurance_coverage") or raw.get("insurance_coverage"),
            "pension_amount": ben_raw.get("pension_amount") or raw.get("pension_amount"),
            "other_benefits": ben_raw.get("other_benefits", [])
        },
        
        "financial": {
            "minimum_contribution": float(min_contrib) if min_contrib is not None else 500.0,
            "maximum_contribution": float(max_contrib) if max_contrib is not None else None,
            "contribution_frequency": fin_raw.get("contribution_frequency", "annual"),
            "lock_in_period": lock_in_period,
            "lock_in_years": int(lock_in_years) if lock_in_years is not None else 0,
            "liquidity": fin_raw.get("liquidity") or raw.get("liquidity") or "Medium",
            "withdrawal_rules": fin_raw.get("withdrawal_rules") or raw.get("withdrawal_rules") or "Standard government gazette terms",
            "tax_treatment": tax_treatment
        },
        
        "goals": raw.get("goals") or [category],
        "life_stages": raw.get("life_stages") or ["all"],
        "media": {
            "image_url": img_url,
            "logo_url": media_raw.get("logo_url"),
            "fit_mode": media_raw.get("fit_mode", "cover")
        },
        
        "active": raw.get("active", True),
        "tags": raw.get("tags") or [category, authority]
    }
