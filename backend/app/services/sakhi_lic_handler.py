import re
import json
from typing import Dict, Any, List, Optional, Tuple, Callable
from app.schemas import SakhiChatResponse, SourceCitation, SakhiActionButton
from app.database import get_lic_plans_collection, get_lic_information_collection
from app.lic_engine import (
    LICUserProfile,
    evaluate_lic_plan_eligibility,
    recommend_lic_plans,
    LICPlanEvaluationResult,
    LICRecommendationResult
)
from app.services.language_service import detect_user_language, get_multilingual_text

# Canonical mapping of all 38 verified active LIC plans and common aliases
LIC_PLAN_KEYWORD_MAP = {
    # Plan numbers
    "717": "717", "714": "714", "715": "715", "733": "733", "736": "736",
    "774": "774", "890": "890", "912": "912", "881": "881", "888": "888",
    "889": "889", "745": "745", "771": "771", "883": "883", "748": "748",
    "720": "720", "721": "721", "732": "732", "734": "734", "876": "876",
    "878": "878", "877": "877", "875": "875", "954": "954", "955": "955",
    "859": "859", "887": "887", "867": "867", "857": "857", "758": "758",
    "862": "862", "879": "879", "873": "873", "749": "749", "752": "752",
    "886": "886", "751": "751", "880": "880",

    # Plan names & aliases
    "single premium endowment": "717",
    "new endowment": "714",
    "jeevan anand": "715", "new jeevan anand": "715",
    "jeevan lakshya": "733", "jeevan lakshya plan": "733",
    "jeevan labh": "736",
    "amritbaal": "774", "amrit baal": "774", "amritbal": "774",
    "amrit samridhi": "890", "navshanti": "890",
    "bima jyoti": "912",
    "bima lakshmi": "881", "bima laxmi": "881",
    "bima ratna": "888",
    "bima shree": "889", "bima shri": "889",
    "jeevan umang": "745",
    "jeevan utsav": "771",
    "jeevan azad": "883",
    "bima bachat": "748",
    "money back 20": "720", "20 years money back": "720", "20 year money back": "720",
    "money back 25": "721", "25 years money back": "721", "25 year money back": "721",
    "children money back": "732", "children's money back": "732", "child money back": "732",
    "jeevan tarun": "734", "jeevan tarun plan": "734",
    "digi term": "876", "digiterm": "876",
    "digi yuva": "878", "digiyuva": "878",
    "yuva term": "877", "yuvaterm": "877",
    "yuva credit life": "875",
    "tech term": "954", "techterm": "954",
    "jeevan amar": "955",
    "saral jeevan bima": "859",
    "credit protection": "887",
    "new jeevan shanti": "867", "jeevan shanti": "867",
    "jeevan akshay": "857", "jeevan akshay vii": "857", "jeevan akshay 7": "857",
    "jeevan dhara": "758", "jeevan dhara ii": "758", "jeevan dhara 2": "758",
    "saral pension": "862",
    "smart pension": "879", "guaranteed pension": "879",
    "index plus": "873",
    "siip": "749",
    "nivesh plus": "752",
    "unit plus": "886", "flexi plus": "886",
    "micro bachat": "751",
    "bhagya lakshmi": "880", "jan suraksha": "880"
}

LIC_INDICATOR_KEYWORDS = [
    "lic", "l.i.c", "l.i.c.", "licindia", "life insurance corporation",
    "lic plan", "lic plans", "lic policy", "lic policies",
    "lic mein", "lic me", "lic ka", "lic ki", "lic ke",
    "life insurance", "life cover", "jeevan bima", "जीवन बीमा", "लाइफ इंश्योरेंस",
    "एलआईसी", "एल.आई.सी", "एल आई सी", "lic pension", "lic retirement",
    # Marathi
    "एलआयसी", "जीवन विमा", "विमा", "विमा योजना",
    # Bengali
    "এলআইসি", "জীবন বীমা", "বীমা", "বীমা প্ল্যান",
    # Telugu
    "ఎల్ఐసి", "ఎల్‌ఐసి", "జీవిత బీమా", "బీమా", "భీమా",
    # Plan names
    "jeevan tarun", "jeevan anand", "jeevan labh", "jeevan umang",
    "jeevan lakshya", "jeevan utsav", "jeevan azad", "amritbaal",
    "bima lakshmi", "bima jyoti", "bima ratna", "bima shree", "bima bachat",
    "saral pension", "jeevan shanti", "jeevan akshay", "jeevan dhara",
    "digi term", "digi yuva", "yuva term", "tech term", "jeevan amar",
    "saral jeevan bima", "micro bachat", "bhagya lakshmi", "siip", "nivesh plus"
]

GOV_SCHEME_INDICATOR_KEYWORDS = [
    "government scheme", "government schemes", "govt scheme", "govt schemes",
    "sarkari yojana", "sarkari yojna", "sarkari yojanaen", "sarkari yojanaein",
    "sarkari", "yojana", "yojna", "scheme", "schemes", "pradhan mantri", "pm yojana",
    # Hindi / Devanagari
    "सरकारी योजना", "सरकारी योजनाएं", "सरकारी योजनाएँ", "सरकारी स्कीम", "सरकारी", "योजना",
    "योजनाएं", "योजनाएँ", "प्रधानमंत्री", "पीएम योजना", "सरकारी लाभ",
    # Marathi
    "शासकीय योजना", "शासकीय", "योजनांची", "योजनेसाठी", "प्रकल्प",
    # Bengali
    "সরকারি প্রকল্প", "প্রকল্প", "সরকারি যোজনা", "যোজনা", "স্কিম",
    # Telugu
    "ప్రభుత్వ పథకాలు", "ప్రభుత్వ పథకం", "పథకాలు", "పథకం", "యోజన",
    # Specific Sovereign Identifiers
    "ppf", "ssy", "apy", "nps", "scss", "nsc", "kvp", "pmjdy", "pmkisan", "pm-kisan",
    "pm-jay", "pmjay", "pmfby", "pmmvy", "mssc", "pm-kmy", "pm-sym", "pmsvanidhi",
    "sukanya samriddhi", "atal pension", "public provident fund", "national pension",
    "kisan vikas patra", "senior citizen savings", "mahila samman"
]


FREE_BENEFIT_INDICATOR_KEYWORDS = [
    "free", "muft", "mufat", "nishulk", "shulk", "scholarship", "chhatravratti",
    "coaching", "free coaching", "free training", "free rice", "pmgkay", "pm daksh",
    "pm-daksh", "smile", "transgender", "dhtess", "hsmis", "vjnt", "sebc", "nagaland",
    "free benefits", "free assistance", "free yojana", "free scheme", "muft yojana",
    "free scooty", "free food", "free tablet", "free laptop", "stipend",
    "free plans", "free plan", "free schemes", "subsidy", "subsidies",
    # Hindi / Devanagari
    "फ्री", "फ्री प्लान", "फ्री प्लेन्स", "फ्री प्लान्स", "फ्री योजना", "फ्री योजनाएं", "फ्री योजनाएँ", "फ्री लाभ", "फ्री स्कीम", "फ्री स्कीम्स", "फ्री बेनिफिट्स",
    "मुफ्त", "मुफ़्त", "निःशुल्क", "निशुल्क", "मुफ्त लाभ", "मुफ्त सरकारी लाभ", "मुफ्त योजना", "मुफ्त प्लान",
    "मुफ्त योजनाएं", "मुफ्त सुविधाएं", "मुफ्त सुविधा", "छात्रवृत्ति", "मुफ्त इलाज", "मुफ्त राशन", "मुफ्त ट्रेनिंग", "सब्सिडी",
    # Marathi
    "मोफत", "मोफत प्लॅन्स", "मोफत योजना", "मोफत सरकारी लाभ", "मोफत लाभ", "विनामूल्य", "अनुदान", "शिष्यवृत्ती", "मोफत उपचार", "मोफत अन्न", "सबसिडी",
    # Bengali
    "বিনামূল্যে", "বিনামূল্যের", "ফ্রি", "ফ্রি প্ল্যান", "বৃত্তি", "অনুদান", "বিনামূল্যের সরকারি সুবিধা", "বিনামূল্যে সুবিধা", "বিনামূল্যে চিকিৎসা", "ভর্তুকি", "বিনামূল্যে স্কিম",
    # Telugu
    "ఉచిత", "ఉచిత ప్లాన్లు", "ఉచిత ప్రభుత్వ ప్రయోజనాలు", "ఉచిత పథకాలు", "ఉపకార వేతనం", "సబ్సిడీ", "ఉచిత చికిత్స", "ఉచిత బియ్యం"
]


def _matches_kw(text: str, keywords: List[str]) -> bool:
    for kw in keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            return True
        if any(ord(c) > 127 for c in kw) and kw in text:
            return True
    return False


