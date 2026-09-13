import re
from fastapi import APIRouter, HTTPException, Query, Body, status
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

from app.database import get_lic_plans_collection, get_lic_information_collection
from app.lic_engine import (
    LICUserProfile,
    evaluate_lic_plan_eligibility,
    recommend_lic_plans,
    LICPlanEvaluationResult,
    LICRecommendationResult
)

router = APIRouter(tags=["LIC Plans & Guidance"])


# ==========================================
# Pydantic Schemas for LIC API
# ==========================================

class LICRecommendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    age: Optional[float] = Field(None, ge=0, le=120, description="User age in years")
    gender: Optional[str] = Field(None, description="Gender (Male, Female, Other, All)")
    profession: Optional[str] = Field(None, description="Profession or occupation")
    monthly_budget: Optional[float] = Field(None, ge=0, description="Monthly budget in INR")
    annual_budget: Optional[float] = Field(None, ge=0, description="Annual budget in INR")
    goal: Optional[str] = Field(None, description="Primary financial goal (e.g. Child Education, Retirement, Family Protection)")
    child_age: Optional[float] = Field(None, ge=0, le=30, description="Child age in years (if applicable)")
    retirement_requirement: Optional[Union[bool, str]] = Field(None, description="Retirement/pension priority")
    protection_requirement: Optional[Union[bool, str]] = Field(None, description="Protection/term priority")
    investment_preference: Optional[Union[List[str], str]] = Field(None, description="Investment preference (Guaranteed, ULIP, etc.)")
    specific_plan_id: Optional[str] = Field(None, description="Optional specific Plan ID or Plan Number to evaluate individually")


class LICPlanSummary(BaseModel):
    model_config = ConfigDict(extra="allow")
    plan_id: str
    plan_name: str
    plan_number: str
    uin: str
    category: str
    active_status: str
    short_description: Optional[str] = None
    main_purpose: Optional[str] = None
    min_entry_age: Optional[float] = None
    max_entry_age: Optional[float] = None
    min_sum_assured_text: Optional[str] = None
    policy_term_text: Optional[str] = None
    premium_payment_term_text: Optional[str] = None
    death_benefit_summary: Optional[str] = None
    maturity_benefit_summary: Optional[str] = None
    official_lic_url: str
    official_document_url: Optional[str] = None
    last_verified: str
    verification_required: bool = False


# ==========================================
# Endpoints
# ==========================================

@router.get("/plans", response_model=List[Dict[str, Any]])
def get_all_lic_plans(
    category: Optional[str] = Query(None, description="Filter by category (Endowment, Whole Life, Money Back, Term Assurance, Pension, Unit Linked, Micro Insurance)"),
    search: Optional[str] = Query(None, description="Search query across plan name, number, UIN, or description")
):
    """
    1. GET /api/v1/lic/plans
    Returns all active LIC plans from the dedicated lic_plans database.
    Does NOT return withdrawn plans.
    """
    col = get_lic_plans_collection()
    
    # Strictly filter active plans only
    query: Dict[str, Any] = {
        "$or": [
            {"active_status": "active"},
            {"status": "active"}
        ]
    }

    if isinstance(category, str) and category.strip() and category.strip().lower() != "all":
        cat_clean = category.strip()
        query["category"] = {"$regex": re.escape(cat_clean), "$options": "i"}

    plans = list(col.find(query))

    # Apply search filter if present
    if isinstance(search, str) and search.strip():
        s_term = search.strip().lower()
        filtered = []
        for p in plans:
            p_name = str(p.get("plan_name", "")).lower()
            p_num = str(p.get("plan_number", "")).lower()
            p_uin = str(p.get("uin", "")).lower()
            p_desc = str(p.get("short_description", "")).lower()
            p_cat = str(p.get("category", "")).lower()
            if s_term in p_name or s_term in p_num or s_term in p_uin or s_term in p_desc or s_term in p_cat:
                filtered.append(p)
        plans = filtered

    # Format response safely
    result = []
    for p in plans:
        # Exclude internal mongo id if present
        clean_p = {k: v for k, v in p.items() if k != "_id"}
        result.append(clean_p)

    return result


