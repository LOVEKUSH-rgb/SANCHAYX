import re
from typing import Dict, Any, List, Optional, Tuple
from app.database import get_schemes_collection


CATEGORY_ALIASES = {
    "SAVINGS": ["SAVINGS", "SAVINGS & INVESTMENT", "SAVINGS & GROWTH"],
    "PENSION": ["PENSION", "PENSION & RETIREMENT", "RETIREMENT"],
    "INSURANCE": ["INSURANCE", "PROTECTION", "PROTECTION & INSURANCE", "LIFE INSURANCE", "ACCIDENT INSURANCE"],
    "PROTECTION": ["INSURANCE", "PROTECTION", "PROTECTION & INSURANCE", "LIFE INSURANCE", "ACCIDENT INSURANCE"],
    "EDUCATION": ["EDUCATION", "EDUCATION & SCHOLARSHIPS"],
    "WOMEN": ["WOMEN", "WOMEN & GIRLS", "WOMEN & CHILD"],
    "AGRICULTURE": ["AGRICULTURE", "FARMERS", "FARMERS & AGRICULTURE", "FARMERS & AGRI"],
    "FARMERS": ["AGRICULTURE", "FARMERS", "FARMERS & AGRICULTURE", "FARMERS & AGRI"],
    "HEALTH": ["HEALTH", "HEALTHCARE", "HEALTHCARE & WELLNESS"],
    "HOUSING": ["HOUSING", "HOUSING & URBAN DEVELOPMENT"],
    "EMPLOYMENT": ["EMPLOYMENT", "EMPLOYMENT & SKILL", "EMPLOYMENT & SKILLS"],
    "EMPLOYMENT & SKILL": ["EMPLOYMENT", "EMPLOYMENT & SKILL", "EMPLOYMENT & SKILLS"],
    "SOCIAL_SECURITY": ["SOCIAL_SECURITY", "SOCIAL SECURITY", "SOCIAL WELFARE"],
    "SOCIAL SECURITY": ["SOCIAL_SECURITY", "SOCIAL SECURITY", "SOCIAL WELFARE"],
    "BUSINESS": ["BUSINESS", "BUSINESS & MSME", "MSME", "SELF EMPLOYMENT"],
    "BUSINESS & MSME": ["BUSINESS", "BUSINESS & MSME", "MSME", "SELF EMPLOYMENT"],
    "FINANCIAL_INCLUSION": ["FINANCIAL_INCLUSION", "FINANCIAL INCLUSION", "BANKING ACCESS"],
    "FINANCIAL INCLUSION": ["FINANCIAL_INCLUSION", "FINANCIAL INCLUSION", "BANKING ACCESS"]
}

GOAL_ALIASES = {
    "EDUCATION": ["education", "child_education", "higher_education", "girl_child"],
    "RETIREMENT": ["retirement", "pension", "old_age_support"],
    "EMERGENCY": ["emergency", "emergency_support", "short_term_savings"],
    "TAX": ["tax", "tax_saving", "long_term_savings"],
    "MARRIAGE": ["marriage", "girl_child", "women_empowerment"],
    "WEALTH": ["wealth", "long_term_savings", "short_term_savings", "monthly_income"],
    "FARMING": ["farming", "farmer_support", "crop_protection"],
    "HEALTH": ["health", "healthcare"],
    "HOUSING": ["housing", "home_construction", "home_purchase"],
    "BUSINESS": ["business", "self_employment", "livelihood_support"]
}


def search_schemes(
    category: Optional[str] = None,
    search: Optional[str] = None,
    goal: Optional[str] = None,
    life_stage: Optional[str] = None,
    state: Optional[str] = None,
    verified: Optional[bool] = None,
    active_only: bool = True,
    page: int = 1,
    page_size: int = 50
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Performs multi-field search and filtering across the master schemes collection.
    Searches name.en, name.hi, short_name, search.keywords, category, goals, ministry, state.
    """
    col = get_schemes_collection()
    and_conditions = []

    if active_only:
        and_conditions.append({
            "$or": [{"status.active": True}, {"active": True}]
        })

    if verified is not None:
        if verified:
            and_conditions.append({
                "$or": [
                    {"verification.status": "VERIFIED"},
                    {"verification_status": "verified"},
                    {"verified": True}
                ]
            })

    # Category filtering
    if category and category.upper() != "ALL" and category.lower() != "all":
        cat_key = category.upper().strip()
        matching_cats = CATEGORY_ALIASES.get(cat_key, [cat_key])
        cat_clauses = [{"category": {"$regex": f"^{re.escape(c)}$", "$options": "i"}} for c in matching_cats]
        if len(cat_clauses) == 1:
            and_conditions.append(cat_clauses[0])
        else:
            and_conditions.append({"$or": cat_clauses})

    # Goal filtering
    if goal and goal.lower() != "all":
        goal_key = goal.upper().strip()
        matching_goals = GOAL_ALIASES.get(goal_key, [goal.lower().strip(), goal.upper().strip()])
        and_conditions.append({
            "goals": {"$in": matching_goals}
        })

    # State filtering
    if state and state.lower() != "all":
        state_clean = state.strip()
        and_conditions.append({
            "$or": [
                {"ownership.state": state_clean},
                {"ownership.state": None},
                {"ownership.level": "central"}
            ]
        })

    # Free-text Search across English, Hindi, Marathi, Bengali, Telugu, keywords, category, goals, ministry, state, benefits, occupation, eligibility
    if search and search.strip():
        s = search.strip()
        regex_pattern = {"$regex": re.escape(s), "$options": "i"}
        search_clauses = [
            {"name.en": regex_pattern},
            {"name.hi": regex_pattern},
            {"name.mr": regex_pattern},
            {"name.bn": regex_pattern},
            {"name.te": regex_pattern},
            {"name": regex_pattern},
            {"short_name": regex_pattern},
            {"search.keywords": regex_pattern},
            {"category": regex_pattern},
            {"sub_category": regex_pattern},
            {"scheme_type": regex_pattern},
            {"goals": regex_pattern},
            {"tags": regex_pattern},
            {"life_stages": regex_pattern},
            {"ownership.ministry": regex_pattern},
            {"ownership.department": regex_pattern},
            {"ownership.state": regex_pattern},
            {"authority": regex_pattern},
            {"verification.source_authority": regex_pattern},
            {"benefits.summary": regex_pattern},
            {"benefits.amount": regex_pattern},
            {"benefits.tax_benefit": regex_pattern},
            {"description": regex_pattern},
            {"short_description": regex_pattern},
            {"full_description": regex_pattern},
            {"target_groups": regex_pattern},
            {"target_users": regex_pattern},
            {"eligibility.occupation": regex_pattern},
            {"eligibility.special_conditions": regex_pattern},
            {"eligibility.residency": regex_pattern}
        ]
        and_conditions.append({"$or": search_clauses})

    if len(and_conditions) == 1:
        query = and_conditions[0]
    elif len(and_conditions) > 1:
        query = {"$and": and_conditions}
    else:
        query = {}

    total = col.count_documents(query)
    skip = max(0, (page - 1) * page_size)
    cursor = col.find(query).skip(skip).limit(page_size)
    results = list(cursor)

    return results, total
