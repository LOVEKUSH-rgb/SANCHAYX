import re
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.database import get_schemes_collection
from app.schemas import SchemeSchema
from app.services.scheme_search import search_schemes

router = APIRouter(prefix="/schemes", tags=["Schemes & Catalog"])

MASTER_CATEGORIES = [
    {"id": "ALL", "num": "00", "name": "All Schemes", "description": "Complete verified Indian sovereign schemes catalogue"},
    {"id": "SAVINGS", "num": "01", "name": "Savings & Investment", "description": "Sovereign fixed deposits, certificates, and growth accounts"},
    {"id": "PENSION", "num": "02", "name": "Pension & Retirement", "description": "Guaranteed lifelong regular income post age 60"},
    {"id": "INSURANCE", "num": "03", "name": "Protection & Insurance", "description": "Statutory term, life, and accident coverage backed by LIC & GOI"},
    {"id": "EDUCATION", "num": "04", "name": "Education & Scholarships", "description": "Child education corpus and central sector scholarships"},
    {"id": "WOMEN", "num": "05", "name": "Women & Girls", "description": "Tailored savings, maternal grants, and female empowerment programs"},
    {"id": "AGRICULTURE", "num": "06", "name": "Farmers & Agriculture", "description": "Direct income support, crop insurance, and Kisan credit"},
    {"id": "HEALTH", "num": "07", "name": "Healthcare & Wellness", "description": "Sovereign health assurance and affordable medical coverage"},
    {"id": "HOUSING", "num": "08", "name": "Housing & Urban Development", "description": "Interest subsidies and pucca house ownership schemes"},
    {"id": "BUSINESS", "num": "09", "name": "Business & MSME", "description": "Collateral-free credit and micro-enterprise development"},
    {"id": "SOCIAL_SECURITY", "num": "10", "name": "Social Security", "description": "Old age, disability, and unorganised sector safety nets"},
    {"id": "EMPLOYMENT", "num": "11", "name": "Employment & Skills", "description": "Skill certification, apprenticeship, and rural livelihoods"},
    {"id": "FINANCIAL_INCLUSION", "num": "12", "name": "Financial Inclusion", "description": "Basic banking, RuPay cards, and digital security for all"}
]


