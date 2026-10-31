"""
backend/app/routers/financial_journey.py

FastAPI router for the Financial Journey, Smart Budgeting, and Financial Health.
Provides:
1. POST /api/financial/calculate: Public/guest endpoint for deterministic calculations.
2. GET  /api/financial/my-health: Authenticated endpoint to retrieve user's saved journey.
3. PUT  /api/financial/my-health: Authenticated endpoint to persist/update user's financial journey.

SECURITY & DATA ISOLATION:
- Authenticated operations use get_current_user_payload from auth.py.
- The internal user_id from the verified JWT payload is strictly enforced as the sole authority.
- No user can access or mutate another user's financial journey data.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.schemas import (
    FinancialProfileInput,
    FinancialHealthResponse,
    SavedFinancialJourney
)
from app.services.financial_health_engine import calculate_financial_health
from app.routers.auth import get_current_user_payload
from app.database import get_users_collection

router = APIRouter(prefix="/financial", tags=["Financial Journey & Smart Budget"])


@router.post("/calculate", response_model=FinancialHealthResponse)
def calculate_budget_and_health(req: FinancialProfileInput):
    """
    Public calculation endpoint.
    Computes 50/30/20 budget allocations, disposable surplus, and a transparent
    100-point Financial Health Score.
    Accessible to guest visitors without requiring authentication.
    """
    try:
        result = calculate_financial_health(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.get("/my-health")
def get_user_financial_health(payload: Dict[str, Any] = Depends(get_current_user_payload)):
    """
    Authenticated endpoint to retrieve the user's saved financial journey.
    Strictly isolated by the verified user_id in the session token.
    """
    user_id = payload["user_id"]
    users_col = get_users_collection()
    user_doc = users_col.find_one({"user_id": user_id})

    if not user_doc:
        raise HTTPException(status_code=404, detail="User account not found.")

    journey_data = user_doc.get("financial_journey")
    if not journey_data:
        return {
            "status": "success",
            "has_data": False,
            "user_id": user_id,
            "financial_journey": None,
            "message": "No financial journey recorded yet for this user."
        }

    return {
        "status": "success",
        "has_data": True,
        "user_id": user_id,
        "financial_journey": journey_data
    }


@router.put("/my-health")
def save_user_financial_health(
    req: FinancialProfileInput,
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Authenticated endpoint to calculate and persist the user's financial journey.
    The internal user_id is extracted strictly from the verified session payload,
    guaranteeing complete tenant isolation and data protection.
    Preserves all existing user fields (e.g. saved_plans, profile photo).
    """
    user_id = payload["user_id"]
    users_col = get_users_collection()
    user_doc = users_col.find_one({"user_id": user_id})

    if not user_doc:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Compute deterministic results
    calc_results = calculate_financial_health(req)

    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "user_id": user_id,
        "inputs": req.model_dump(),
        "results": calc_results.model_dump(),
        "updated_at": now_iso
    }

    # Persist strictly under 'financial_journey' field without altering other user attributes
    users_col.update_one(
        {"user_id": user_id},
        {"$set": {
            "financial_journey": record,
            "financial_journey_updated_at": now_iso
        }}
    )

    return {
        "status": "success",
        "message": "Financial journey saved successfully.",
        "user_id": user_id,
        "financial_journey": record
    }
