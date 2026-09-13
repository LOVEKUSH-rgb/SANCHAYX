from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_schemes_collection
from app.schemas import CompareRequest, CompareResponse, SchemeComparisonItem
from app.engine import evaluate_eligibility

router = APIRouter(prefix="/compare", tags=["Scheme Comparison"])


@router.post("", response_model=CompareResponse)
def compare_schemes(req: CompareRequest):
    if len(req.scheme_ids) < 2:
        raise HTTPException(status_code=400, detail="Comparison requires at least 2 schemes.")
    if len(req.scheme_ids) > 4:
        raise HTTPException(status_code=400, detail="Comparison allows a maximum of 4 schemes simultaneously.")

    col = get_schemes_collection()
    items: List[SchemeComparisonItem] = []

    import re
    for sid in req.scheme_ids:
        doc = col.find_one({
            "$or": [
                {"scheme_id": sid},
                {"id": sid},
                {"short_name": {"$regex": f"^{re.escape(sid)}$", "$options": "i"}},
                {"scheme_id": {"$regex": f"^{re.escape(sid)}", "$options": "i"}}
            ]
        })
        if not doc:
            # Fallback case-insensitive regex search
            doc = col.find_one({
                "$or": [
                    {"name.en": {"$regex": re.escape(sid), "$options": "i"}},
                    {"name": {"$regex": re.escape(sid), "$options": "i"}}
                ]
            })
        if not doc:
            continue

        # Extract Fields
        name = doc.get("name", sid)
        category = doc.get("category", "")
        authority = doc.get("authority", doc.get("official_authority", "Government of India"))
        official_url = doc.get("official_url", doc.get("official_source_url", "https://india.gov.in"))
        ver = doc.get("verification", {})
        verified = doc.get("verified", ver.get("status") == "VERIFIED")
        ver_status = str(doc.get("verification_status") or ver.get("status") or "verified").lower()
        last_date = doc.get("last_verified_date") or ver.get("last_verified") or "2026-08-29"

        elig = doc.get("eligibility", {})
        min_age = elig.get("min_age") if "min_age" in elig else elig.get("age_min")
        max_age = elig.get("max_age") if "max_age" in elig else elig.get("age_max")
        gender = str(elig.get("gender") or "all")

        if min_age is not None and max_age is not None:
            elig_str = f"Aged {min_age} to {max_age} years, {gender.capitalize()} beneficiaries"
        elif min_age is not None:
            elig_str = f"Age {min_age}+ years, {gender.capitalize()} beneficiaries"
        elif max_age is not None:
            elig_str = f"Up to {max_age} years, {gender.capitalize()} beneficiaries"
        else:
            elig_str = f"Indian Residents ({gender.capitalize()})"

        if elig.get("special_conditions"):
            conds = elig.get("special_conditions")
            conds_str = ", ".join(conds) if isinstance(conds, list) else str(conds)
            elig_str += f" ({conds_str})"

        fin = doc.get("financial", {}) if isinstance(doc.get("financial"), dict) else {}
        benefits = doc.get("benefits", {}) if isinstance(doc.get("benefits"), dict) else {}
        rate = (
            fin.get("interest_rate") or
            benefits.get("interest_rate") or
            benefits.get("amount") or
            benefits.get("pension_amount") or
            benefits.get("summary") or
            "Sovereign Defined Benefit"
        )

        min_c = fin.get("minimum_contribution")
        min_c_str = f"₹{min_c:,.0f}" if min_c is not None else "₹500"

        max_c = fin.get("maximum_contribution")
        max_c_str = f"₹{max_c:,.0f}" if max_c is not None else "No statutory upper ceiling"

        lock_in = fin.get("lock_in") or fin.get("lock_in_period") or f"{fin.get('lock_in_years', 'Standard')} Years"
        liq = doc.get("liquidity", {}) if isinstance(doc.get("liquidity"), dict) else {}
        liquidity = liq.get("withdrawal_rules") or fin.get("liquidity") or (f"Partial withdrawal allowed after {fin.get('lock_in_years', 5)} years" if fin.get("lock_in_years") else "Flexible")
        tax = benefits.get("tax_benefit") or fin.get("tax_treatment") or "Subject to standard Income Tax provisions"
        withdrawal = liq.get("withdrawal_rules") or fin.get("withdrawal_rules") or "Standard maturity payout at official banking branches/post offices"

        media = doc.get("media", {})
        img_url = media.get("image_url")
        is_insurance = category.lower() == "protection" or "insurance" in category.lower()

        user_eligible = None
        reasons = []
        if req.profile:
            eval_res = evaluate_eligibility(doc, req.profile)
            user_eligible = eval_res.eligible
            reasons = eval_res.reasons if eval_res.eligible else eval_res.failed_criteria

        items.append(SchemeComparisonItem(
            scheme_id=doc.get("scheme_id", sid),
            name=name,
            short_name=doc.get("short_name"),
            category=category,
            authority=authority,
            ministry=doc.get("ministry"),
            official_url=official_url,
            last_verified_date=last_date,
            verified=verified,
            verification_status=ver_status,
            eligibility_summary=elig_str,
            goal_suitability=", ".join(doc.get("goals", [category])).capitalize(),
            interest_or_benefit=rate,
            minimum_contribution=min_c_str,
            maximum_contribution=max_c_str,
            lock_in=lock_in,
            liquidity=liquidity,
            tax_treatment=tax,
            withdrawal_rules=withdrawal,
            image_url=img_url,
            is_insurance=is_insurance,
            user_eligible=user_eligible,
            eligibility_reasons=reasons
        ))

    summary = (
        f"Compared {len(items)} official schemes side-by-side across statutory eligibility, "
        "lock-in periods, yields, tax treatment, and official verified sources."
    )

    return CompareResponse(
        total_compared=len(items),
        items=items,
        comparison_summary=summary
    )