@router.get("", response_model=List[Dict[str, Any]])
def get_all_schemes(
    category: Optional[str] = Query(None, description="Filter by category (SAVINGS, PENSION, INSURANCE, etc.)"),
    search: Optional[str] = Query(None, description="Search query across name, description, benefits, keywords"),
    goal: Optional[str] = Query(None, description="Filter by goal"),
    state: Optional[str] = Query(None, description="Filter by state"),
    verified: Optional[bool] = Query(None, description="Filter by verification status"),
    page: int = Query(1, ge=1),
    limit: int = Query(300, ge=1, le=1000)
):
    results, _ = search_schemes(
        category=category,
        search=search,
        goal=goal,
        state=state,
        verified=verified,
        active_only=True,
        page=page,
        page_size=limit
    )

    # Standardize output for frontend consumption
    clean_list = []
    for s in results:
        name_obj = s.get("name", {})
        name_en = name_obj.get("en", str(name_obj)) if isinstance(name_obj, dict) else str(name_obj)
        name_hi = name_obj.get("hi") if isinstance(name_obj, dict) else None
        
        fin = s.get("financial", {}) if isinstance(s.get("financial"), dict) else {}
        ben = s.get("benefits", {}) if isinstance(s.get("benefits"), dict) else {}
        ver = s.get("verification", {}) if isinstance(s.get("verification"), dict) else {}
        ownership = s.get("ownership", {}) if isinstance(s.get("ownership"), dict) else {}
        elig = s.get("eligibility", {}) if isinstance(s.get("eligibility"), dict) else {}

        desc = s.get("description") or ben.get("summary") or s.get("short_description") or f"Government of India verified {s.get('category')} scheme."
        authority_val = ownership.get("authority") or s.get("authority") or ownership.get("ministry") or "Government of India"
        raw_url = str(s.get("official_url") or ver.get("official_url") or "https://india.gov.in")
        if "wcd.nic.in/bbbp-schemes" in raw_url:
            official_url_val = "https://wcd.nic.in"
        elif "pmkmy.gov.in/schemes" in raw_url:
            official_url_val = "https://pmkmy.gov.in"
        elif not raw_url.startswith("http"):
            official_url_val = f"https://{raw_url}"
        else:
            official_url_val = raw_url

        last_verified_val = s.get("last_verified_date") or ver.get("last_verified") or "2026-08-29"
        image_val = s.get("image")

        interest_display = fin.get("interest_rate") or ben.get("amount") or ben.get("interest_rate") or (f"₹{ben.get('monthly_pension_after_60'):,}/mo Pension" if ben.get("monthly_pension_after_60") else None) or "Statutory Defined Benefit"

        clean_list.append({
            "scheme_id": s.get("scheme_id", s.get("id")),
            "id": s.get("scheme_id", s.get("id")),
            "name": name_en,
            "name_en": name_en,
            "name_hi": name_hi,
            "short_name": s.get("short_name") or name_en,
            "category": s.get("category"),
            "sub_category": s.get("sub_category"),
            "scheme_type": s.get("scheme_type"),
            "description": desc,
            "short_description": desc,
            "full_description": desc,
            "target_users": s.get("target_users") or s.get("target_groups") or s.get("life_stages", []),
            "target_groups": s.get("target_groups") or s.get("target_users", []),
            "life_stages": s.get("life_stages", []),
            "goals": s.get("goals", []),
            "tags": s.get("tags", []),
            "authority": authority_val,
            "ministry": ownership.get("ministry") or authority_val,
            "department": ownership.get("department"),
            "official_url": official_url_val,
            "officialSourceUrl": official_url_val,
            "verified": s.get("verified", True),
            "verification_status": str(s.get("verification_status") or ver.get("status") or "verified").lower(),
            "last_verified_date": last_verified_val,
            "lastVerifiedDate": last_verified_val,
            "image": image_val,
            "benefits": {
                "type": ben.get("type", "Statutory Benefit"),
                "summary": ben.get("summary") or desc,
                "interest_rate": interest_display,
                "amount": ben.get("amount") or interest_display,
                "tax_benefit": ben.get("tax_benefit") or s.get("tax_treatment")
            },
            "financial": {
                "contribution_required": fin.get("contribution_required", False),
                "loan": fin.get("loan", False),
                "pension": fin.get("pension", False),
                "insurance": fin.get("insurance", False),
                "minimum_contribution": fin.get("minimum_contribution") or 0,
                "maximum_contribution": fin.get("maximum_contribution"),
                "contribution_frequency": fin.get("contribution_frequency"),
                "lock_in": str(s.get("lock_in") or fin.get("lock_in") or "None"),
                "lock_in_years": fin.get("lock_in_years") or 0,
                "maturity": fin.get("maturity"),
                "tax_treatment": str(s.get("tax_treatment") or ben.get("tax_benefit") or "Statutory Provisions")
            },
            "eligibility": elig,
            "liquidity": s.get("liquidity") or {"level": "medium", "withdrawal_rules": str(s.get("withdrawal_rules") or "")},
            "raw": s
        })

    return clean_list


@router.get("/categories")
def get_categories():
    """
    Returns dynamically computed category metadata with scheme counts from the master database.
    """
    col = get_schemes_collection()
    categories_with_counts = []
    
    from app.services.scheme_search import CATEGORY_ALIASES

    for cat in MASTER_CATEGORIES:
        if cat["id"] == "ALL":
            count = col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
        else:
            matching_cats = CATEGORY_ALIASES.get(cat["id"], [cat["id"]])
            cat_clauses = [{"category": {"$regex": f"^{re.escape(c)}$", "$options": "i"}} for c in matching_cats]
            count = col.count_documents({
                "$or": [{"status.active": True}, {"active": True}],
                "$and": [{"$or": cat_clauses}]
            })
        categories_with_counts.append({
            **cat,
            "count": count
        })

    return categories_with_counts


@router.get("/count")
def get_schemes_count():
    """
    Returns actual dynamic number of records in the database.
    """
    col = get_schemes_collection()
    total = col.count_documents({})
    active = col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
    verified = col.count_documents({
        "$or": [{"verification.status": "VERIFIED"}, {"verified": True}, {"verification_status": "verified"}]
    })
    return {
        "count": total,
        "total": total,
        "total_schemes": total,
        "active": active,
        "active_schemes": active,
        "verified": verified,
        "verified_schemes": verified
    }


@router.get("/stats")
def get_schemes_stats():
    """
    Returns master database catalog statistics with dynamic counts.
    """
    col = get_schemes_collection()
    total = col.count_documents({})
    active = col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
    verified = col.count_documents({
        "$or": [{"verification.status": "VERIFIED"}, {"verified": True}, {"verification_status": "verified"}]
    })
    try:
        categories = col.distinct("category")
    except Exception:
        categories = [c["id"] for c in MASTER_CATEGORIES if c["id"] != "ALL"]

    return {
        "total_schemes": total,
        "active_schemes": active,
        "total_active_schemes": active,
        "verified_schemes": verified,
        "total_verified_schemes": verified,
        "categories_count": len(categories),
        "categories": categories,
        "master_categories": MASTER_CATEGORIES,
        "last_updated": "2026-08-29"
    }


