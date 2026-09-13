import re
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body, status
from pydantic import BaseModel, Field

from app.database import get_free_benefits_collection
from app.free_benefits_engine import (
    FreeBenefitUserProfile,
    FreeBenefitEvaluationResult,
    evaluate_single_free_benefit,
    evaluate_all_free_benefits
)

router = APIRouter(prefix="/free-benefits", tags=["Free Benefits & Assistance"])


class FreeBenefitsEvaluationRequest(BaseModel):
    benefit_id: Optional[str] = None
    profile: FreeBenefitUserProfile


class FreeBenefitsEvaluationResponse(BaseModel):
    status: str  # SUCCESS | NO_APPLICABLE_BENEFIT | ERROR
    total_evaluated: int
    eligible_count: int
    additional_info_required_count: int
    results: List[FreeBenefitEvaluationResult]


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc or not isinstance(doc, dict):
        return doc
    clean = dict(doc)
    if "_id" in clean:
        clean["_id"] = str(clean["_id"])
    return clean


@router.get("", response_model=List[Dict[str, Any]], summary="List & filter Free Benefits & Assistance")
def list_free_benefits(
    state: Optional[str] = Query(None, description="Filter by State or 'All India'"),
    level: Optional[str] = Query(None, description="Filter by level: central, state, ut"),
    category: Optional[str] = Query(None, description="Filter by category: food, education, skill_employment"),
    benefit_type: Optional[str] = Query(None, description="Filter by benefit_type"),
    status: Optional[str] = Query(None, description="Filter by status, e.g. active_listed"),
    q: Optional[str] = Query(None, description="Search query")
):
    """
    Returns verified free benefits matching specified filter parameters.
    """
    col = get_free_benefits_collection()
    query: Dict[str, Any] = {}

    if isinstance(state, str) and state.strip().lower() != "all":
        # Match specific state or central/all india schemes
        st_clean = state.strip()
        query["$or"] = [
            {"state": {"$regex": f"^{re.escape(st_clean)}$", "$options": "i"}},
            {"state": "All India"},
            {"level": "central"}
        ]

    if isinstance(level, str) and level.strip().lower() != "all":
        query["level"] = {"$regex": f"^{re.escape(level.strip())}$", "$options": "i"}

    if isinstance(category, str) and category.strip().lower() != "all":
        query["category"] = {"$regex": f"^{re.escape(category.strip())}$", "$options": "i"}

    if isinstance(benefit_type, str) and benefit_type.strip().lower() != "all":
        query["benefit_type"] = {"$regex": f"^{re.escape(benefit_type.strip())}$", "$options": "i"}

    if isinstance(status, str) and status.strip().lower() != "all":
        query["status"] = status.strip()

    raw_docs = list(col.find(query))
    docs = [serialize_doc(d) for d in raw_docs if d]

    # Search keyword filtering if query is provided
    if isinstance(q, str) and q.strip():
        q_norm = q.strip().lower()
        filtered = []
        for d in docs:
            searchable = " ".join([
                str(d.get("name", "")),
                str(d.get("benefit", "")),
                str(d.get("eligibility_text", "")),
                str(d.get("state", "")),
                str(d.get("category", "")),
                str(d.get("benefit_type", "")),
                str(d.get("benefit_id", ""))
            ]).lower()
            if q_norm in searchable:
                filtered.append(d)
        return filtered

    return docs


@router.get("/latest", response_model=List[Dict[str, Any]], summary="Get latest active Free Benefits for homepage updates")
def get_latest_free_benefits(
    limit: int = Query(4, ge=1, le=10, description="Max items to return")
):
    """
    Returns recently verified, active listed Free Benefits for the homepage news/update module.
    """
    col = get_free_benefits_collection()
    raw_docs = list(col.find({"status": "active_listed"}))
    docs = [serialize_doc(d) for d in raw_docs if d]
    # Sort by last_verified descending if available
    sorted_docs = sorted(docs, key=lambda x: str(x.get("last_verified", "")), reverse=True)
    return sorted_docs[:limit]


@router.get("/{benefit_id}", response_model=Dict[str, Any], summary="Get Free Benefit details by ID")
def get_free_benefit_by_id(benefit_id: str):
    """
    Returns full record for a verified Free Benefit.
    """
    col = get_free_benefits_collection()
    doc = col.find_one({"benefit_id": benefit_id}) or col.find_one({"benefit_id": benefit_id.upper()})
    if not doc:
        # Try case-insensitive scan
        for item in col.find({}):
            if str(item.get("benefit_id", "")).lower() == benefit_id.lower():
                return serialize_doc(item)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Free Benefit with ID '{benefit_id}' was not found in verified database."
        )
    return serialize_doc(doc)


@router.post("/evaluate", response_model=FreeBenefitsEvaluationResponse, summary="Deterministically evaluate Free Benefits eligibility")
def evaluate_free_benefits(
    payload: FreeBenefitsEvaluationRequest = Body(...)
):
    """
    Runs deterministic Free Benefits Eligibility Engine against verified rules.
    Returns ELIGIBLE, INELIGIBLE, or ADDITIONAL_INFORMATION_REQUIRED without guessing.
    """
    col = get_free_benefits_collection()
    
    if payload.benefit_id:
        target_doc = col.find_one({"benefit_id": payload.benefit_id}) or col.find_one({"benefit_id": payload.benefit_id.upper()})
        if not target_doc:
            # Try case-insensitive scan
            for item in col.find({}):
                if str(item.get("benefit_id", "")).lower() == payload.benefit_id.lower():
                    target_doc = item
                    break
        if not target_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Benefit with ID '{payload.benefit_id}' does not exist."
            )
        res = evaluate_single_free_benefit(target_doc, payload.profile)
        return FreeBenefitsEvaluationResponse(
            status="SUCCESS",
            total_evaluated=1,
            eligible_count=1 if res.status == "ELIGIBLE" else 0,
            additional_info_required_count=1 if res.status == "ADDITIONAL_INFORMATION_REQUIRED" else 0,
            results=[res]
        )

    # Evaluate across all benefits in the database
    all_docs = col.find({})
    results = evaluate_all_free_benefits(all_docs, payload.profile)

    eligible_count = sum(1 for r in results if r.status == "ELIGIBLE")
    additional_count = sum(1 for r in results if r.status == "ADDITIONAL_INFORMATION_REQUIRED")

    final_status = "SUCCESS" if (eligible_count > 0 or additional_count > 0) else "NO_APPLICABLE_BENEFIT"

    return FreeBenefitsEvaluationResponse(
        status=final_status,
        total_evaluated=len(results),
        eligible_count=eligible_count,
        additional_info_required_count=additional_count,
        results=results
    )
