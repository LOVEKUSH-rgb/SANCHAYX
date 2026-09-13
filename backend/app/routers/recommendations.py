import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from app.database import get_schemes_collection, get_logs_collection
from app.schemas import (
    RecommendationRequest, RecommendationResponse,
    UserProfile, UserGoal, UserPreferences, ScoredScheme
)
from app.engine import evaluate_scheme_fit

router = APIRouter(prefix="/recommendations", tags=["Recommendations & Fit-Score"])


@router.post("", response_model=RecommendationResponse)
def generate_recommendations(req: RecommendationRequest):
    # Parse Profile Inputs
    if req.profile is not None:
        profile = req.profile
    else:
        profile = UserProfile(
            age=req.age,
            gender=req.gender or "all",
            state=req.state,
            residency=req.residency or "Resident Indian",
            residency_status=req.residency or "resident",
            income=req.income,
            annual_income=req.income,
            occupation=req.occupation,
            saving_for=req.saving_for or "self",
            has_guardian=req.has_guardian,
            child_age=req.child_age
        )

    # Parse Goal Inputs
    if req.goal is not None:
        goal = req.goal
    else:
        goal = UserGoal(goal=req.goal_name or "wealth")

    # Parse Preferences Inputs
    if req.preferences is not None:
        preferences = req.preferences
    else:
        preferences = UserPreferences(
            monthly_budget=req.monthly_budget if req.monthly_budget is not None else 2000.0,
            horizon_years=req.horizon_years if req.horizon_years is not None else 10,
            liquidity_preference=req.liquidity_preference or "medium",
            tax_preference=req.tax_preference if req.tax_preference is not None else True
        )

    # 1. Fetch all active schemes from the master MongoDB collection
    col = get_schemes_collection()
    raw_schemes = list(col.find({"$or": [{"status.active": True}, {"active": True}]}))

    if not raw_schemes:
        raise HTTPException(
            status_code=500,
            detail="No schemes found in SANCHAY master database. Please run the seed script."
        )

    total_evaluated = len(raw_schemes)
    exact_matches: List[ScoredScheme] = []
    closest_matches: List[ScoredScheme] = []
    rejected_schemes: List[Dict[str, Any]] = []
    review_required: List[Dict[str, Any]] = []

    cat_filter = (req.category_filter or "all").upper().strip()

    # 2. Evaluate all schemes deterministically
    for s in raw_schemes:
        scored = evaluate_scheme_fit(s, profile, goal, preferences)
        
        # Category filter check if specified
        if cat_filter != "ALL" and cat_filter != "all":
            scheme_cat = str(scored.category).upper()
            if cat_filter not in scheme_cat:
                continue

        if scored.status == "ELIGIBLE":
            if scored.fit_score >= 60.0:
                exact_matches.append(scored)
            else:
                closest_matches.append(scored)
        elif scored.status == "REVIEW_REQUIRED":
            review_required.append({
                "scheme_id": scored.scheme_id,
                "name": scored.name,
                "category": scored.category,
                "review_required_fields": scored.eligibility_summary.get("review_required_fields", []),
                "reasons": scored.eligibility_summary.get("failed_criteria", [])
            })
        else:
            rejected_schemes.append({
                "scheme_id": scored.scheme_id,
                "name": scored.name,
                "category": scored.category,
                "failed_criteria": scored.eligibility_summary.get("failed_criteria", [])
            })

    # Sort eligible schemes descending by Fit Score
    exact_matches.sort(key=lambda x: x.fit_score, reverse=True)
    closest_matches.sort(key=lambda x: x.fit_score, reverse=True)

    # Top recommendations (up to 5 for UI display)
    top_exact = exact_matches[:5]
    top_closest = closest_matches[:3]

    # Format backward-compatible recommendation items for existing UI
    ui_recommendations = []
    for em in top_exact:
        fin = em.scheme.get("financial", {})
        ben = em.scheme.get("benefits", {})
        ver = em.scheme.get("verification", {})
        name_str = em.name.get("en") if isinstance(em.name, dict) else str(em.name)

        ui_recommendations.append({
            "scheme_id": em.scheme_id,
            "id": em.scheme_id,
            "name": name_str,
            "short_name": em.short_name or name_str,
            "category": em.category,
            "sub_category": em.sub_category,
            "fit_score": em.fit_score,
            "short_description": ben.get("summary") or f"Government verified {em.category} scheme.",
            "full_description": ben.get("summary"),
            "authority": ver.get("source_authority") or em.ownership.get("ministry") or "Government of India",
            "official_url": ver.get("official_url") or "https://india.gov.in",
            "last_verified_date": ver.get("last_verified") or "2026-08-28",
            "benefits": {
                "interest_rate": fin.get("interest_rate") or ben.get("amount") or "Statutory Defined Benefit",
                "summary": ben.get("summary")
            },
            "financial": {
                "minimum_contribution": fin.get("minimum_contribution") or 500,
                "maximum_contribution": fin.get("maximum_contribution"),
                "lock_in_years": fin.get("lock_in_years") or 0,
                "tax_treatment": ben.get("tax_benefit") or "Statutory Provisions"
            },
            "eligibility": em.scheme.get("eligibility", {}),
            "why_it_fits": " ".join(em.why_this_fits) if em.why_this_fits else "Matches your financial profile and statutory criteria.",
            "breakdown": {
                "goal_score": em.goal_match,
                "monthly_budget_score": em.budget_match,
                "time_horizon_score": em.horizon_match,
                "liquidity_score": em.liquidity_match,
                "tax_preference_score": em.tax_match,
                "eligibility_score": em.eligibility_strength
            }
        })

    # Generate recommendation run session ID
    recommendation_id = f"rec_{uuid.uuid4().hex[:12]}"

    # Determine recommendation type and summary
    rec_type = "exact_match" if top_exact else "no_exact_match"
    explanation = (
        f"Found {len(top_exact)} verified schemes matching your profile with high fit scores."
        if top_exact else
        "No exact scheme met 100% of statutory criteria and budget requirements. Showing closest potential matches."
    )
    all_failed_reasons = []
    for r in rejected_schemes:
        all_failed_reasons.extend(r.get("failed_criteria", []))

    # Persist session log server-side for grounded Sakhi assistant reference
    try:
        logs_col = get_logs_collection()
        log_entry = {
            "recommendation_id": recommendation_id,
            "created_at": datetime.utcnow().isoformat(),
            "profile": profile.model_dump() if hasattr(profile, "model_dump") else dict(profile),
            "goal": goal.model_dump() if hasattr(goal, "model_dump") else dict(goal),
            "preferences": preferences.model_dump() if hasattr(preferences, "model_dump") else dict(preferences),
            "exact_matches": [em.model_dump() for em in top_exact],
            "closest_matches": [cm.model_dump() for cm in top_closest],
            "rejected_schemes": rejected_schemes,
            "review_required": review_required
        }
        logs_col.insert_one(log_entry)
    except Exception as e:
        print(f"Notice: Failed to log recommendation session: {e}")

    return RecommendationResponse(
        recommendation_id=recommendation_id,
        status="success",
        recommendation_type=rec_type,
        explanation=explanation,
        exact_matches=top_exact,
        closest_matches=top_closest,
        rejected_schemes=rejected_schemes,
        review_required=review_required,
        total_evaluated=total_evaluated,
        total_eligible=len(exact_matches) + len(closest_matches),
        total_ineligible=len(rejected_schemes),
        total_review_required=len(review_required),
        recommendations=ui_recommendations,
        closest_fits=[c.model_dump() for c in top_closest],
        failed_reasons=all_failed_reasons
    )