@router.get("/plans/{plan_id}", response_model=Dict[str, Any])
def get_single_lic_plan(plan_id: str):
    """
    2. GET /api/v1/lic/plans/{plan_id}
    Returns complete details of one LIC plan by plan_id (e.g. 'LIC-001') or plan_number (e.g. '717').
    Returns 404 if the plan does not exist or is withdrawn.
    """
    if not plan_id or not str(plan_id).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan ID parameter is required.")

    col = get_lic_plans_collection()
    clean_id = str(plan_id).strip()

    plan = col.find_one({
        "$or": [
            {"plan_id": clean_id},
            {"plan_id": clean_id.upper()},
            {"plan_number": clean_id}
        ]
    })

    if not plan:
        # Case insensitive search fallback
        all_plans = list(col.find({}))
        for p in all_plans:
            if str(p.get("plan_id", "")).lower() == clean_id.lower() or str(p.get("plan_number", "")) == clean_id:
                plan = p
                break

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LIC Plan '{clean_id}' not found in active catalogue."
        )

    # Clean internal MongoDB keys
    clean_plan = {k: v for k, v in plan.items() if k != "_id"}
    return clean_plan


@router.post("/recommend", response_model=Dict[str, Any])
def recommend_lic_plans_endpoint(request: LICRecommendRequest = Body(...)):
    """
    3. POST /api/v1/lic/recommend
    Accepts user financial profile, performs statutory eligibility evaluation,
    and calculates explainable fit scores using lic_engine.py.
    """
    col = get_lic_plans_collection()
    all_active_plans = list(col.find({"$or": [{"active_status": "active"}, {"status": "active"}]}))

    profile = LICUserProfile(
        age=request.age,
        gender=request.gender,
        profession=request.profession,
        monthly_budget=request.monthly_budget,
        annual_budget=request.annual_budget,
        goal=request.goal,
        child_age=request.child_age,
        retirement_requirement=request.retirement_requirement,
        protection_requirement=request.protection_requirement,
        investment_preference=request.investment_preference
    )

    rec_result = recommend_lic_plans(
        lic_plans=all_active_plans,
        profile=profile,
        specific_plan_id=request.specific_plan_id
    )

    # Format user-friendly response
    recommended_output = []
    for r in rec_result.recommended_plans:
        recommended_output.append({
            "plan_id": r.plan_id,
            "plan_name": r.plan_name,
            "plan_number": r.plan_number,
            "uin": r.uin,
            "category": r.category,
            "eligibility_status": r.status,
            "eligible": r.eligible,
            "fit_score": r.match_score,
            "match_score": r.match_score,
            "matched_criteria": r.eligibility_reasons,
            "failed_criteria": r.failed_criteria,
            "missing_information": r.missing_fields,
            "short_explanation": r.match_reasons[0] if r.match_reasons else "Statutorily eligible plan.",
            "why_it_matches": r.match_reasons,
            "important_conditions": r.important_conditions,
            "benefits_summary": r.benefits_summary,
            "official_lic_url": r.official_lic_url,
            "official_document_url": r.official_document_url,
            "source": r.source
        })

    all_evaluated_output = []
    for r in rec_result.all_evaluated_plans:
        all_evaluated_output.append({
            "plan_id": r.plan_id,
            "plan_name": r.plan_name,
            "plan_number": r.plan_number,
            "uin": r.uin,
            "category": r.category,
            "eligibility_status": r.status,
            "eligible": r.eligible,
            "fit_score": r.match_score,
            "failed_criteria": r.failed_criteria,
            "missing_information": r.missing_fields,
            "official_lic_url": r.official_lic_url
        })

    return {
        "status": rec_result.status,
        "total_plans_evaluated": rec_result.total_plans_evaluated,
        "eligible_count": rec_result.eligible_count,
        "ineligible_count": rec_result.ineligible_count,
        "missing_info_count": rec_result.missing_info_count,
        "message": rec_result.message,
        "recommended_plans": recommended_output,
        "all_evaluated_plans": all_evaluated_output,
        "disclaimer": rec_result.disclaimer
    }


@router.get("/info", response_model=Dict[str, Any])
def get_lic_information():
    """
    4. GET /api/v1/lic/info
    Returns verified official LIC corporate details, establishment act, and category links.
    """
    col = get_lic_information_collection()
    info = col.find_one({"organization_name": "Life Insurance Corporation of India"})

    if not info:
        # Fallback to any document in lic_information collection
        info = col.find_one({})

    if not info:
        return {
            "organization_name": "Life Insurance Corporation of India",
            "short_name": "LIC",
            "establishment_date": "1 September 1956",
            "statutory_act": "Life Insurance Corporation Act, 1956",
            "irdai_registration_number": "512",
            "official_website": "https://www.licindia.in/",
            "source": "LIC Official Website",
            "last_verified": "2026-08-31"
        }

    clean_info = {k: v for k, v in info.items() if k != "_id"}
    return clean_info