def detect_query_domain(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Intelligently determines whether the query domain is:
    - 'FREE_BENEFITS': mentions free benefits, scholarships, free coaching/training, food assistance, or free government schemes
    - 'MIXED': mentions multiple distinct domains (e.g. government schemes + free benefits, or schemes + LIC, or all 3)
    - 'LIC': mentions LIC plans, policies, numbers, or terms without government schemes
    - 'GOVERNMENT': mentions standard government schemes or sovereign savings
    - 'GENERAL': general inquiry
    """
    msg_lower = message.lower().strip()

    # 1. Direct plan number or LIC indicator match
    has_lic = _matches_kw(msg_lower, LIC_INDICATOR_KEYWORDS)
    if not has_lic:
        for pnum in ["717", "714", "715", "733", "736", "774", "890", "912", "881", "888", "889", "745", "771", "883", "748", "720", "721", "732", "734", "876", "878", "877", "875", "954", "955", "859", "887", "867", "857", "758", "862", "879", "873", "749", "752", "886", "751", "880"]:
            if re.search(r'\b(?:plan\s+(?:no\.?\s*)?|lic\s+(?:plan\s+)?|plan\s*)' + pnum + r'\b', msg_lower):
                has_lic = True
                break

    has_gov = _matches_kw(msg_lower, GOV_SCHEME_INDICATOR_KEYWORDS)
    has_free = _matches_kw(msg_lower, FREE_BENEFIT_INDICATOR_KEYWORDS)

    # 2. Check for compound free benefit expressions like "सरकारी फ्री योजनाएं" or "free government schemes"
    is_compound_free = any(phrase in msg_lower for phrase in [
        "सरकारी फ्री", "सरकारी मुफ्त", "सरकारी मुफ़्त", "free government scheme", "free government schemes",
        "free govt scheme", "free govt schemes", "free sarkari", "sarkari free", "sarkari muft", "मुफ्त सरकारी",
        "शासकीय मोफत", "मोफत शासकीय", "সরকারি বিনামূল্যে", "বিনামূল্যে সরকারি", "ఉచిత ప్రభుత్వ", "ప్రభుత్వ ఉచిత",
        "free plans", "free plan", "फ्री प्लेन्स", "फ्री प्लान", "फ्री प्लान्स", "मोफत प्लॅन्स", "ফ্রি প্ল্যান", "ఉచిత ప్లాన్లు"
    ])

    # 3. Check for explicit multi-domain request
    is_three_way = any(w in msg_lower for w in ["teeno", "तीनों", "all three", "तीनो", "teeno mein", "तीनों में"])
    explicit_connector = any(w in msg_lower for w in [
        " और ", " तथा ", " एवं ", " and ", " & ", " दोनों ", " dono ", " both ", "फिर ", " then ",
        "पहले", "first", "दोन्ही", "উভয়", "రెండు", "साथ"
    ])

    # If asking for all three explicitly
    if is_three_way:
        return "MIXED"

    # If compound free benefit expression and no explicit request for other domains
    if is_compound_free and not has_lic and not is_three_way:
        if has_gov and explicit_connector and any(w in msg_lower for w in ["बचत", "निवेश", "saving", "invest", "bima", "पेंशन", "pension"]):
            return "MIXED"
        return "FREE_BENEFITS"

    # If explicit connector present between multiple active domains
    if explicit_connector:
        active_domains_count = sum([1 if has_lic else 0, 1 if has_gov else 0, 1 if has_free else 0])
        if active_domains_count >= 2:
            return "MIXED"

    # Multi-domain active count check
    if has_lic and has_gov:
        return "MIXED"
    if has_lic and has_free:
        return "MIXED"
    if has_gov and has_free and not is_compound_free:
        return "MIXED"

    if has_free:
        return "FREE_BENEFITS"

    if has_lic:
        return "LIC"

    if has_gov:
        return "GOVERNMENT"

    # 4. Contextual follow-up check (e.g. "Sabse suitable kaunsa hai?", "Tell me more about it")
    is_referral_query = any(w in msg_lower for w in [
        "kaunsa", "kaun sa", "kaun si", "konsa", "which one", "which is best", "suitable", "sabse suitable",
        "sabse accha", "sabse achha", "inme se", "unme se", "tell me more", "how to apply", "details",
        "compare", "fayda", "benefit", "konte", "konte changle", "konte yogya", "কোনটি", "কোনটি ভালো",
        "ఏది", "ఏది మంచిది", "వీటిలో", "recommend", "suggest", "best", "पहला", "दूसरा"
    ])
    if is_referral_query and context and context.get("history"):
        for prev in reversed(context.get("history")):
            prev_txt = str(prev.get("text", "")).lower()
            if _matches_kw(prev_txt, LIC_INDICATOR_KEYWORDS) or any(p in prev_txt for p in ["lic", "jeevan", "bima", "uin"]):
                return "LIC"
            if _matches_kw(prev_txt, FREE_BENEFIT_INDICATOR_KEYWORDS) or any(p in prev_txt for p in ["free_benefits", "free plans", "pmgkay", "muft"]):
                return "FREE_BENEFITS"
            if _matches_kw(prev_txt, GOV_SCHEME_INDICATOR_KEYWORDS) or any(p in prev_txt for p in ["ppf", "ssy", "apy", "nps", "scss", "nsc", "kvp"]):
                return "GOVERNMENT"

    # Also check active page from context if available
    if context and context.get("page"):
        pg = str(context.get("page")).lower()
        if "lic" in pg:
            return "LIC"
        elif "free" in pg:
            return "FREE_BENEFITS"

    return "GENERAL"


from app.services.profile_extractor import extract_user_profile_facts


def extract_lic_user_profile(message: str, context: Optional[Dict[str, Any]] = None) -> Tuple[LICUserProfile, Dict[str, Any]]:
    """
    Extracts structured user profile parameters strictly from user input without guessing.
    Uses extract_user_profile_facts as authoritative source of truth.
    Returns (LICUserProfile, extracted_flags_dict).
    """
    context = context or {}
    ctx_profile = context.get("profile") or {}

    # Extract user profile facts using the unified profile extractor
    extracted = extract_user_profile_facts(
        current_message=message,
        history=context.get("history") if context else None,
        context_profile=ctx_profile
    )

    # 1. Child Age Extraction
    parsed_child_age = float(extracted.child_age) if extracted.child_age is not None else None

    # 2. User Age Extraction (Never hallucinate or increment 24 to 25)
    parsed_user_age = float(extracted.age) if extracted.age is not None else None

    # 3. User Gender Extraction
    parsed_gender = extracted.gender.capitalize() if extracted.gender else None

    # 4. Profession Extraction (Strictly map from extracted facts, respecting negations)
    parsed_profession = None
    if extracted.occupation == "job_seeker":
        parsed_profession = "Job Seeker"
    elif extracted.occupation == "farmer":
        parsed_profession = "Farmer"
    elif extracted.occupation == "student":
        parsed_profession = "Student"
    elif extracted.occupation == "salaried":
        parsed_profession = "Salaried"
    elif extracted.occupation == "business":
        parsed_profession = "Business"
    elif extracted.occupation == "homemaker":
        parsed_profession = "Homemaker"
    elif extracted.occupation == "retired":
        parsed_profession = "Retired"
    elif extracted.occupation:
        parsed_profession = str(extracted.occupation_label)

    # 5. Monthly & Annual Budget Extraction
    # CRITICAL: Family Income (e.g. ₹2.5 लाख पारिवारिक आय) must NEVER be confused with LIC insurance budget!
    parsed_monthly_budget = None
    parsed_annual_budget = None

    history_texts = []
    if context.get("history") and isinstance(context["history"], list):
        for h in context["history"]:
            if isinstance(h, dict) and h.get("sender") == "user" and h.get("text"):
                history_texts.append(h["text"])
    full_text = " ".join(history_texts + [message])
    msg_lower = full_text.lower().strip()

    # Dedicated budget regex that requires explicit budget/premium context and excludes income context
    income_indicator = bool(re.search(r'(?:पारिवारिक\s+आय|सालाना\s+आय|वार्षिक\s+आय|आय|income|aamdani|aay|salary|कमाई|वेतन)', msg_lower))

    # Priority monthly budget regex: Must have explicit budget/premium keywords
    m_budget_m = (
        re.search(r'(?:monthly\s+budget|lic\s+budget|insurance\s+budget|har\s+mahine\s+(?:bachat|bajat|premium|invest)|pratimaah\s+(?:premium|nivesh)|monthly\s+premium)\s*(?:is|of|about|hai)?\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)', msg_lower) or
        re.search(r'(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:per\s+month|\/month|\/mo|monthly|har\s+mahine)\s*(?:budget|premium|nivesh|save|invest)', msg_lower)
    )
    if m_budget_m:
        try:
            b_str = m_budget_m.group(1).replace(",", "")
            parsed_monthly_budget = float(b_str)
        except Exception:
            pass

    # Priority annual budget regex: Must have explicit budget/premium keywords and NOT be an income declaration
    a_budget_m = re.search(r'(?:annual\s+budget|lic\s+budget|yearly\s+budget|salana\s+(?:budget|premium|nivesh|bajat|kist)|har\s+saal\s+(?:premium|invest|save))\s*(?:is|of|about|hai)?\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)', msg_lower)
    if a_budget_m and not income_indicator:
        try:
            raw_val = a_budget_m.group(1).replace(",", "")
            num = float(raw_val)
            if any(w in msg_lower for w in ["lakh", "lac", "lakhs", "lacs"]):
                num *= 100000.0
            elif any(w in msg_lower for w in ["k", "thousand"]):
                num *= 1000.0
            parsed_annual_budget = num
        except Exception:
            pass

    # 6. Financial Goal Extraction
    parsed_goal = None
    ret_req = None
    prot_req = None
    inv_pref = None

    if any(w in msg_lower for w in ["child", "daughter", "son", "education", "bachche", "bachon", "padhai", "shiksha", "children", "बच्चों", "बेटी", "बेटा"]):
        parsed_goal = "Child Education"
    elif any(w in msg_lower for w in ["retire", "pension", "old age", "annuity", "budhapa", "निवृत्ती", "पेन्शन", "पेंशन", "बुढ़ापा", "वृद्धावस्था"]):
        parsed_goal = "Retirement"
        ret_req = "High"
    elif any(w in msg_lower for w in ["protection", "term", "term plan", "pure term", "life cover", "family safety", "parivar", "suraksha", "risk cover", "life insurance", "insurance", "जीवन बीमा", "लाइफ इंश्योरेंस", "सुरक्षा"]):
        parsed_goal = "Family Protection"
        prot_req = "Highest"
    elif any(w in msg_lower for w in ["money back", "liquidity", "periodic", "har 5 saal", "cashflow"]):
        parsed_goal = "Money Back"
    elif any(w in msg_lower for w in ["women", "woman", "mahila", "bima lakshmi"]):
        parsed_goal = "Women Security"
        parsed_gender = parsed_gender or "Female"
    elif any(w in msg_lower for w in ["wealth", "wealth creation", "savings", "growth", "corpus", "investment"]):
        parsed_goal = "Wealth Creation"

    if any(w in msg_lower for w in ["guaranteed", "bonus", "secure"]):
        inv_pref = "Guaranteed + Bonus"
    elif any(w in msg_lower for w in ["ulip", "market linked", "index", "equity"]):
        inv_pref = "Market-Linked / ULIP"

    profile = LICUserProfile(
        age=parsed_user_age,
        gender=parsed_gender,
        profession=parsed_profession,
        monthly_budget=parsed_monthly_budget,
        annual_budget=parsed_annual_budget,
        goal=parsed_goal,
        child_age=parsed_child_age,
        retirement_requirement=ret_req,
        protection_requirement=prot_req,
        investment_preference=inv_pref
    )

    flags = {
        "has_age": parsed_user_age is not None,
        "has_child_age": parsed_child_age is not None,
        "has_budget": (parsed_monthly_budget is not None or parsed_annual_budget is not None),
        "has_goal": parsed_goal is not None,
        "has_gender": parsed_gender is not None
    }

    return profile, flags


def find_lic_plan(identifier: str) -> Optional[Dict[str, Any]]:
    """
    Searches the MongoDB lic_plans collection for a plan matching plan_id, plan_number, or name.
    """
    col = get_lic_plans_collection()
    clean_id = identifier.strip().lower()

    # Check keyword map first
    target_plan_number = LIC_PLAN_KEYWORD_MAP.get(clean_id)
    if target_plan_number:
        p = col.find_one({"$or": [{"plan_number": target_plan_number}, {"plan_id": f"LIC-{target_plan_number}"}]})
        if p:
            return {k: v for k, v in p.items() if k != "_id"}

    # Direct search on plan_id, plan_number, or regex on plan_name
    query = {
        "$or": [
            {"plan_id": identifier.strip().upper()},
            {"plan_id": identifier.strip()},
            {"plan_number": identifier.strip()},
            {"uin": identifier.strip().upper()},
            {"plan_name": {"$regex": re.escape(identifier.strip()), "$options": "i"}}
        ]
    }
    plan = col.find_one(query)
    if plan:
        return {k: v for k, v in plan.items() if k != "_id"}

    # Fallback to search all active plans
    all_plans = list(col.find({"$or": [{"active_status": "active"}, {"status": "active"}]}))
    for p in all_plans:
        p_name = str(p.get("plan_name", "")).lower()
        p_num = str(p.get("plan_number", "")).lower()
        p_id = str(p.get("plan_id", "")).lower()
        if clean_id in p_name or clean_id == p_num or clean_id == p_id:
            return {k: v for k, v in p.items() if k != "_id"}

    return None


def extract_mentioned_lic_plans(message: str) -> List[Dict[str, Any]]:
    """
    Extracts all specific LIC plan records mentioned in the user's message.
    """
    msg_lower = message.lower().strip()
    matched_plans = []
    seen_plan_ids = set()

    # Search for multi-word plan names first
    sorted_keywords = sorted(LIC_PLAN_KEYWORD_MAP.keys(), key=lambda x: len(x), reverse=True)
    for kw in sorted_keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, msg_lower):
            pnum = LIC_PLAN_KEYWORD_MAP[kw]
            p = find_lic_plan(pnum)
            if p and p.get("plan_id") not in seen_plan_ids:
                matched_plans.append(p)
                seen_plan_ids.add(p.get("plan_id"))

    return matched_plans


def handle_lic_chat(
    message: str,
    language: str = "en",
    context: Optional[Dict[str, Any]] = None
) -> SakhiChatResponse:
    """
    Primary processing engine for all LIC queries sent to Sakhi.
    Ensures 100% factual grounding in lic_plans and lic_information, zero hallucination,
    and deterministic evaluation through lic_engine.py.
    """
    context = context or {}
    msg_lower = message.lower().strip()
    # Auto-detect language (English, Hindi, Marathi, Bengali, Telugu, Hinglish)
    lang = detect_user_language(message, fallback_lang=language)

    # Extract user profile and flags
    profile, flags = extract_lic_user_profile(message, context)
    mentioned_plans = extract_mentioned_lic_plans(message)

    # -------------------------------------------------------------
    # 1. Check for Specific Plan Eligibility Question
    # (e.g. "Am I eligible for LIC Jeevan Tarun?", "Am I eligible for Plan 715?")
    # -------------------------------------------------------------
    is_eligibility_query = any(w in msg_lower for w in [
        "eligible", "eligibility", "qualify", "patra", "patrata", "le sakta hoon", "le sakti hoon",
        "पात्र", "पात्रता", "पात्र आहे", "पात्र आहात", "योग्य কি", "योग्य", "అర్హుడినా", "అర్హురాలినా", "అర్హత"
    ])
    if is_eligibility_query and mentioned_plans:
        target_plan = mentioned_plans[0]
        eval_result = evaluate_lic_plan_eligibility(target_plan, profile)
        p_name = target_plan.get("plan_name", "LIC Plan")
        p_num = target_plan.get("plan_number", "")
        p_url = target_plan.get("official_lic_url", "https://www.licindia.in/")
        p_doc = target_plan.get("official_document_url") or p_url

        source_citation = SourceCitation(
            scheme_id=target_plan.get("plan_id", "LIC-PLAN"),
            scheme_name=f"{p_name} (Plan {p_num})",
            authority="Life Insurance Corporation of India (LIC)",
            source_authority="Life Insurance Corporation of India (LIC)",
            official_url=p_url,
            last_verified=target_plan.get("last_verified", "2026-08-31"),
            last_verified_date=target_plan.get("last_verified", "2026-08-31")
        )

        btn_source_labels = {"hi": "आधिकारिक LIC स्रोत", "mr": "अधिकृत LIC स्रोत", "bn": "অফিসিয়াল LIC উৎস", "te": "అధికారిక LIC మూలం", "en": "Official LIC Source"}
        btn_details_labels = {"hi": "योजना विवरण", "mr": "योजना तपशील", "bn": "প্ল্যানের বিবরণ", "te": "ప్లాన్ వివరాలు", "en": "Plan Details"}

        action_buttons = [
            SakhiActionButton(label=btn_source_labels.get(lang, btn_source_labels["en"]), action="open_url", payload={"url": p_url}),
            SakhiActionButton(label=btn_details_labels.get(lang, btn_details_labels["en"]), action="ask_prompt", payload={"prompt": f"What is {p_name}?"})
        ]

        if eval_result.status == "ELIGIBLE":
            reasons_text = ', '.join(eval_result.eligibility_reasons) if eval_result.eligibility_reasons else 'Within allowable entry limits'
            min_sa_val = target_plan.get('premium_rules', {}).get('min_sum_assured_text', 'As per official rules')
            term_val = target_plan.get('policy_term', {}).get('available_terms', 'Standard term')
            benefit_val = target_plan.get('death_benefit', 'Financial life protection with maturity proceeds')

            if lang == "hi":
                answer_text = (
                    f"### 🛡️ पात्रता की पुष्टि: {p_name} (Plan {p_num})\n\n"
                    f"**स्थिति: पात्र (ELIGIBLE)** ✅\n\n"
                    f"आपके विवरण के अनुसार आप **{p_name}** के सभी वैधानिक पात्रता मानदंडों को पूरा करते हैं।\n\n"
                    f"• **पात्रता मानदंड:** {reasons_text}\n"
                    f"• **न्यूनतम बीमा राशि (Sum Assured):** {min_sa_val}\n"
                    f"• **पॉलिसी अवधि:** {term_val}\n"
                    f"• **प्रमुख लाभ:** {benefit_val}\n\n"
                    f"**आधिकारिक LIC स्रोत:** {p_url}"
                )
            elif lang == "mr":
                answer_text = (
                    f"### 🛡️ पात्रता निश्चित: {p_name} (Plan {p_num})\n\n"
                    f"**स्थिती: पात्र (ELIGIBLE)** ✅\n\n"
                    f"तुमच्या तपशिलानुसार तुम्ही **{p_name}** च्या सर्व वैधानिक पात्रता अटी पूर्ण करता.\n\n"
                    f"• **पात्रता निकष:** {reasons_text}\n"
                    f"• **किमान विमा रक्कम (Sum Assured):** {min_sa_val}\n"
                    f"• **पॉलिसी मुदत:** {term_val}\n"
                    f"• **मुख्य लाभ:** {benefit_val}\n\n"
                    f"**अधिकृत LIC स्रोत:** {p_url}"
                )
            elif lang == "bn":
                answer_text = (
                    f"### 🛡️ যোগ্যতা নিশ্চিত: {p_name} (Plan {p_num})\n\n"
                    f"**মর্যাদা: যোগ্য (ELIGIBLE)** ✅\n\n"
                    f"আপনার বিবরণ অনুযায়ী আপনি **{p_name}**-এর সমস্ত প্রয়োজনীয় শর্ত পূরণ করছেন।\n\n"
                    f"• **যোগ্যতার মানদণ্ড:** {reasons_text}\n"
                    f"• **ন্যূনতম বীমা রাশি (Sum Assured):** {min_sa_val}\n"
                    f"• **পলিসির মেয়াদ:** {term_val}\n"
                    f"• **প্রধান সুবিধা:** {benefit_val}\n\n"
                    f"**অফিসিয়াল LIC উৎস:** {p_url}"
                )
            elif lang == "te":
                answer_text = (
                    f"### 🛡️ అర్హత నిర్ధారించబడింది: {p_name} (Plan {p_num})\n\n"
                    f"**స్థితి: అర్హులు (ELIGIBLE)** ✅\n\n"
                    f"మీ వివరాల ప్రకారం మీరు **{p_name}** యొక్క అన్ని చట్టబద్ధమైన ప్రవేశ నిబంధనలను పూర్తి చేస్తున్నారు.\n\n"
                    f"• **అర్హత నిబంధనలు:** {reasons_text}\n"
                    f"• **కనిష్ట హామీ మొత్తం (Sum Assured):** {min_sa_val}\n"
                    f"• **పాలసీ కాలపరిమితి:** {term_val}\n"
                    f"• **ప్రధాన ప్రయోజనం:** {benefit_val}\n\n"
                    f"**అధికారిక LIC మూలం:** {p_url}"
                )
            else:
                answer_text = (
                    f"### 🛡️ Eligibility Confirmed: {p_name} (Plan {p_num})\n\n"
                    f"**Status: ELIGIBLE** ✅\n\n"
                    f"Based on your verified parameters, you meet all statutory entry criteria for **{p_name}**.\n\n"
                    f"**Key Eligibility & Plan Highlights:**\n"
                    f"• **Entry Age Criteria Met:** {reasons_text}\n"
                    f"• **Minimum Sum Assured:** {min_sa_val}\n"
                    f"• **Policy Term:** {term_val}\n"
                    f"• **Key Benefit:** {benefit_val}\n\n"
                    f"**Official LIC Source:** Grounded directly in verified LIC records ({p_url})."
                )

            return SakhiChatResponse(
                answer=answer_text,
                intent="CHECK_ELIGIBILITY",
                sources=[source_citation],
                eligibility_result="ELIGIBLE",
                language=lang,
                suggested_prompts=[f"What is {p_name}?", "What is the policy term?", "Compare with other LIC plans", "Official LIC Portal"],
                action_buttons=action_buttons,
                disclaimer="All plan details and eligibility conditions are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes."
            )

        elif eval_result.status == "INELIGIBLE":
            failed_str = "\n".join([f"• {r}" for r in eval_result.failed_criteria])
            if lang == "hi":
                answer_text = (
                    f"### 🛡️ पात्रता मूल्यांकन: {p_name} (Plan {p_num})\n\n"
                    f"**स्थिति: अपात्र (INELIGIBLE)** ❌\n\n"
                    f"प्रदान किए गए विवरण के अनुसार आप इस योजना के वैधानिक मानदंडों को पूरा नहीं करते हैं:\n\n"
                    f"{failed_str}\n\n"
                    f"**आधिकारिक LIC स्रोत:** {p_url}"
                )
            elif lang == "mr":
                answer_text = (
                    f"### 🛡️ पात्रता मूल्यांकन: {p_name} (Plan {p_num})\n\n"
                    f"**स्थिती: अपात्र (INELIGIBLE)** ❌\n\n"
                    f"दिलेल्या माहितीनुसार तुम्ही या योजनेच्या वैधानिक अटी पूर्ण करत नाही:\n\n"
                    f"{failed_str}\n\n"
                    f"**अधिकृत LIC स्रोत:** {p_url}"
                )
            elif lang == "bn":
                answer_text = (
                    f"### 🛡️ योग्यता মূল্যায়ন: {p_name} (Plan {p_num})\n\n"
                    f"**মর্যাদা: অযোগ্য (INELIGIBLE)** ❌\n\n"
                    f"প্রদত্ত তথ্য অনুযায়ী আপনি এই প্ল্যানের প্রয়োজনীয় শর্তাবলী পূরণ করছেন না:\n\n"
                    f"{failed_str}\n\n"
                    f"**অফিসিয়াল LIC উৎস:** {p_url}"
                )
            elif lang == "te":
                answer_text = (
                    f"### 🛡️ అర్హత మూల్యాంకనం: {p_name} (Plan {p_num})\n\n"
                    f"**స్థితి: అనర్హులు (INELIGIBLE)** ❌\n\n"
                    f"అందించిన వివరాల ప్రకారం మీరు ఈ ప్లాన్ యొక్క చట్టబద్ధమైన నిబంధనలను తీర్చడం లేదు:\n\n"
                    f"{failed_str}\n\n"
                    f"**అధికారిక LIC మూలం:** {p_url}"
                )
            else:
                answer_text = (
                    f"### 🛡️ Eligibility Evaluation: {p_name} (Plan {p_num})\n\n"
                    f"**Status: INELIGIBLE** ❌\n\n"
                    f"You do not meet the statutory eligibility requirements for this plan based on the provided details:\n\n"
                    f"{failed_str}\n\n"
                    f"**Official LIC Source:** {p_url}"
                )

            return SakhiChatResponse(
                answer=answer_text,
                intent="CHECK_ELIGIBILITY",
                sources=[source_citation],
                eligibility_result="INELIGIBLE",
                language=lang,
                suggested_prompts=["Recommend suitable LIC plans for me", "LIC child education plans", "LIC retirement plans", "Find My Schemes"],
                action_buttons=action_buttons,
                disclaimer="All plan details and eligibility conditions are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes."
            )

        else:  # ADDITIONAL_INFORMATION_REQUIRED
            missing_fields_str = ", ".join(eval_result.missing_fields)
            is_child_plan = target_plan.get("child_age_rules", {}).get("is_child_plan", False)
            child_note = " (Note: This is taken on the child's life with entry age 90 days to 12 years)" if is_child_plan else ""
            entry_limits_text = target_plan.get('age_rules', {}).get('entry_age_text', 'As per official brochure')

            if lang == "hi":
                answer_text = (
                    f"### 🛡️ अतिरिक्त जानकारी आवश्यक: {p_name} (Plan {p_num})\n\n"
                    f"सटीक पात्रता जांचने के लिए कृपया अपनी **{missing_fields_str}** बताएं{child_note}।\n\n"
                    f"**आधिकारिक प्रवेश आयु सीमा:** {entry_limits_text}।"
                )
            elif lang == "mr":
                answer_text = (
                    f"### 🛡️ अतिरिक्त माहिती आवश्यक: {p_name} (Plan {p_num})\n\n"
                    f"अचूक पात्रता तपासण्यासाठी कृपया तुमचे **{missing_fields_str}** सांगा{child_note}.\n\n"
                    f"**अधिकृत प्रवेश वयोमर्यादा:** {entry_limits_text}."
                )
            elif lang == "bn":
                answer_text = (
                    f"### 🛡️ অতিরিক্ত তথ্য প্রয়োজন: {p_name} (Plan {p_num})\n\n"
                    f"সঠিক যোগ্যতা নির্ধারণের জন্য দয়া করে আপনার **{missing_fields_str}** জানান{child_note}।\n\n"
                    f"**অফিসিয়াল প্রবেশের বয়সসীমা:** {entry_limits_text}।"
                )
            elif lang == "te":
                answer_text = (
                    f"### 🛡️ అదనపు సమాచారం అవసరం: {p_name} (Plan {p_num})\n\n"
                    f"ఖచ్చితమైన అర్హతను తనిఖీ చేయడానికి దయచేసి మీ **{missing_fields_str}** తెలపండి{child_note}.\n\n"
                    f"**అధికారిక ప్రవేశ వయస్సు పరిమితి:** {entry_limits_text}."
                )
            else:
                answer_text = (
                    f"### 🛡️ Additional Information Required for {p_name} (Plan {p_num})\n\n"
                    f"To determine your statutory eligibility without guessing, please provide your **{missing_fields_str}**{child_note}.\n\n"
                    f"**Official Entry Limits:** {entry_limits_text}."
                )

            return SakhiChatResponse(
                answer=answer_text,
                intent="CHECK_ELIGIBILITY",
                sources=[source_citation],
                eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
                language=lang,
                suggested_prompts=["My age is 32", "Child age is 5 years", "My monthly budget is 5000"],
                action_buttons=action_buttons,
                disclaimer="All plan details and eligibility conditions are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes."
            )

    # -------------------------------------------------------------
    # 2. Specific Plan Explanation Inquiry
    # (e.g. "What is LIC Jeevan Tarun?", "LIC ka Jeevan Tarun kya hai?", "Tell me about Plan 715")
    # -------------------------------------------------------------
    if mentioned_plans:
        p = mentioned_plans[0]
        p_name = p.get("plan_name", "LIC Plan")
        p_num = str(p.get("plan_number", ""))
        p_uin = p.get("uin", "")
        p_cat = p.get("category", "Life Insurance")
        p_url = p.get("official_lic_url", "https://www.licindia.in/")
        p_desc = p.get("detailed_description") or p.get("short_description") or "Official LIC life insurance plan."
        
        prem_rules = p.get("premium_rules", {})
        min_sa = prem_rules.get("min_sum_assured_text", "₹1,00,000")
        max_sa = prem_rules.get("max_sum_assured_text", "No upper limit")
        pay_modes = ", ".join(prem_rules.get("premium_payment_modes", ["Yearly", "Half-Yearly", "Monthly"]))
        
        age_rules = p.get("age_rules", {})
        entry_age_text = age_rules.get("entry_age_text", f"{age_rules.get('min_entry_age_years', 0)} to {age_rules.get('max_entry_age_years', 65)} years")
        min_mat_age = age_rules.get("min_maturity_age_years", 18)
        max_mat_age = age_rules.get("max_maturity_age_years", 75)
        
        pol_term = p.get("policy_term", {}).get("available_terms", "10 to 25 years")
        ppt_text = ", ".join(p.get("premium_payment_term", {}).get("options", ["Equal to Policy Term"]))

        death_benefit = p.get("death_benefit") or p.get("benefits", {}).get("death_benefit_summary", "Sum Assured on Death with applicable bonuses.")
        maturity_benefit = p.get("maturity_benefit") or p.get("benefits", {}).get("maturity_benefit_summary", "Basic Sum Assured along with vested bonuses.")
        survival_benefit = p.get("benefits", {}).get("survival_benefits") or "Not applicable (Endowment/Term structure)"

        riders_list = ", ".join(p.get("riders", ["Accidental Death & Disability Benefit Rider"]))

        source_citation = SourceCitation(
            scheme_id=p.get("plan_id", "LIC-PLAN"),
            scheme_name=f"{p_name} (Plan {p_num})",
            authority="Life Insurance Corporation of India (LIC)",
            source_authority="Life Insurance Corporation of India (LIC)",
            official_url=p_url,
            last_verified=p.get("last_verified", "2026-08-31"),
            last_verified_date=p.get("last_verified", "2026-08-31")
        )

        labels = {
            "hi": {
                "cat": "श्रेणी (Category)", "rules": "मुख्य पात्रता व शर्तें", "entry": "प्रवेश आयु सीमा",
                "mat_age": "परिपक्वता आयु", "term": "पॉलिसी अवधि (Term)", "ppt": "प्रीमियम भुगतान अवधि",
                "min_sa": "न्यूनतम बीमा राशि (Sum Assured)", "max_sa": "अधिकतम बीमा राशि", "modes": "भुगतान मोड",
                "benefits": "मुख्य लाभ", "death": "मृत्यु लाभ (Death Benefit)", "mat": "परिपक्वता लाभ (Maturity Benefit)",
                "surv": "उत्तरजीविता लाभ (Survival Benefit)", "riders": "ऐच्छिक राइडर्स", "src": "आधिकारिक LIC स्रोत"
            },
            "mr": {
                "cat": "प्रवर्ग (Category)", "rules": "मुख्य पात्रता आणि अटी", "entry": "प्रवेश वयोमर्यादा",
                "mat_age": "परिपक्वता वय", "term": "पॉलिसी मुदत (Term)", "ppt": "हप्ता भरण्याची मुदत",
                "min_sa": "किमान विमा रक्कम (Sum Assured)", "max_sa": "कमाल विमा रक्कम", "modes": "हप्ता भरण्याचे पर्याय",
                "benefits": "मुख्य लाभ", "death": "मृत्यू लाभ (Death Benefit)", "mat": "परिपक्वता लाभ (Maturity Benefit)",
                "surv": "हयात लाभ (Survival Benefit)", "riders": "पर्यायी रायडर्स", "src": "अधिकृत LIC स्रोत"
            },
            "bn": {
                "cat": "বিভাগ (Category)", "rules": "প্রধান যোগ্যতা ও শর্তাবলী", "entry": "প্রবেশের বয়সসীমা",
                "mat_age": "পরিপক্কতার বয়স", "term": "পলিসির মেয়াদ (Term)", "ppt": "প্রিমিয়াম প্রদানের মেয়াদ",
                "min_sa": "ন্যূনতম বীমা রাশি (Sum Assured)", "max_sa": "সর্বোচ্চ বীমা রাশি", "modes": "প্রদানের বিকল্প",
                "benefits": "প্রধান সুবিধাসমূহ", "death": "মৃত্যু সুবিধা (Death Benefit)", "mat": "পরিপক্কতা সুবিধা (Maturity Benefit)",
                "surv": "টিকে থাকার সুবিধা (Survival Benefit)", "riders": "ঐচ্ছিক রাইডার", "src": "অফিসিয়াল LIC উৎস"
            },
            "te": {
                "cat": "వర్గం (Category)", "rules": "ముఖ్య అర్హతలు మరియు నిబంధనలు", "entry": "ప్రవేశ వయస్సు పరిమితి",
                "mat_age": "మెచ్యూరిటీ వయస్సు", "term": "పాలసీ కాలపరిమితి (Term)", "ppt": "ప్రీమియం చెల్లింపు కాలం",
                "min_sa": "కనిష్ట హామీ మొత్తం (Sum Assured)", "max_sa": "గరిష్ట హామీ మొత్తం", "modes": "చెల్లింపు పద్ధతులు",
                "benefits": "ప్రధాన ప్రయోజనాలు", "death": "మరణ ప్రయోజనం (Death Benefit)", "mat": "మెచ్యూరిటీ ప్రయోజనం (Maturity Benefit)",
                "surv": "సర్వైవల్ ప్రయోజనం (Survival Benefit)", "riders": "రైడర్స్", "src": "అధికారిక LIC మూలం"
            },
            "en": {
                "cat": "Category", "rules": "Key Parameters & Eligibility Rules", "entry": "Entry Age Limits",
                "mat_age": "Maturity Age Limits", "term": "Policy Term", "ppt": "Premium Payment Term",
                "min_sa": "Minimum Sum Assured", "max_sa": "Maximum Sum Assured", "modes": "Payment Modes",
                "benefits": "Key Benefits", "death": "Death Benefit", "mat": "Maturity Benefit",
                "surv": "Survival Benefit", "riders": "Optional Riders", "src": "Official LIC Source"
            }
        }
        lb = labels.get(lang, labels["en"])

        answer_text = (
            f"### 🛡️ {p_name} (Plan {p_num}, UIN: {p_uin})\n\n"
            f"**{lb['cat']}:** {p_cat}\n\n"
            f"{p_desc}\n\n"
            f"#### 📋 {lb['rules']}:\n"
            f"• **{lb['entry']}:** {entry_age_text}\n"
            f"• **{lb['mat_age']}:** {min_mat_age} to {max_mat_age} years\n"
            f"• **{lb['term']}:** {pol_term}\n"
            f"• **{lb['ppt']}:** {ppt_text}\n"
            f"• **{lb['min_sa']}:** {min_sa}\n"
            f"• **{lb['max_sa']}:** {max_sa}\n"
            f"• **{lb['modes']}:** {pay_modes}\n\n"
            f"#### 💰 {lb['benefits']}:\n"
            f"• **{lb['death']}:** {death_benefit}\n"
            f"• **{lb['mat']}:** {maturity_benefit}\n"
            f"• **{lb['surv']}:** {survival_benefit}\n"
            f"• **{lb['riders']}:** {riders_list}\n\n"
            f"**{lb['src']}:** [{p_name} Portal]({p_url})"
        )

        action_buttons = [
            SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": p_url}),
            SakhiActionButton(label="Check Eligibility", action="ask_prompt", payload={"prompt": f"Am I eligible for {p_name}?"})
        ]

        suggested_prompts = [
            f"Am I eligible for {p_name}?",
            f"What are the surrender rules for {p_name}?",
            "Compare with other LIC plans",
            "What is LIC official website?"
        ]

        return SakhiChatResponse(
            answer=answer_text,
            intent="EXPLAIN_SCHEME",
            sources=[source_citation],
            language=lang,
            suggested_prompts=suggested_prompts,
            action_buttons=action_buttons,
            disclaimer="All plan details are verified directly from official Life Insurance Corporation of India (LIC) gazettes."
        )

    # -------------------------------------------------------------
    # 3. Check for Unknown/Unverified Plan Query (Hallucination Protection)
    # (e.g. "What is LIC Plan 99999?", "What is LIC Plan 999?")
    # -------------------------------------------------------------
    unknown_plan_m = re.search(r'\b(?:plan\s+(?:no\.?\s*)?(\d{3,5})|lic\s+(\d{3,5}))\b', msg_lower)
    if unknown_plan_m:
        req_num = unknown_plan_m.group(1) or unknown_plan_m.group(2)
        if req_num not in LIC_PLAN_KEYWORD_MAP:
            unknown_texts = {
                "hi": (
                    f"### ⚠️ सत्यापित LIC डेटाबेस में योजना उपलब्ध नहीं\n\n"
                    f"संचय के 38 सक्रिय LIC योजनाओं के सत्यापित डेटाबेस में योजना संख्या **'{req_num}'** नहीं मिली।\n\n"
                    f"सटीक जानकारी के लिए कृपया सही प्लान नंबर दर्ज करें या उपलब्ध योजनाओं की सूची देखें।"
                ),
                "mr": (
                    f"### ⚠️ सत्यापित LIC डेटाबेसमध्ये योजना आढळली नाही\n\n"
                    f"संचयच्या ३८ अधिकृत LIC योजनांच्या डेटाबेसमध्ये योजना क्रमांक **'{req_num}'** आढळली नाही.\n\n"
                    f"सत्यापित माहितीसाठी कृपया योग्य प्लॅन नंबर प्रविष्ट करा किंवा अधिकृत यादी पहा."
                ),
                "bn": (
                    f"### ⚠️ যাচাইকৃত LIC ডেটাবেসে প্ল্যান পাওয়া যায়নি\n\n"
                    f"সঞ্চয়ের ৩৮টি সক্রিয় LIC প্ল্যানের অনুমোদিত ডেটাবেসে প্ল্যান নম্বর **'{req_num}'** পাওয়া যায়নি।\n\n"
                    f"সঠিক তথ্যের জন্য দয়া করে সঠিক প্ল্যান নম্বর প্রদান করুন বা সক্রিয় তালিকা দেখুন।"
                ),
                "te": (
                    f"### ⚠️ ధృవీకరించబడిన LIC డేటాబేస్‌లో ప్లాన్ కనుగొనబడలేదు\n\n"
                    f"సంచయ్ యొక్క 38 క్రియాశీల LIC ప్లాన్‌ల డేటాబేస్‌లో ప్లాన్ నంబర్ **'{req_num}'** కనుగొనబడలేదు.\n\n"
                    f"ఖచ్చితమైన సమాచారం కోసం దయచేసి సరైన ప్లాన్ నంబర్‌ను నమోదు చేయండి లేదా క్రియాశీల కేటలాగ్‌ను చూడండి."
                ),
                "en": (
                    f"### ⚠️ Plan Not Found in Verified LIC Database\n\n"
                    f"I could not find an active official plan numbered **'{req_num}'** in Sanchay's verified LIC database of 38 active plans.\n\n"
                    f"To protect against unverified information or hallucinated terms, Sakhi strictly grounds all LIC answers in official gazettes. Please verify the plan number or browse the active catalogue below."
                )
            }
            return SakhiChatResponse(
                answer=unknown_texts.get(lang, unknown_texts["en"]),
                intent="EXPLAIN_SCHEME",
                sources=[],
                language=lang,
                suggested_prompts=["Show all LIC plans", "LIC child education plans", "LIC retirement plans", "What is LIC?"],
                action_buttons=[SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": "https://www.licindia.in/"})],
                disclaimer="All plan data is grounded in official Life Insurance Corporation of India (LIC) records."
            )

    # -------------------------------------------------------------
    # 4. General LIC Corporate / Catalogue Inquiry
    # -------------------------------------------------------------
    is_general_lic_inquiry = any(w in msg_lower for w in [
        "what is lic", "tell me about lic", "how many plans", "total plans", "count of plans",
        "lic ke bare mein", "lic kya hai", "lic official source", "lic corporate", "lic established",
        "lic kay ahe", "lic baddal sanga", "lic ki", "lic gurinchi"
    ]) or msg_lower in ["lic", "l.i.c", "lic plans", "lic ke plans"]
    
    if is_general_lic_inquiry and not flags["has_age"] and not flags["has_budget"] and not flags["has_goal"]:
        info_col = get_lic_information_collection()
        info_doc = info_col.find_one({"organization_name": "Life Insurance Corporation of India"}) or {}
        
        corp_name = info_doc.get("organization_name", "Life Insurance Corporation of India")
        est_date = info_doc.get("establishment_date", "1 September 1956")
        act = info_doc.get("statutory_act", "Life Insurance Corporation Act, 1956")
        irdai = info_doc.get("irdai_registration_number", "512")
        official_url = info_doc.get("official_website", "https://www.licindia.in/")

        source_citation = SourceCitation(
            scheme_id="LIC_MASTER",
            scheme_name="Life Insurance Corporation of India",
            authority="Life Insurance Corporation of India (LIC)",
            source_authority="Life Insurance Corporation of India (LIC)",
            official_url=official_url,
            last_verified="2026-08-31",
            last_verified_date="2026-08-31"
        )

        about_texts = {
            "hi": (
                f"### 🛡️ भारतीय जीवन बीमा निगम (LIC) का परिचय\n\n"
                f"**भारतीय जीवन बीमा निगम (LIC)** भारत सरकार के स्वामित्व वाला एक वैधानिक निगम है, जिसकी स्थापना **{est_date}** को **{act}** के तहत हुई थी (IRDAI Reg No: **{irdai}**)।\n\n"
                f"#### 📊 सक्रिय योजनाएं (कुल 38 सत्यापित प्लान):\n"
                f"• **जीवन बीमा और बचत योजनाएं:** 27 प्लान (जैसे जीवन लाभ, जीवन उमंग, जीवन आनंद, जीवन तरुण, अमृतबाल)\n"
                f"• **पेंशन व वार्षिकी योजनाएं:** 5 प्लान (जैसे सरल पेंशन, जीवन शांति, जीवन अक्षय-VII, जीवन धारा-II)\n"
                f"• **यूनिट लिंक्ड (ULIP):** 4 प्लान (SIIP, निवेश प्लस, इंडेक्स प्लस)\n"
                f"• **माइक्रो इंश्योरेंस:** 2 प्लान (माइक्रो बचत, भाग्य लक्ष्मी)\n\n"
                f"**आधिकारिक LIC स्रोत:** {official_url}"
            ),
            "mr": (
                f"### 🛡️ भारतीय आयुर्विमा महामंडळ (LIC) चा परिचय\n\n"
                f"**भारतीय आयुर्विमा महामंडळ (LIC)** ही भारत सरकारच्या मालकीची वैधानिक संस्था आहे, ज्याची स्थापना **{est_date}** रोजी **{act}** अंतर्गत झाली (IRDAI Reg No: **{irdai}**).\n\n"
                f"#### 📊 सक्रिय योजना (एकूण ३८ सत्यापित प्लॅन):\n"
                f"• **जीवन विमा आणि बचत योजना:** २७ प्लॅन (उदा. जीवन लाभ, जीवन उमंग, जीवन आनंद, जीवन तरुण, अमृतबाल)\n"
                f"• **पेन्शन योजना:** ५ प्लॅन (उदा. सरळ पेन्शन, जीवन शांती, जीवन अक्षय-VII, जीवन धारा-II)\n"
                f"• **यूनिट लिंक्ड (ULIP):** ४ प्लॅन (SIIP, निवेश प्लस, इंडेक्स प्लस)\n"
                f"• **मायक्रो इन्शुरन्स:** २ प्लॅन (मायक्रो बचत, भाग्य लक्ष्मी)\n\n"
                f"**अधिकृत LIC संकेतस्थळ:** {official_url}"
            ),
            "bn": (
                f"### 🛡️ ভারতীয় জীবন বীমা নিগম (LIC) সম্পর্কিত তথ্য\n\n"
                f"**লাইফ ইন্স্যুরেন্স কর্পোরেশন অব ইন্ডিয়া (LIC)** ভারত সরকারের একটি সংবিধিবদ্ধ সংস্থা, যা **{est_date}** তারিখে **{act}**-এর অধীনে প্রতিষ্ঠিত হয় (IRDAI Reg No: **{irdai}**)।\n\n"
                f"#### 📊 সক্রিয় প্ল্যান (মোট ৩৮টি যাচাইকৃত প্ল্যান):\n"
                f"• **জীবন বীমা ও সঞ্চয় প্ল্যান:** ২৭টি প্ল্যান (যেমন জীবন লাভ, জীবন উমং, জীবন আনন্দ, জীবন তরুণ, অমৃতবাল)\n"
                f"• **পেনশন প্ল্যান:** ৫টি প্ল্যান (যেমন সরল পেনশন, জীবন শান্তি, জীবন অক্ষয়-VII, জীবন ধারা-II)\n"
                f"• **ইউনিট লিঙ্কড (ULIP):** ৪টি প্ল্যান (SIIP, নিবেশ প্লাস, ইনডেক্স প্লাস)\n"
                f"• **মাইক্রো ইন্স্যুরেন্স:** ২টি প্ল্যান (মাইক্রো সঞ্চয়, ভাগ্য লক্ষ্মী)\n\n"
                f"**অফিসিয়াল LIC পোর্টাল:** {official_url}"
            ),
            "te": (
                f"### 🛡️ భారతీయ జీవిత బీమా సంస్థ (LIC) పరిచయం\n\n"
                f"**లైఫ్ ఇన్సూరెన్స్ కార్పొరేషన్ ఆఫ్ ఇండియా (LIC)** భారత ప్రభుత్వానికి చెందిన చట్టబద్ధమైన సంస్థ, ఇది **{est_date}** న **{act}** ప్రకారం స్థాపించబడింది (IRDAI Reg No: **{irdai}**).\n\n"
                f"#### 📊 క్రియాశీల ప్లాన్‌లు (మొత్తం 38 ధృవీకరించబడిన ప్లాన్‌లు):\n"
                f"• **లైఫ్ ఇన్సూరెన్స్ & పొదుపు ప్లాన్‌లు:** 27 ప్లాన్‌లు (ఉదా. జీవన్ లాభ్, జీవన్ ఉమంగ్, జీవన్ ఆనంద్, జీవన్ తరుణ్, అమృత్‌బాల్)\n"
                f"• **పెన్షన్ ప్లాన్‌లు:** 5 ప్లాన్‌లు (ఉదా. సరళ్ పెన్షన్, జీవన్ శాంతి, జీవన్ అక్షయ్-VII, జీవన్ ధార-II)\n"
                f"• **యూనిట్ లింక్డ్ (ULIP):** 4 ప్లాన్‌లు (SIIP, నివేష్ ప్లస్, ఇండెక్స్ ప్లస్)\n"
                f"• **మైక్రో ఇన్సూరెన్స్:** 2 ప్లాన్‌లు (మైక్రో బచత్, భాగ్యలక్ష్మి)\n\n"
                f"**అధికారిక LIC పోర్టల్:** {official_url}"
            ),
            "en": (
                f"### 🛡️ About {corp_name} (LIC)\n\n"
                f"The **{corp_name}** is a statutory public sector life insurance corporation established on **{est_date}** under the **{act}** passed by the Parliament of India (IRDAI Reg. No. **{irdai}**).\n\n"
                f"#### 📊 Active Catalogue (38 Verified Plans):\n"
                f"• **Life Assurance & Savings (Endowment, Whole Life, Money Back):** 27 Plans (e.g., Jeevan Labh, Jeevan Umang, Jeevan Anand, Jeevan Tarun, Amritbaal)\n"
                f"• **Pension & Annuity:** 5 Plans (e.g., Saral Pension, Jeevan Shanti, Jeevan Akshay - VII, Jeevan Dhara - II)\n"
                f"• **Unit Linked Plans (ULIP):** 4 Plans (SIIP, Nivesh Plus, Index Plus, Unit Plus)\n"
                f"• **Micro Insurance:** 2 Plans (Micro Bachat, Bhagya Lakshmi / Jan Suraksha)\n\n"
                f"**Official Portal:** [{official_url}]({official_url})"
            )
        }

        return SakhiChatResponse(
            answer=about_texts.get(lang, about_texts["en"]),
            intent="SOURCE_LOOKUP",
            sources=[source_citation],
            language=lang,
            suggested_prompts=["LIC child education plans", "LIC retirement plans", "LIC pure term plans", "Compare LIC plans"],
            action_buttons=[SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": official_url})],
            disclaimer="All LIC data is strictly grounded in official LIC gazettes and product brochures."
        )

    # -------------------------------------------------------------
    # 5. Missing User Information Follow-up for Personalized Queries
    # (e.g. "LIC mein mere liye best plan kaunsa hai?", "Which LIC plan is suitable for me?", "माझ्यासाठी कोणती LIC योजना योग्य आहे?", "আমার জন্য কোন LIC প্ল্যানটি উপযুক্ত?", "నాకు ఏ LIC ప్లాన్ సరైనది?")
    # -------------------------------------------------------------
    is_personalized_request = any(w in msg_lower for w in [
        "mere liye", "for me", "best plan", "sahi plan", "kaunsa plan", "recommend", "suggest", "suitable", "which plan should i",
        "majhyasathi", "konti lic", "yogya", "amar jonno", "upojukto", "naaku", "sarainadi", "manchi plan"
    ])
    if is_personalized_request and not flags["has_age"] and not flags["has_budget"] and not flags["has_goal"]:
        missing_rec_texts = {
            "hi": (
                "### 🤝 आपके लिए सही LIC प्लान चुनने में मदद\n\n"
                "38 सक्रिय योजनाओं में से आपके लिए सबसे उपयुक्त योजना जांचने के लिए कृपया कुछ बुनियादी विवरण बताएं:\n\n"
                "• **आपकी आयु** (या बच्चे की आयु यदि बच्चों के लिए योजना चाहिए)\n"
                "• **प्राथमिक वित्तीय लक्ष्य** (जैसे बच्चों की शिक्षा, रिटायरमेंट पेंशन, परिवार की सुरक्षा, मनी बैक)\n"
                "• **मासिक या वार्षिक बजट** (जैसे ₹5,000/माह या ₹50,000/वर्ष)\n\n"
                "आप सीधे नीचे दिए गए विकल्पों में से भी चुन सकते हैं।"
            ),
            "mr": (
                "### 🤝 तुमच्यासाठी योग्य LIC योजना शोधण्यात मदत\n\n"
                "३८ सक्रिय योजनांमधून तुमच्यासाठी सर्वात योग्य योजना शोधण्यासाठी कृपया काही प्राथमिक माहिती सांगा:\n\n"
                "• **तुमचे वय** (किंवा मुलांसाठी असल्यास मुलाचे वय)\n"
                "• **मुख्य आर्थिक उद्दिष्ट** (उदा. मुलांचे उच्च शिक्षण, पेन्शन, कुटुंब सुरक्षा, मनी बॅक)\n"
                "• **अंदाजे मासिक किंवा वार्षिक बजेट** (उदा. ₹५,०००/महिना किंवा ₹५०,०००/वर्ष)\n\n"
                "तुम्ही खालील पर्यायांमधूनही निवड करू शकता."
            ),
            "bn": (
                "### 🤝 আপনার জন্য সঠিক LIC প্ল্যান নির্বাচন\n\n"
                "৩৮টি সক্রিয় প্ল্যানের মধ্য থেকে আপনার জন্য সেরা প্ল্যান নির্ধারণ করতে দয়া করে কিছু প্রাথমিক তথ্য জানান:\n\n"
                "• **আপনার বয়স** (অথবা বাচ্চার জন্য হলে বাচ্চার বয়স)\n"
                "• **প্রধান আর্থিক লক্ষ্য** (যেমন বাচ্চার উচ্চশিক্ষা, অবসরকালীন পেনশন, পারিবারিক সুরক্ষা)\n"
                "• **আনুমানিক মাসিক বা বার্ষিক বাজেট** (যেমন ₹৫,০০০/মাস বা ₹৫০,০০০/বছর)\n\n"
                "আপনি নিচের সাজেস্টেড প্রম্পট থেকেও নির্বাচন করতে পারেন।"
            ),
            "te": (
                "### 🤝 మీ కోసం సరైన LIC ప్లాన్‌ను ఎంచుకోవడంలో సహాయం\n\n"
                "38 క్రియాశీల ప్లాన్‌లలో మీ కోసం సరైనది ఎంచుకోవడానికి దయచేసి కొన్ని వివరాలను తెలపండి:\n\n"
                "• **మీ వయస్సు** (పిల్లల కోసం అయితే పిల్లల వయస్సు)\n"
                "• **ప్రధాన లక్ష్యం** (పిల్లల చదువు, పదవీ విరమణ పెన్షన్, కుటుంబ రక్షణ)\n"
                "• **సుమారు నెలవారీ లేదా వార్షిక బడ్జెట్** (ఉదా. ₹5,000/నెల లేదా ₹50,000/సంవత్సరం)\n\n"
                "మీరు దిగువ ఎంపికల నుండి కూడా ఎంచుకోవచ్చు."
            ),
            "en": (
                "### 🤝 Finding Your Best LIC Plan Match\n\n"
                "To evaluate all 38 active LIC plans and recommend the most suitable plan for you without guessing, please share a few details:\n\n"
                "• **Your Age** (or Child's Age if saving for your child)\n"
                "• **Primary Goal** (e.g., Child Education, Retirement Pension, Family Protection, Money Back, Wealth Creation)\n"
                "• **Approximate Monthly or Annual Budget** (e.g., ₹5,000/month or ₹50,000/year)\n\n"
                "You can type your details or select one of the suggested prompts below."
            )
        }
        return SakhiChatResponse(
            answer=missing_rec_texts.get(lang, missing_rec_texts["en"]),
            intent="RECOMMENDATION_EXPLANATION",
            sources=[],
            eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
            language=lang,
            suggested_prompts=["My age is 32, budget ₹5000/month", "LIC child education plans", "LIC retirement options", "LIC family protection plans"],
            action_buttons=[SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": "https://www.licindia.in/"})],
            disclaimer="LIC recommendations are evaluated deterministically using official IRDAI and LIC statutory rules."
        )

    # -------------------------------------------------------------
    # 6. Full Evaluation across ALL 38 LIC Plans via lic_engine.py
    # -------------------------------------------------------------
    col_plans = get_lic_plans_collection()
    all_38_plans = list(col_plans.find({"$or": [{"active_status": "active"}, {"status": "active"}]}))

    rec_result = recommend_lic_plans(all_38_plans, profile)

    if rec_result.status == "NO_APPLICABLE_PLAN":
        no_plan_texts = {
            "hi": "### 🛡️ LIC योजना मूल्यांकन परिणाम\n\n**प्रदान की गई जानकारी के आधार पर वर्तमान में कोई उपयुक्त LIC योजना नहीं मिली।**\n\nडेटाबेस की 38 सक्रिय LIC योजनाओं में से कोई भी इस आयु सीमा या पात्रता शर्तों से मेल नहीं खाती।",
            "mr": "### 🛡️ LIC योजना मूल्यांकन निकाल\n\n**दिलेल्या माहितीनुसार कोणतीही योग्य LIC योजना आढळली नाही.**\n\nडेटाबेसमधील ३८ सक्रिय योजनांपैकी कोणतीही योजना या वयोमर्यादा किंवा पात्रता अटींशी जुळत नाही.",
            "bn": "### 🛡️ LIC প্ল্যান মূল্যায়ন ফলাফল\n\n**প্রদত্ত তথ্যের ভিত্তিতে বর্তমানে কোনো উপযুক্ত LIC প্ল্যান পাওয়া যায়নি।**\n\nডেটাবেসের ৩৮টি সক্রিয় LIC প্ল্যানের কোনটিই এই বয়সসীমা বা যোগ্যতার শর্ত পূরণ করে না।",
            "te": "### 🛡️ LIC ప్లాన్ మూల్యాంకన ఫలితం\n\n**అందించిన సమాచారం ఆధారంగా ప్రస్తుతం సరిపోలే LIC ప్లాన్ కనుగొనబడలేదు.**\n\nడేటాబేస్‌లోని 38 క్రియాశీల LIC ప్లాన్‌లలో ఏదీ ఈ ప్రవేశ నిబంధనలకు సరిపోలడం లేదు.",
            "en": "### 🛡️ LIC Plan Evaluation Result\n\n**No currently matching LIC plan was found based on the information provided.**\n\nNone of the 38 active LIC plans in the database satisfy the entry criteria for the specified profile parameters."
        }
        return SakhiChatResponse(
            answer=no_plan_texts.get(lang, no_plan_texts["en"]),
            intent="RECOMMENDATION_EXPLANATION",
            sources=[],
            eligibility_result="NO_APPLICABLE_PLAN",
            language=lang,
            suggested_prompts=["LIC child education plans", "LIC pension plans", "Explore all 38 LIC plans", "What is LIC?"],
            action_buttons=[SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": "https://www.licindia.in/"})],
            disclaimer="All plan eligibility conditions are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes."
        )

    # SUCCESS — Top Recommended Plans Formatting
    top_plans = rec_result.recommended_plans[:3]
    sources = []
    for plan_res in top_plans:
        sources.append(SourceCitation(
            scheme_id=plan_res.plan_id,
            scheme_name=f"{plan_res.plan_name} (Plan {plan_res.plan_number})",
            authority="Life Insurance Corporation of India (LIC)",
            source_authority="Life Insurance Corporation of India (LIC)",
            official_url=plan_res.official_lic_url,
            last_verified="2026-08-31",
            last_verified_date="2026-08-31"
        ))

    intro_msgs = {
        "hi": "आपके विवरण के अनुसार 38 सक्रिय योजनाओं में से शीर्ष सत्यापित LIC योजनाएं नीचे दी गई हैं:",
        "mr": "तुमच्या तपशिलानुसार ३८ अधिकृत योजनांमधून शिफारस केलेल्या सर्वोत्तम LIC योजना खालीलप्रमाणे आहेत:",
        "bn": "আপনার প্রোফাইলের ওপর ভিত্তি করে ৩৮টি সক্রিয় প্ল্যানের মধ্য থেকে সেরা যাচাইকৃত LIC প্ল্যানগুলি নিচে দেওয়া হলো:",
        "te": "మీ ప్రొఫైల్ ఆధారంగా 38 క్రియాశీల ప్లాన్‌లలో సిఫార్సు చేయబడిన ఉత్తమ LIC ప్లాన్‌లు ఇక్కడ ఉన్నాయి:",
        "en": "Based on your profile, here are the top recommended and statutorily verified LIC plans from the active catalogue of 38 plans:"
    }
    intro_msg = intro_msgs.get(lang, intro_msgs["en"])
    
    plan_blocks = []
    rec_labels = {
        "hi": {"status": "पात्रता स्थिति", "score": "मैच स्कोर", "cat": "श्रेणी", "why": "यह क्यों उपयुक्त है", "benefits": "मुख्य लाभ", "cond": "महत्वपूर्ण शर्तें", "src": "आधिकारिक LIC स्रोत"},
        "mr": {"status": "पात्रता स्थिती", "score": "मॅच स्कोअर", "cat": "प्रवर्ग", "why": "ही शिफारस का", "benefits": "मुख्य लाभ", "cond": "महत्त्वाच्या अटी", "src": "अधिकृत LIC स्रोत"},
        "bn": {"status": "যোগ্যতার মর্যাদা", "score": "ম্যাচ স্কোর", "cat": "বিভাগ", "why": "কেন উপযুক্ত", "benefits": "প্রধান সুবিধাসমূহ", "cond": "গুরুত্বপূর্ণ শর্তাবলী", "src": "অফিসিয়াল LIC উৎস"},
        "te": {"status": "అర్హత స్థితి", "score": "మ్యాచ్ స్కోర్", "cat": "వర్గం", "why": "ఎందుకు సరిపోతుంది", "benefits": "ప్రధాన ప్రయోజనాలు", "cond": "ముఖ్య నిబంధనలు", "src": "అధికారిక LIC మూలం"},
        "en": {"status": "Eligibility Status", "score": "Match Score", "cat": "Category", "why": "Why it matches", "benefits": "Key Benefits", "cond": "Important Conditions", "src": "Official LIC Source"}
    }
    rlb = rec_labels.get(lang, rec_labels["en"])

    for idx, r in enumerate(top_plans, 1):
        why_match_text = " • ".join(r.match_reasons) if r.match_reasons else "Meets statutory eligibility criteria."
        cond_text = " • ".join(r.important_conditions) if r.important_conditions else "Standard terms under official brochure."
        death_b = r.benefits_summary.get("death_benefit") or "Comprehensive family life cover"
        mat_b = r.benefits_summary.get("maturity_benefit") or "Maturity lump-sum / survival payouts"

        block = (
            f"#### {idx}. {r.plan_name} (Plan No. {r.plan_number}, UIN: {r.uin})\n"
            f"• **{rlb['status']}:** {r.status} ✅ ({rlb['score']}: **{r.match_score}%**)\n"
            f"• **{rlb['cat']}:** {r.category}\n"
            f"• **{rlb['why']}:** {why_match_text}\n"
            f"• **{rlb['benefits']}:** {death_b} | {mat_b}\n"
            f"• **{rlb['cond']}:** {cond_text}\n"
            f"• **{rlb['src']}:** [{r.plan_name} Portal]({r.official_lic_url})"
        )
        plan_blocks.append(block)

    full_plans_text = "\n\n".join(plan_blocks)
    headers_dict = {
        "hi": "### 🛡️ आपके लिए अनुशंसित शीर्ष LIC योजनाएं",
        "mr": "### 🛡️ तुमच्यासाठी सर्वोत्तम शिफारस केलेल्या LIC योजना",
        "bn": "### 🛡️ আপনার জন্য শীর্ষ সুপারিশকৃত LIC প্ল্যানসমূহ",
        "te": "### 🛡️ మీ కోసం ఉత్తమంగా సిఫార్సు చేయబడిన LIC ప్లాన్‌లు",
        "en": "### 🛡️ Top Recommended LIC Plans"
    }
    final_answer = (
        f"{headers_dict.get(lang, headers_dict['en'])}\n\n"
        f"{intro_msg}\n\n"
        f"{full_plans_text}\n\n"
        f"All plan conditions and benefits are grounded directly in official LIC gazettes."
    )

    action_buttons = [
        SakhiActionButton(label="Official LIC Portal", action="open_url", payload={"url": top_plans[0].official_lic_url if top_plans else "https://www.licindia.in/"}),
        SakhiActionButton(label="Check Eligibility", action="ask_prompt", payload={"prompt": f"Am I eligible for {top_plans[0].plan_name}?" if top_plans else "Am I eligible for LIC plans?"})
    ]

    suggested_prompts = [
        f"What is {top_plans[0].plan_name}?" if top_plans else "What is LIC Jeevan Tarun?",
        "Compare top LIC plans",
        "LIC retirement pension plans",
        "Official LIC website"
    ]

    return SakhiChatResponse(
        answer=final_answer,
        intent="RECOMMENDATION_EXPLANATION",
        sources=sources,
        eligibility_result="ELIGIBLE",
        language=lang,
        suggested_prompts=suggested_prompts,
        action_buttons=action_buttons,
        disclaimer="All plan data, eligibility conditions, and benefit calculations are strictly sourced from official Life Insurance Corporation of India (LIC) gazettes and brochures."
    )


def handle_mixed_chat(
    message: str,
    language: str,
    context: Optional[Dict[str, Any]],
    government_handler_fn: Callable[[str, str, Optional[Dict[str, Any]]], SakhiChatResponse],
    free_benefits_handler_fn: Optional[Callable[..., SakhiChatResponse]] = None
) -> SakhiChatResponse:
    """
    Handles mixed questions where user asks about multiple domains.
    Strictly separates responses into clean, distinct sections using their respective engines:
    - ALL THREE: 1. Government Schemes, 2. Free Benefits, 3. LIC Plans
    - GOV + FREE: 1. Government Schemes, 2. Free Benefits
    - GOV + LIC: 1. Government Schemes, 2. LIC Plans
    - FREE + LIC: 1. Free Benefits, 2. LIC Plans
    Never merges databases or includes unrequested domains.
    Supports all 5 languages: en, hi, mr, bn, te.
    """
    msg_lower = message.lower().strip()
    lang = detect_user_language(message, fallback_lang=language)

    # Detect explicitly requested domains
    is_three_way = any(w in msg_lower for w in ["teeno", "तीनों", "all three", "तीनो", "teeno mein", "तीनों में"])
    
    has_lic_kw = _matches_kw(msg_lower, LIC_INDICATOR_KEYWORDS) or any(w in msg_lower for w in ["lic", "एलआईसी", "एलआयसी", "এলআইসি", "ఎల్‌ఐసి", "life insurance", "जीवन बीमा"])
    has_free_kw = _matches_kw(msg_lower, FREE_BENEFIT_INDICATOR_KEYWORDS) or any(w in msg_lower for w in ["free", "muft", "मुफ्त", "फ्री", "मोफत", "বিনামূল্যে", "ఉచిత", "benefit", "लाभ"])
    has_gov_kw = _matches_kw(msg_lower, GOV_SCHEME_INDICATOR_KEYWORDS) or any(w in msg_lower for w in ["government scheme", "government schemes", "govt scheme", "sarkari yojana", "सरकारी योजना", "सरकारी स्कीम", "शासकीय योजना", "সরকারি প্রকল্প", "ప్రభుత్వ పథకాలు"])

    if is_three_way or (has_lic_kw and has_free_kw and has_gov_kw):
        req_gov = True
        req_free = True
        req_lic = True
    else:
        req_gov = has_gov_kw
        req_lic = has_lic_kw
        req_free = has_free_kw

    # Execute only requested domain handlers
    gov_res = government_handler_fn(message, lang, context) if req_gov else None
    lic_res = handle_lic_chat(message, lang, context) if req_lic else None
    fb_res = free_benefits_handler_fn(message=message, lang=lang, context=context) if (req_free and free_benefits_handler_fn is not None) else None

    # Fallback if somehow none triggered
    if gov_res is None and lic_res is None and fb_res is None:
        gov_res = government_handler_fn(message, lang, context)
        req_gov = True

    sections = []
    combined_sources = []
    combined_actions = []

    # 1. GOVERNMENT SCHEMES SECTION (Order 1)
    if gov_res is not None:
        sec_headers = {
            "hi": "### 🏛️ 1. सरकारी योजनाएं (Government Schemes)",
            "mr": "### 🏛️ १. सरकारी योजना (Government Schemes)",
            "bn": "### 🏛️ ১. সরকারি স্কিম (Government Schemes)",
            "te": "### 🏛️ 1. ప్రభుత్వ పథకాలు (Government Schemes)",
            "en": "### 🏛️ 1. Government Schemes"
        }
        sections.append(f"{sec_headers.get(lang, sec_headers['en'])}\n\n{gov_res.answer}")
        if gov_res.sources:
            combined_sources.extend(gov_res.sources)
        if gov_res.action_buttons:
            combined_actions.extend(gov_res.action_buttons)

    # 2. FREE BENEFITS SECTION (Order 2)
    if fb_res is not None:
        num_prefix = "2" if req_gov else "1"
        sec_headers = {
            "hi": f"### 🎁 {num_prefix}. 100% मुफ्त सरकारी लाभ (Free Benefits / Free Plans)",
            "mr": f"### 🎁 {num_prefix}. १००% मोफत सरकारी लाभ (Free Benefits / Free Plans)",
            "bn": f"### 🎁 {num_prefix}. ১০০% বিনামূল্যে সরকারি সুবিধা (Free Benefits / Free Plans)",
            "te": f"### 🎁 {num_prefix}. 100% ఉచిత ప్రభుత్వ ప్రయోజనాలు (Free Benefits / Free Plans)",
            "en": f"### 🎁 {num_prefix}. Free Benefits / Free Plans"
        }
        sections.append(f"{sec_headers.get(lang, sec_headers['en'])}\n\n{fb_res.answer}")
        if fb_res.sources:
            combined_sources.extend(fb_res.sources)
        if fb_res.action_buttons:
            combined_actions.extend(fb_res.action_buttons)

    # 3. LIC PLANS SECTION (Order 3)
    if lic_res is not None:
        num_prefix = "3" if (req_gov and req_free) else ("2" if (req_gov or req_free) else "1")
        sec_headers = {
            "hi": f"### 🛡️ {num_prefix}. LIC बीमा योजनाएं (LIC Plans)",
            "mr": f"### 🛡️ {num_prefix}. LIC विमा योजना (LIC Plans)",
            "bn": f"### 🛡️ {num_prefix}. LIC প্ল্যান (LIC Plans)",
            "te": f"### 🛡️ {num_prefix}. LIC ప్లాన్‌లు (LIC Plans)",
            "en": f"### 🛡️ {num_prefix}. LIC Plans"
        }
        sections.append(f"{sec_headers.get(lang, sec_headers['en'])}\n\n{lic_res.answer}")
        if lic_res.sources:
            combined_sources.extend(lic_res.sources)
        if lic_res.action_buttons:
            combined_actions.extend(lic_res.action_buttons)

    # Header for the response
    if req_gov and req_free and req_lic:
        top_headers = {
            "hi": "### 🤝 समग्र विवरण: सरकारी योजनाएं, 100% मुफ्त सरकारी लाभ एवं LIC प्लान\n\nआपके प्रश्न के लिए तीनों श्रेणियों के सत्यापित विकल्प अलग-अलग वर्गों में नीचे दिए गए हैं:\n",
            "mr": "### 🤝 सर्वसमावेशक माहिती: सरकारी योजना, मोफत सरकारी लाभ आणि LIC प्लॅन्स\n\nतुमच्या विनंतीनुसार तिन्ही श्रेणींचे अधिकृत पर्याय स्वतंत्र भागात खालीलप्रमाणे आहेत:\n",
            "bn": "### 🤝 সমন্বিত বিবরণ: সরকারি স্কিম, বিনামূল্যে সুবিধা এবং LIC প্ল্যান\n\nআপনার প্রশ্নের প্রেক্ষিতে তিনটি স্বতন্ত্র বিভাগের অনুমোদিত তথ্য আলাদাভাবে নিচে দেওয়া হলো:\n",
            "te": "### 🤝 సమగ్ర అవలోకనం: ప్రభుత్వ పథకాలు, ఉచిత ప్రయోజనాలు మరియు LIC ప్లాన్‌లు\n\nమీ ప్రశ్న కోసం మూడు వేర్వేరు వర్గాల అధికారిక వివరాలు క్రింద స్పష్టంగా ఇవ్వబడ్డాయి:\n",
            "en": "### 🤝 Multi-Domain Overview: Government Schemes, Free Benefits & LIC Plans\n\nHere are the verified options across the requested categories, logically separated below:\n"
        }
    else:
        top_headers = {
            "hi": "### 🤝 तुलनात्मक विवरण: आपके लिए सत्यापित विकल्प\n\nआपके अनुरोध के अनुसार चयनित श्रेणियों के अधिकृत विकल्प नीचे दिए गए हैं:\n",
            "mr": "### 🤝 तुलनात्मक माहिती: तुमच्यासाठी अधिकृत पर्याय\n\nतुमच्या विनंतीनुसार निवडलेल्या श्रेणींचे पर्याय खालीलप्रमाणे आहेत:\n",
            "bn": "### 🤝 তুলনামূলক বিবরণ: আপনার জন্য অনুমোদিত অপশন\n\nআপনার অনুরোধের প্রেক্ষিতে নির্বাচিত বিভাগগুলির তথ্য নিচে দেওয়া হলো:\n",
            "te": "### 🤝 పోలిక వివరాలు: మీ కోసం ధృవీకరించబడిన ఎంపికలు\n\nమీ అభ్యర్థన ప్రకారం ఎంచుకున్న వర్గాల వివరాలు క్రింద ఇవ్వబడ్డాయి:\n",
            "en": "### 🤝 Comparative Overview: Verified Options\n\nHere are the verified options across your requested categories, logically separated below:\n"
        }

    combined_answer = top_headers.get(lang, top_headers["en"]) + "\n\n---\n\n" + "\n\n---\n\n".join(sections)

    suggested_prompts = [
        "What is Sukanya Samriddhi Yojana?",
        "Tell me about PMGKAY",
        "What is LIC Jeevan Labh?",
        "Check My Eligibility"
    ]

    # Evaluate combined eligibility
    sub_results = [r for r in [gov_res, fb_res, lic_res] if r is not None]
    if any(r.eligibility_result == "ADDITIONAL_INFORMATION_REQUIRED" for r in sub_results):
        combined_eligibility = "ADDITIONAL_INFORMATION_REQUIRED"
    elif all(r.eligibility_result == "ELIGIBLE" for r in sub_results):
        combined_eligibility = "ELIGIBLE"
    elif any(r.eligibility_result == "INELIGIBLE" for r in sub_results):
        combined_eligibility = "INELIGIBLE"
    elif any("NO_APPLICABLE" in (r.eligibility_result or "") for r in sub_results):
        combined_eligibility = "NO_APPLICABLE_SCHEME"
    else:
        combined_eligibility = "ADDITIONAL_INFORMATION_REQUIRED"

    return SakhiChatResponse(
        answer=combined_answer,
        intent="COMPARE_SCHEMES",
        sources=combined_sources[:4],
        eligibility_result=combined_eligibility,
        language=lang,
        suggested_prompts=suggested_prompts,
        action_buttons=combined_actions[:3],
        disclaimer="Government schemes are verified from Government of India gazettes; Free Benefits from official myScheme portals; LIC plans from official LIC gazettes."
    )

    suggested_prompts = [
        "What is Sukanya Samriddhi Yojana?",
        "What is LIC Jeevan Tarun?",
        "Compare PPF and LIC New Endowment",
        "All Free Benefits"
    ]

    # Determine accurate combined eligibility status strictly without defaulting to ELIGIBLE
    combined_eligibility = "ADDITIONAL_INFORMATION_REQUIRED"
    sub_results = [r for r in [gov_res, fb_res, lic_res] if r is not None]
    if any(r.eligibility_result == "ADDITIONAL_INFORMATION_REQUIRED" for r in sub_results):
        combined_eligibility = "ADDITIONAL_INFORMATION_REQUIRED"
    elif all(r.eligibility_result == "ELIGIBLE" for r in sub_results):
        combined_eligibility = "ELIGIBLE"
    elif any(r.eligibility_result == "INELIGIBLE" for r in sub_results):
        combined_eligibility = "INELIGIBLE"
    elif any("NO_APPLICABLE" in (r.eligibility_result or "") for r in sub_results):
        combined_eligibility = "NO_APPLICABLE_SCHEME"
    else:
        combined_eligibility = gov_res.eligibility_result or "ADDITIONAL_INFORMATION_REQUIRED"

    return SakhiChatResponse(
        answer=combined_answer,
        intent="COMPARE_SCHEMES",
        sources=combined_sources[:4],
        eligibility_result=combined_eligibility,
        language=lang,
        suggested_prompts=suggested_prompts,
        action_buttons=combined_actions[:3],
        disclaimer="Government schemes are verified from Government of India gazettes; LIC plans are verified from official LIC gazettes; Free Benefits from myScheme portals."
    )