@router.get("/{scheme_id}")
def get_scheme_by_id(scheme_id: str):
    col = get_schemes_collection()
    s = col.find_one({"$or": [{"scheme_id": scheme_id}, {"id": scheme_id}, {"short_name": scheme_id}]})
    if not s:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found in master database.")

    name_obj = s.get("name", {})
    name_en = name_obj.get("en", str(name_obj)) if isinstance(name_obj, dict) else str(name_obj)
    name_hi = name_obj.get("hi") if isinstance(name_obj, dict) else None

    fin = s.get("financial", {}) if isinstance(s.get("financial"), dict) else {}
    ben = s.get("benefits", {}) if isinstance(s.get("benefits"), dict) else {}
    ver = s.get("verification", {}) if isinstance(s.get("verification"), dict) else {}
    ownership = s.get("ownership", {}) if isinstance(s.get("ownership"), dict) else {}
    elig = s.get("eligibility", {}) if isinstance(s.get("eligibility"), dict) else {}

    desc = s.get("description") or ben.get("summary") or s.get("short_description") or f"Government of India verified {s.get('category')} scheme."
    authority_val = s.get("authority") or ver.get("source_authority") or ownership.get("ministry") or "Government of India"
    official_url_val = s.get("official_url") or ver.get("official_url") or "https://india.gov.in"
    last_verified_val = s.get("last_verified_date") or ver.get("last_verified") or "2026-08-29"
    image_val = s.get("image")

    interest_display = fin.get("interest_rate") or ben.get("amount") or ben.get("interest_rate") or (f"₹{ben.get('monthly_pension_after_60'):,}/mo Pension" if ben.get("monthly_pension_after_60") else None) or "Statutory Defined Benefit"

    return {
        "scheme_id": s.get("scheme_id", s.get("id")),
        "id": s.get("scheme_id", s.get("id")),
        "name": name_en,
        "name_en": name_en,
        "name_hi": name_hi,
        "short_name": s.get("short_name") or name_en,
        "category": s.get("category"),
        "sub_category": s.get("sub_category"),
        "scheme_type": s.get("scheme_type"),
        "description": desc,
        "short_description": desc,
        "full_description": desc,
        "target_users": s.get("target_users") or s.get("target_groups") or s.get("life_stages", []),
        "target_groups": s.get("target_groups") or s.get("target_users", []),
        "life_stages": s.get("life_stages", []),
        "goals": s.get("goals", []),
        "tags": s.get("tags", []),
        "authority": authority_val,
        "ministry": ownership.get("ministry") or authority_val,
        "department": ownership.get("department"),
        "state": ownership.get("state"),
        "official_url": official_url_val,
        "officialSourceUrl": official_url_val,
        "verified": s.get("verified", True),
        "verification_status": str(s.get("verification_status") or ver.get("status") or "verified").lower(),
        "last_verified_date": last_verified_val,
        "lastVerifiedDate": last_verified_val,
        "image": image_val,
        "benefits": {
            "type": ben.get("type", "Statutory Benefit"),
            "summary": ben.get("summary") or desc,
            "interest_rate": interest_display,
            "amount": ben.get("amount") or interest_display,
            "tax_benefit": ben.get("tax_benefit") or s.get("tax_treatment")
        },
        "financial": {
            "contribution_required": fin.get("contribution_required", False),
            "loan": fin.get("loan", False),
            "pension": fin.get("pension", False),
            "insurance": fin.get("insurance", False),
            "minimum_contribution": fin.get("minimum_contribution") or 0,
            "maximum_contribution": fin.get("maximum_contribution"),
            "contribution_frequency": fin.get("contribution_frequency"),
            "lock_in": str(s.get("lock_in") or fin.get("lock_in") or "None"),
            "lock_in_years": fin.get("lock_in_years") or 0,
            "maturity": fin.get("maturity"),
            "tax_treatment": str(s.get("tax_treatment") or ben.get("tax_benefit") or "Statutory Provisions")
        },
        "eligibility": elig,
        "liquidity": s.get("liquidity") or {"level": "medium", "withdrawal_rules": str(s.get("withdrawal_rules") or "")},
        "raw": s
    }
