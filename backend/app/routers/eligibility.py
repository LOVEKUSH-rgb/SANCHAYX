from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.database import get_schemes_collection
from app.schemas import UserProfile, UserGoal, EligibilityEvaluationResult
from app.engine import evaluate_eligibility

router = APIRouter(prefix="/eligibility", tags=["Deterministic Eligibility Checker"])


class EligibilityCheckRequest(BaseModel):
    scheme_id: str
    profile: UserProfile
    goal: Optional[UserGoal] = None


@router.post("/check", response_model=EligibilityEvaluationResult)
def check_single_scheme_eligibility(req: EligibilityCheckRequest):
    col = get_schemes_collection()
    s = col.find_one({"$or": [{"scheme_id": req.scheme_id}, {"id": req.scheme_id}]})
    if not s:
        raise HTTPException(status_code=404, detail=f"Scheme '{req.scheme_id}' not found in master database.")

    res = evaluate_eligibility(s, req.profile, req.goal)
    return res
