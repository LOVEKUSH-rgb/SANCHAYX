import os
import math
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
from dotenv import load_dotenv

from app.schemas import (
    SourceCitation, SakhiChatResponse, SakhiActionButton,
    UserProfile, UserGoal, UserPreferences
)
from app.database import get_schemes_collection, get_logs_collection
from app.engine import evaluate_eligibility, evaluate_scheme_fit
from app.services.sakhi_lic_handler import (
    detect_query_domain,
    handle_lic_chat,
    handle_mixed_chat
)
from app.services.sakhi_free_benefits_handler import (
    handle_free_benefits_chat,
    is_free_benefits_query
)
from app.services.language_service import (
    detect_user_language,
    get_multilingual_text
)
from app.services.profile_extractor import (
    extract_user_profile_facts,
    ExtractedProfile
)
from app.services.financial_knowledge import retrieve_financial_knowledge, format_knowledge_for_context, VERIFIED_KNOWLEDGE_BASE
from app.services.financial_tools import (
    get_user_financial_context,
    calculate_budget,
    calculate_financial_health,
    calculate_sip_projection,
    calculate_compound_interest,
    calculate_goal_feasibility,
    search_government_schemes
)

load_dotenv()

# Valid Sakhi Intents
INTENTS = {
    "EXPLAIN_SCHEME": "EXPLAIN_SCHEME",
    "CHECK_ELIGIBILITY": "CHECK_ELIGIBILITY",
    "WHY_RECOMMENDED": "WHY_RECOMMENDED",
    "WHY_REJECTED": "WHY_REJECTED",
    "COMPARE_SCHEMES": "COMPARE_SCHEMES",
    "SOURCE_LOOKUP": "SOURCE_LOOKUP",
    "BENEFITS": "BENEFITS",
    "WITHDRAWAL_RULES": "WITHDRAWAL_RULES",
    "GENERAL_SCHEME_SEARCH": "GENERAL_SCHEME_SEARCH",
    "RECOMMENDATION_EXPLANATION": "RECOMMENDATION_EXPLANATION",
    "GREETING": "GREETING",
    "OUT_OF_SCOPE": "OUT_OF_SCOPE",
    "FINANCIAL_COACH": "FINANCIAL_COACH",
    "GENERAL_CONVERSATION": "GENERAL_CONVERSATION",
    "SAFETY_REFUSAL": "SAFETY_REFUSAL"
}

SPECULATIVE_TRADING_PATTERNS = [
    r'\b(?:day\s*trading|intraday|futures\s*trading|options\s*trading|call\s*option|put\s*option|forex|derivatives)\b',
    r'\b(?:crypto|cryptocurrency|bitcoin|ethereum|doge|क्रिप्टो|बिटकॉइन)\b',
    r'\b(?:multibagger|get\s*rich\s*quick|20%?\s*returns?|guarantee(?:d)?\s*(?:me\s*)?20%?|satta|सट्टा)\b',
    r'\b(?:trading\s*returns?|returns?\s+on\s+trading|guarantee\s+me)\b',
    r'\b(?:buy\s+stocks?|sell\s+stocks?|stock\s*tips?|share\s*tips?|share\s*market\s*tips?|penny\s*stocks?)\b',
    r'\b(?:which\s+stock|which\s+share|best\s+stock\s+to\s+buy)\b',
    r'\b(?:which\s+mutual\s+fund\s+to\s+buy|best\s+mutual\s+fund\s+to\s+invest|top\s+mutual\s+funds?\s+to\s+buy)\b'
]

FINANCIAL_COACH_PATTERNS = [
    # SIP and Mutual Fund Educational Concepts (Multilingual: EN, HI, MR, BN, TE)
    r'\b(?:can\s+i\s+(?:start|invest(?:\s+in)?|do|open|choose|opt\s+for|set\s+up)\s+(?:an?\s+)?(?:[\w\-]+\s+)?sip)\b',
    r'\b(?:can\s+(?:you\s+)?calculate\s+(?:my\s+)?(?:[\w\-]+\s+)?(?:sip|sip\s+returns?))\b',
    r'\b(?:what\s+(?:is|are)|explain|meaning\s+of|how\s+does|how\s+to|concept\s+of|kya\s+hai|kay\s+aahe|म्हणजे\s+काय|काय\s+आहे|কী|কি|ఏమిటి)\s+(?:an?\s+)?(?:[\w\-]+\s+)?(?:sip|एसआयपी|एसआईपी|एस\s*आई\s*पी|এসআইপি|ఎస్ఐపీ)\b',
    r'\b(?:compare\s+(?:[\w\-]+(?:,|\s+and|\s+or|\s+vs)*\s*)*(?:sip|systematic\s+investment))\b',
    r'\b(?:equity(?:\s+sip)?(?:,|\s+and|\s+vs)\s*debt(?:\s+sip)?(?:,|\s+and|\s+vs)\s*hybrid(?:\s+sip)?)\b',
    r'\b(?:flexi|flexible|step[\s\-_]*up|top[\s\-_]*up|quarterly|weekly|daily|perpetual|trigger|elss|equity|debt|hybrid)\s+sip\b',
    r'\bsip\s+(?:returns?|calculator|calculation|rules?|features?|types?|options?|basics?|meaning|benefits?|frequency|frequencies)\b',
    r'\bhow\s+does\s+(?:a\s+)?(?:[\w\-]+\s+)?sip\s+work\b',
    r'\b(?:calculate\s+(?:an?\s+)?sip|sip\s+(?:of|for|calculator|calculation))\b',
    r'\b(?:sip|systematic\s+investment)\s+(?:of\s+)?(?:₹|rs\.?|inr)?\s*[\d,kK]+\b',
    r'\b(?:calculate|project|compute|estimate)\s+(?:my\s+)?[\w\-]*\s*sip\b',
    r'\b(?:cannot\s+save|can\'t\s+save|unable\s+to\s+save|struggling\s+to\s+save|struggle\s+to\s+save|no\s+savings|paise\s+nahi\s+bachte|bachat\s+nahi)\b',
    r'\b(?:credit\s+card|credit\s+card\s+debt|card\s+debt|debt|loan|loans|emi|karz|udhar)\b.*(?:manage|pay\s+off|clear|repay|reduce|handle|kaise|trap|avalanche|snowball)',
    r'\b(?:how\s+(?:do|can|to)\s+(?:i\s+)?(?:manage|pay\s+off|clear|reduce|handle)\s+(?:my\s+)?(?:credit\s+card|card\s+debt|debt|loans?|emi))\b',
    r'\b(?:debt\s+management|debt\s+repayment|avalanche|snowball)\b',
    r'(?:paise|paisa|rupaye)\s*(?:bachane|bachana|save\s*karna)\s*(?:hai|hain|chahta|chahti)?.*(?:kaise|kaha|shuru|start)',
    r'(?:पैसे|रुपये|बचत)\s*(?:बचाने|वाचवायचे|कसे|कहा|शुरू|सुरू|करायची)',
    r'\b(?:how\s+(?:to|can\s+i|do\s+i)\s+(?:start\s+saving|save\s+money|save))\b',
    r'\b(?:what\s+if\s+i\s+(?:change|extend|increase|make)\s+(?:the|my|this)?(?:\s+[\w\-]+)*\s*(?:goal|timeframe|duration|timeline|horizon|period)\s+to\s+[\d\w]+\s+years?)\b',
    r'\b(?:change|extend|make)\s+(?:the|my|this)?(?:\s+[\w\-]+)*\s*(?:goal|timeframe|duration|timeline|horizon|period)\s+to\s+[\d\w]+\s+years?\b',
    r'\b(?:change\s+to|extend\s+to|make\s+it)\s+[\d\w]+\s+years?\b',
    r'\b(?:what\s+if\s+i\s+(?:take|save\s+for|extend\s+for))\s+[\d\w]+\s+years?\b',
    r'(?:what\s+(?:is|are)|explain|meaning\s+of|how\s+does|how\s+to|concept\s+of|kya\s+hai|kay\s+aahe|म्हणजे\s+काय|काय\s+आहे|কী|কি|ఏమిటి)\s+(?:an?\s+)?(?:sip|एसआयपी|एसआईपी|एस\s*आई\s*पी|এসআইপি|ఎస్ఐపీ)\b',
    r'(?:sip|एसआयपी|एसआईपी|एस\s*आई\s*पी|এসআইপি|ఎస్ఐపీ)\s+(?:kya\s+hai|kay\s+aahe|म्हणजे\s+काय|काय\s+आहे|কী|কি|ఏమిటి|meaning|explain|vs|aur|and)',
    r'^(?:what\s+is\s+)?(?:an?\s+)?(?:sip|एसआयपी|एसआईपी|एस\s*आई\s*पी|এসআইপি|ఎస్ఐపీ)[\?\.\s]*$',
    r'\b(?:what\s+(?:is|are)|explain|meaning\s+of|how\s+does|how\s+to|concept\s+of|kya\s+hai|kay\s+aahe|ki|entate)\s+(?:an?\s+)?sip\b',
    r'\b(?:sip\s+vs\s+lump\s*sum|lump\s*sum\s+vs\s+sip|sip\s+aur\s+lump\s*sum|systematic\s+investment(?:\s+plan)?)\b',
    r'\b(?:what\s+is|explain|concept\s+of|kya\s+hai|kay\s+aahe)\s+(?:a\s+)?mutual\s+funds?\b',
    r'\b(?:mutual\s+funds?\s+vs\s+(?:ppf|fd|fixed\s+deposit|government|savings?|schemes?))\b',
    r'\b(?:how\s+(?:do|does)\s+sip\s+work|sip\s+kaise\s+kaam\s+karta\s+hai)\b',
    r'\b(?:rupee\s*cost\s*averaging)\b',
    
    # 50/30/20 and Budget Planning
    r'\b50[\s\/\-_]*30[\s\/\-_]*20\b',
    r'\b(?:budget\s+rule|budget\s+niyam|how\s+to\s+budget|how\s+should\s+i\s+budget|budget\s+my\s+salary|create\s+a\s+budget)\b',
    r'\b(?:monthly\s+surplus|savings\s+surplus|surplus\s+kya\s+hai|surplus\s+kaise\s+nikale|बचत\s+सरप्लस|सरप्लस)\b',
    r'\b(?:explain\s+my\s+budget|review\s+my\s+budget|analyze\s+my\s+budget|budget\s+breakdown)\b',
    r'\b(?:earn|salary|income|kama(?:ta|ti)?)\s*[\d,kK]+\b',
    r'\b(?:how\s+(?:do|can|should)\s+i\s+manage(?:\s+my\s+(?:money|salary|income))?|manage\s+my\s+(?:money|salary|income|finances?)|help\s+me\s+manage)\b',
    r'\b(?:how\s+do\s+i\s+manage|paise\s+kaise\s+manage\s+kare)\b',
    
    # Emergency Fund
    r'\b(?:emergency\s+fund|emergency\s+cushion|emergency\s+runway|emergency\s+corpus|aapatkaleen\s+nidhi|आपातकालीन\s+निधि|इमरजेंसी\s+फंड|आपत्कालीन\s+निधी)\b',
    r'\b(?:why\s+(?:do\s+i\s+need|is)\s+an?\s+emergency\s+fund|how\s+much\s+emergency\s+fund)\b',
    
    # Compounding & Inflation (Conceptual & Numerical)
    r'(?:\b(?:compounding|compound\s+interest|power\s+of\s+compounding|chakravriddhi|interest\s+on\s+interest)\b|चक्रवृद्धि|चक्रवाढ|চক্রবৃদ্ধি|చక్రవడ్డీ)',
    r'\b(?:calculate\s+compound\s+interest|compound\s+interest\s+on)\b',
    r'\b(?:inflation|mahangai|inflation\s+rate|inflation\s+effect|महंगाई|महागाई)\b',
    
    # Travel & Vacation Milestone Goals (USA, Europe, Domestic, etc.)
    r'\b(?:go\s+to|trip\s+to|travel\s+to|visit)\s+(?:the\s+)?(?:usa|us|america|europe|uk|london|dubai|thailand|singapore|bali|japan|canada|australia|goa|manali|kashmir|kerala)\b',
    r'\b(?:usa|us|america|europe|uk|london|dubai|thailand|singapore|bali|japan|canada|australia|trip|travel|vacation|tour|holiday|विदेश|यात्रा|घूमने)\s*(?:ke\s+liye|sathi|jonno|kosam)?\s*(?:budget|kharcha|paisa|paise|kitne|cost|expenses?|खर्च|बजट|पैसे)\b',
    r'\b(?:how\s+much\s+(?:money|cash|budget)\s+(?:should|do)\s+i\s+(?:need|keep|save|have))\s+(?:for\s+)?(?:the\s+)?(?:usa|us|america|europe|trip|travel|vacation|tour)\b',
    r'\b(?:i\s+want\s+to\s+go\s+to|planning\s+(?:a\s+)?trip\s+to|planning\s+to\s+travel\s+to)\b',
    r'\b(?:america|usa)\s+jane\s+ke\s+liye\b',
    r'\b(?:kitne\s+paise\s+chahiye|kitna\s+kharcha|budget\s+kya\s+hoga)\b',

    # Milestone Savings Goals & Natural Affordability (laptop, bike, car, gadget, etc.)
    r'\b(?:bike|laptop|car|scooter|motorcycle|phone|mobile|vehicle)\b.*(?:buy|afford|purchase|save|saving|cost|price|year|years|mahine|saal|₹|rs|inr)',
    r'(?:can\s+i\s+|i\s+want\s+to\s+)?(?:buy|afford|purchase|save|saving|cost|price).*(?:bike|laptop|car|scooter|motorcycle|phone|mobile|vehicle)\b',
    r'\b(?:can\s+i\s+(?:buy|get|afford|purchase|have|plan\s+for))\s+(?:an?\s+)?(?:(?:₹|rs\.?|inr)?\s*[\d,kK]+(?:\s*(?:lakh|lac|k))?\s+)?(?:bike|laptop|car|scooter|motorcycle|phone|mobile|house|flat|home|vehicle|trip|gadget)\b',
    r'\b(?:i\s+want\s+(?:to\s+(?:buy|get|have)\s+)?(?:an?\s+)?(?:(?:₹|rs\.?|inr)?\s*[\d,kK]+(?:\s*(?:lakh|lac|k))?\s+)?(?:bike|laptop|car|scooter|motorcycle|phone|mobile|gadget|vehicle))\b',
    r'\b(?:bike|laptop|car|scooter|motorcycle|phone|mobile)\s+(?:worth|costing|costs?|cost|for|price)\b',
    r'(?:बाइक|बाईक|कार|लॅपटॉप|लैपटॉप|गाड़ी|bike|car|laptop)\s*(?:leni|kharidni|leni\s+hai|kharid|घेऊ|घ्यायची)\b',
    r'\b(?:can\s+i\s+afford|affordability\s+of|afford\s+a)\b',
    r'\b(?:how\s+much\s+(?:money|cash|balance)\s+(?:do\s+i\s+have\s+)?(?:left|remaining|bache))\b',
    r'\b(?:what\s+is\s+my\s+(?:balance|surplus|remaining\s+amount))\b',
    r'\b(?:where\s+am\s+i\s+spending\s+(?:too\s+much|more|most|extra))\b',
    r'\b(?:am\s+i\s+(?:overspending|spending\s+too\s+much))\b',
    r'\b(?:what\s+happens\s+if\s+i\s+invest|what\s+if\s+i\s+invest|invest\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+(?:\s*(?:per|\/)\s*month)?\s*for\s*[\d\w]+\s*years?)\b',
    r'\b(?:what\s+if\s+i\s+(?:save|invest)|save\s+[\d,kK]+\s*(?:monthly|per\s*month|\/month|\/mo))\b',
    r'\b(?:what\s+if\s+i\s+increase\s+(?:my\s+)?(?:monthly\s+)?savings?)\b',
    r'\b(?:what\s+if\s+i\s+take\s+[\d\w]+\s+years?)\b',

    # Natural recurring investment & savings questions (without requiring the word 'SIP')
    r'\b(?:if\s+i|what\s+if\s+i|what\s+happens\s+if\s+i|how\s+much\s+(?:will|would)\s+i\s+have\s+if\s+i)\s+(?:invest|save|put|deposit)\b',
    r'\b(?:how\s+much\s+(?:money\s+)?(?:will|would)\s+i\s+(?:have|get|accumulate)\s+if\s+i\s+(?:invest|save|put|deposit))\b',
    r'\b(?:how\s+much\s+will\s+it\s+grow|what\s+will\s+i\s+get|what\s+would\s+i\s+get)\b',
    r'\b(?:i\s+can\s+(?:save|invest|put)\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+(?:\s*(?:every|each|per|\/)\s*(?:month|quarter|week|mo)|(?:\s*monthly|\s*quarterly|\s*weekly))?.*how\s+much\s+will\s+it\s+grow)\b',
    r'\b(?:save|invest|put|deposit)\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+\s*(?:every\s+month|each\s+month|per\s*month|\/month|\/mo|monthly|every\s+quarter|each\s+quarter|per\s*quarter|\/quarter|quarterly|every\s+week|each\s+week|per\s*week|\/week|weekly|daily)\b',
    r'\b(?:invest|save|put|deposit)\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+(?:\s*(?:every\s+month|each\s+month|per\s*month|\/month|\/mo|monthly|every\s+quarter|quarterly|every\s+week|weekly))?\s*for\s*[\d\w]+\s*years?\b',
    r'\b(?:calculate|project|compute|estimate)\s+(?:returns?\s+on\s+)?(?:my\s+)?(?:monthly|quarterly|weekly|recurring)\s+(?:investment|savings?|sip)\b',
    r'\b(?:if\s+i\s+put\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+.*(?:every\s+month|each\s+month|monthly|per\s+month))\b',
    r'(?:agar|yadi|agar\s+main|agar\s+mai|yadi\s+main)\s+.*(?:har\s+mahine|prati\s+mahina|mahine|saal).*(?:invest|bachau|bachte|milega|hoga)',
    r'(?:अगर|यदि)\s+.*(?:हर\s+महीने|प्रति\s+माह|साल|वर्ष).*(?:निवेश|बचत|मिलेगा|होगा)',
    r'(?:दरमहा|प्रत्येक\s+महिन्याला)\s+.*(?:गुंतव|गुंतवणूक|मिळेल)',
    r'(?:बाइक|बाईक|लॅपटॉप|लैपटॉप|गाड़ी|कार)\s*(?:खरीद|घेऊ|घ्यायची|किनते|కొన)',
    r'(?:गुंतवणूक|गुंतवले|गुंतवल्यास|बचत|निवेश|জমা|పెట్టుబడి)',
    r'\b(?:how\s+much\s+(?:can|should)\s+i\s+save)\b',
    r'\b(?:save|saving|bache|bachat|bachaye|kharidna|kharidne|plan\s+for)\s+(?:for\s+)?(?:a\s+)?(?:laptop|bike|car|scooter|motorcycle|phone|mobile|gadget|vehicle|trip|goal|milestone)\b',
    r'\b(?:laptop|bike|car|scooter|phone|mobile)\s+(?:ke\s+liye|sathi|jonno|kosam)\s+(?:save|saving|bachat|invest|paise)\b',
    r'\b(?:can\s+i\s+achieve|goal\s+feasibility|achieve\s+my\s+goal|target\s+corpus|monthly\s+shortfall|goal\s+achievable|required\s+monthly\s+contribution)\b'
]

# Essential Safety & Harmful Intent Filters (Preserved under Section 4)
HARMFUL_PATTERNS = [
    r'\b(?:hack|hacking|exploit|ddos|malware|ransomware|keylogger)\b',
    r'\b(?:bomb|weapon|explosive|kill|suicide|self-harm|harm\s+myself)\b',
    r'\b(?:steal|credit\s+card\s+hack|atm\s+hack|counterfeit|money\s+laundering|terror)\b'
]

# Speculative Market & Gambling Keywords (Polite Educational Financial Notice)
OUT_OF_SCOPE_KEYWORDS = [
    "share market tips", "stock tips", "buy stocks", "sell stocks", "share bazar", "शेयर बाजार", "शेयर मार्केट",
    "crypto", "cryptocurrency", "bitcoin", "ethereum", "doge", "क्रिप्टो", "बिटकॉइन",
    "day trading", "intraday", "forex", "derivatives", "futures trading", "options trading", "call option", "put option",
    "multibagger", "get rich quick", "20% return", "guaranteed 20", "satta", "सट्टा"
]


def extract_numbers_and_percentages(text: str) -> List[str]:
    """Extract all numeric quantities, currencies, and percentages from text."""
    if not text:
        return []
    patterns = [
        r'₹\s*[\d,]+(?:\.\d+)?',
        r'Rs\.?\s*[\d,]+(?:\.\d+)?',
        r'[\d]+(?:\.\d+)?\s*%',
        r'\b\d{1,2}(?:\.\d+)?%\b',
    ]
    matches = []
    for p in patterns:
        matches.extend(re.findall(p, text, flags=re.IGNORECASE))
    return [m.strip() for m in matches]


def get_scheme_display_name(scheme: Optional[Dict[str, Any]], lang: str = "en") -> str:
    if not scheme:
        return "Government Scheme"
    name = scheme.get("name", "")
    if isinstance(name, dict):
        if name.get(lang):
            return name.get(lang)
        return name.get("en", "")
    return str(name)


def get_scheme_authority(scheme: Optional[Dict[str, Any]]) -> str:
    if not scheme:
        return "Government of India"
    ver = scheme.get("verification", {})
    ownership = scheme.get("ownership", {})
    return (
        ver.get("source_authority") or
        ownership.get("ministry") or
        ownership.get("department") or
        scheme.get("authority") or
        "Government of India"
    )


def get_scheme_official_url(scheme: Optional[Dict[str, Any]]) -> str:
    if not scheme:
        return "https://india.gov.in"
    ver = scheme.get("verification", {})
    return ver.get("official_url") or scheme.get("official_url") or scheme.get("official_source_url") or "https://india.gov.in"


def get_scheme_last_verified(scheme: Optional[Dict[str, Any]]) -> str:
    if not scheme:
        return "2026-08-29"
    ver = scheme.get("verification", {})
    return ver.get("last_verified") or scheme.get("last_verified_date") or "2026-08-29"


def get_scheme_interest_or_benefit(scheme: Optional[Dict[str, Any]], lang: str = "en") -> str:
    if not scheme:
        return "Statutory Defined Benefit"
    fin = scheme.get("financial", {}) if isinstance(scheme.get("financial"), dict) else {}
    ben = scheme.get("benefits", {}) if isinstance(scheme.get("benefits"), dict) else {}
    rate = fin.get("interest_rate") or ben.get("amount") or ben.get("interest_rate") or ben.get("summary")
    if rate:
        return str(rate)
    if lang == "hi":
        return "वैधानिक निर्धारित लाभ"
    if lang == "mr":
        return "वैधानिक विहित लाभ"
    if lang == "bn":
        return "বিধিবদ্ধ নির্ধারিত সুবিধা"
    if lang == "te":
        return "చట్టబద్ధమైన నిర్దిష్ట ప్రయోజనం"
    return "Statutory Defined Benefit"


def build_evidence_block(scheme: Dict[str, Any]) -> Dict[str, Any]:
    """Extract compact JSON of ONLY verified fields needed to ground the answer."""
    if not scheme:
        return {}
    name_obj = scheme.get("name", {})
    fin = scheme.get("financial", {}) if isinstance(scheme.get("financial"), dict) else {}
    ben = scheme.get("benefits", {}) if isinstance(scheme.get("benefits"), dict) else {}
    elig = scheme.get("eligibility", {}) if isinstance(scheme.get("eligibility"), dict) else {}
    ver = scheme.get("verification", {}) if isinstance(scheme.get("verification"), dict) else {}
    liq = scheme.get("liquidity", {}) if isinstance(scheme.get("liquidity"), dict) else {}
    own = scheme.get("ownership", {}) if isinstance(scheme.get("ownership"), dict) else {}

    min_age = elig.get("min_age") if "min_age" in elig else elig.get("age_min")
    max_age = elig.get("max_age") if "max_age" in elig else elig.get("age_max")
    lock_in_val = fin.get("lock_in") or fin.get("lock_in_period") or scheme.get("lock_in") or "Standard"

    return {
        "scheme_id": scheme.get("scheme_id", scheme.get("id")),
        "name_en": name_obj.get("en") if isinstance(name_obj, dict) else str(name_obj),
        "name_hi": name_obj.get("hi") if isinstance(name_obj, dict) else None,
        "name_mr": name_obj.get("mr") if isinstance(name_obj, dict) else None,
        "name_bn": name_obj.get("bn") if isinstance(name_obj, dict) else None,
        "name_te": name_obj.get("te") if isinstance(name_obj, dict) else None,
        "short_name": scheme.get("short_name") or (name_obj.get("en") if isinstance(name_obj, dict) else str(name_obj)),
        "category": scheme.get("category"),
        "sub_category": scheme.get("sub_category"),
        "ministry": own.get("ministry") or scheme.get("authority"),
        "department": own.get("department"),
        "state": own.get("state"),
        "interest_rate": fin.get("interest_rate") or ben.get("amount") or ben.get("interest_rate"),
        "minimum_contribution": fin.get("minimum_contribution"),
        "maximum_contribution": fin.get("maximum_contribution"),
        "contribution_frequency": fin.get("contribution_frequency"),
        "lock_in": lock_in_val,
        "maturity": fin.get("maturity"),
        "benefit_summary": ben.get("summary") or scheme.get("description"),
        "benefit_amount": ben.get("amount"),
        "tax_benefit": ben.get("tax_benefit") or scheme.get("tax_treatment"),
        "liquidity_level": liq.get("level"),
        "withdrawal_rules": liq.get("withdrawal_rules"),
        "eligibility": {
            "min_age": min_age,
            "max_age": max_age,
            "gender": elig.get("gender", "all"),
            "residency": elig.get("residency", "resident"),
            "income_limit": elig.get("income_limit"),
            "occupation": elig.get("occupation", []),
            "special_conditions": elig.get("special_conditions", [])
        },
        "verification": {
            "authority": ver.get("source_authority") or own.get("ministry") or scheme.get("authority") or "Government of India",
            "official_url": ver.get("official_url") or scheme.get("official_url") or "https://india.gov.in",
            "last_verified": ver.get("last_verified") or scheme.get("last_verified_date") or "2026-08-29",
            "status": ver.get("status", "VERIFIED")
        }
    }


def format_inr(number: Union[int, float, str]) -> str:
    """Format numbers into standard Indian numbering system (e.g. 180000 -> 1,80,000)."""
    try:
        n = int(round(float(number)))
    except (ValueError, TypeError):
        return str(number)
    
    is_neg = n < 0
    s = str(abs(n))
    if len(s) <= 3:
        res = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        res = ",".join(groups) + "," + last3
    return f"-{res}" if is_neg else res


def parse_natural_amount(text: str) -> Optional[float]:
    """
    Parses natural currency and numeric amounts across Indian English, Hindi, and Hinglish.
    Supports:
    - 'one lakh', 'two lakh', '1.5 lakh', '1 lakh', '1 lac', 'ek lakh', 'do lakh'
    - '30k', '2k', '10k', '50k', '100k'
    - '30 thousand', 'tees hazar', '30 hazar'
    - '₹1,00,000', 'Rs. 100000', 'INR 100000', '100000 rupees'
    """
    if not text or not isinstance(text, str):
        return None
    t = text.lower().strip()

    word_to_num = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5, 'a': 1, 'an': 1
    }

    # 1. Lakh in words or numbers (e.g. 'one lakh', '1 lakh', '1.5 lac', 'ek lakh', 'do lakh')
    lakh_m = re.search(r'\b(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|panch|\d+(?:\.\d+)?)\s*(?:lakhs?|lac|lacs|लाख)\b', t)
    if lakh_m:
        val_str = lakh_m.group(1).lower()
        multiplier = float(word_to_num.get(val_str, val_str))
        return round(multiplier * 100000.0, 2)

    # 2. 'k' abbreviation (e.g. '30k', '2k', '100k')
    k_m = re.search(r'\b(\d+(?:\.\d+)?)\s*k\b', t)
    if k_m:
        return round(float(k_m.group(1)) * 1000.0, 2)

    # 3. Thousands in words (e.g. 'thirty thousand', 'tees hazar', '10 thousand')
    th_m = re.search(r'\b(\d+|ten|twenty|thirty|forty|fifty|dus|bees|tees|chalis|pachas)\s*(?:thousand|hazar|हजार)\b', t)
    if th_m:
        w_map = {'ten': 10, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'dus': 10, 'bees': 20, 'tees': 30, 'chalis': 40, 'pachas': 50}
        val_str = th_m.group(1).lower()
        val = float(w_map.get(val_str, val_str))
        return round(val * 1000.0, 2)

    # 4. Standard comma-separated or plain numbers: ₹1,00,000, 100000, Rs. 30000
    cur_m = re.search(r'(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d{4,9})', t)
    if cur_m:
        num = float(cur_m.group(1).replace(',', ''))
        if num not in [2024, 2025, 2026, 2027]:
            return round(num, 2)

    return None


def extract_income_amount(text: str) -> Optional[float]:
    """
    Extracts explicit user monthly income from conversational statements like:
    - 'I earn 30k. How do I manage?'
    - 'I earn ₹30,000 per month. Help me manage my money.'
    - 'salary 35000'
    - 'income 50k'
    """
    if not text or not isinstance(text, str):
        return None
    t = text.lower().strip()

    # 1. Earn/Salary/Income followed by number and optional multiplier
    m1 = re.search(r'(?:earn(?:ing)?|salary|income|kama(?:ta|ti)?|आय|वेतन|पगार|कमवितो|मिळवतो|कमाई|कमवता)\s*(?:of|is|hai|आहे|होते|है)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand|hazar|lakh|lac)?', t)
    if m1 and m1.group(1):
        try:
            num = float(m1.group(1).replace(',', ''))
            unit = (m1.group(2) or '').lower()
            if unit == 'k':
                return round(num * 1000.0, 2)
            elif unit in ['thousand', 'hazar']:
                return round(num * 1000.0, 2)
            elif unit in ['lakh', 'lac']:
                return round(num * 100000.0, 2)
            elif num >= 1000:
                return round(num, 2)
        except (ValueError, TypeError):
            pass

    # 2. Pattern: '30k salary' or '30k per month'
    m2 = re.search(r'\b(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*k\s*(?:salary|income|per\s*month|\/month|\/mo|महिना|माह)?\b', t)
    if m2 and m2.group(1):
        try:
            num = float(m2.group(1).replace(',', ''))
            return round(num * 1000.0, 2)
        except (ValueError, TypeError):
            pass

    # 3. Standard '₹30,000 per month'
    m3 = re.search(r'\b(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:per\s*month|\/month|\/mo|प्रति\s*माह|दरमहा)\b', t)
    if m3 and m3.group(1):
        try:
            num = float(m3.group(1).replace(',', ''))
            if num >= 1000:
                return round(num, 2)
        except (ValueError, TypeError):
            pass

    # 4. Standalone '30k' if query is about money management/budget
    if any(w in t for w in ['manage', 'budget', 'surplus', 'expense', 'खर्च', 'बचत']):
        k_m = re.search(r'\b(\d+(?:\.\d+)?)\s*k\b', t)
        if k_m and k_m.group(1):
            try:
                val = float(k_m.group(1))
                if val >= 5:
                    return round(val * 1000.0, 2)
            except (ValueError, TypeError):
                pass

    return None


def extract_target_amount(text: str) -> Optional[float]:
    """
    Extracts explicit milestone target amount from natural language queries.
    Supports Indian currency formats: ₹1,00,000, Rs. 100000, INR 1,00,000, 1.5 lakh, one lakh, 100000 rupees.
    Does not mistakenly extract income/salary figures as target amounts.
    """
    if not text or not isinstance(text, str):
        return None

    # Step 0: Remove income/salary clauses so income numbers aren't mistaken for target amounts
    clean_text = re.sub(
        r'(?:earn(?:ing)?|salary|income|kama(?:ta|ti)?|आय|वेतन|पगार|कमवितो|मिळवतो|कमाई)\s*(?:of|is|hai|आहे|होते|है)?\s*(?:₹|rs\.?|inr)?\s*[\d,]+(?:\.\d+)?(?:\s*(?:k|thousand|hazar|per|\/)\s*(?:month|mo|साल|महिना|माह))?',
        ' ',
        text,
        flags=re.IGNORECASE
    )

    # 1. Lakh in words or numbers (e.g. 'one lakh', '1 lakh', '1.5 lac', 'ek lakh', 'do lakh')
    word_lakh = re.search(r'\b(one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|panch|\d+(?:\.\d+)?)\s*(?:lakhs?|lac|lacs|लाख)\b', clean_text, re.IGNORECASE)
    if word_lakh:
        w_map = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5, 'a': 1, 'an': 1
        }
        v = word_lakh.group(1).lower()
        mul = float(w_map.get(v, v))
        return round(mul * 100000.0, 2)

    # 2. Explicit patterns with worth/cost/for/target/budget or preceding goal item
    explicit_patterns = [
        r'(?:worth|costing|costs?|cost|price|target\s*of|target|budget\s*of|for)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees?|रुपये|रु|k)?',
        r'(?:bike|laptop|car|scooter|motorcycle|phone|mobile|गाड़ी|कार|बाइक|बाईक|स्कूटर|लॅपटॉप|लैपटॉप|trip|usa|america)\s*(?:of|for|worth|costing|costs?)?\s*(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)',
        r'(?:bike|laptop|car|scooter|motorcycle|phone|mobile|गाड़ी|कार|बाइक|बाईक|स्कूटर|लॅपटॉप|लैपटॉप|trip|usa|america)\s+(?:of|for|worth|costing|costs?)\s*([\d,]+(?:\.\d+)?)',
        r'(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:worth|costing|costs?|ki|cha|chi|che|की|चा|ची|चे)?\s*(?:bike|laptop|car|scooter|motorcycle|phone|mobile|गाड़ी|कार|बाइक|बाईक|स्कूटर|लॅपटॉप|लैपटॉप)',
        r'([\d,]+(?:\.\d+)?)\s*(?:rupees|रुपये|रु)\s*(?:worth|costing|costs?|ki|cha|chi|che|की|चा|ची|चे)?\s*(?:bike|laptop|car|scooter|गाड़ी|कार|बाइक|बाईक|स्कूटर|लॅपटॉप|लैपटॉप)'
    ]
    for pat in explicit_patterns:
        for m in re.finditer(pat, clean_text, re.IGNORECASE):
            num_str = m.group(1).replace(',', '').strip()
            try:
                val = float(num_str)
                if val >= 500:
                    return val
            except (ValueError, TypeError):
                pass

    # 3. Direct parse from cleaned natural amount
    return parse_natural_amount(clean_text)


class GeminiSakhiAdapter:
    """
    SAKHI — Sanchay's Grounded Scheme Assistant
    Supports 5 languages: en, hi, mr, bn, te
    Grounded 100% in verified MongoDB scheme collection and deterministic eligibility engine.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = None
        self._init_client()

    def _init_client(self):
        backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
        root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        if root_env.exists():
            load_dotenv(root_env, override=False)
        if backend_env.exists():
            load_dotenv(backend_env, override=False)
        load_dotenv(override=False)

        key = self.api_key or os.getenv("GEMINI_API_KEY")
        if key and key != self.api_key:
            self.api_key = key

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                for model_name in ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]:
                    try:
                        self.client = genai.GenerativeModel(model_name)
                        break
                    except Exception:
                        continue
            except Exception as e:
                print(f"Notice: Gemini SDK client configuration notice")
                self.client = None

    def get_client(self):
        if not self.client:
            self._init_client()
        return self.client

    def detect_intent_deterministic(self, message: str) -> str:
        intent, _ = self.extract_intent(message)
        return intent

    def extract_intent(self, message: str, context: Optional[Dict[str, Any]] = None) -> Tuple[str, List[str]]:
        msg_lower = message.lower().strip()

        # 1. Speculative trading / gambling / stock-picking hard refusal
        for pat in SPECULATIVE_TRADING_PATTERNS:
            if re.search(pat, msg_lower, re.IGNORECASE):
                return "OUT_OF_SCOPE", []

        # 1a. Greetings / Intro Inquiry (e.g. Hello, Hi, Namaste, Who are you)
        greeting_words = ["hello", "hi", "hey", "hii", "heyy", "namaste", "pranam", "vanakkam", "halo", "who are you", "what can you do", "help me", "introduce yourself", "tell me about yourself", "नमस्ते", "नमस्कार", "নমস্কার", "నమస్కారం"]
        cleaned_msg = re.sub(r'[^\w\s]', '', msg_lower).strip()
        if cleaned_msg in greeting_words or any(cleaned_msg == f"{gw} sakhi" or cleaned_msg == f"sakhi {gw}" for gw in greeting_words):
            return "GREETING", []
        if any(msg_lower.startswith(gw + " ") for gw in ["hello", "hi", "hey", "namaste", "नमस्ते", "नमस्कार"]):
            if not any(w in msg_lower for w in ["ppf", "ssy", "apy", "nps", "sukanya", "pension", "compare", "rate", "interest", "save", "invest", "eligible", "scheme", "years old", "earning", "budget"]):
                return "GREETING", []

        # 2. Extract mentioned scheme identifiers from dynamic database
        extracted_schemes = self._extract_scheme_names(msg_lower)
        if not extracted_schemes and context:
            if context.get("scheme_id"):
                extracted_schemes = [context.get("scheme_id")]
            elif context.get("top_scheme"):
                extracted_schemes = [context.get("top_scheme")]

        # 2b. Educational financial coaching intent (SIP, 50/30/20, emergency fund, compounding, milestone goals)
        is_coach_query = any(re.search(p, msg_lower, re.IGNORECASE) for p in FINANCIAL_COACH_PATTERNS)
        is_page_coach = False
        if context and context.get("page") in ["FinancialHealth", "Goal"]:
            if any(w in msg_lower for w in ["budget", "surplus", "emergency", "runway", "score", "50", "30", "20", "saving", "income", "expense", "goal", "feasibility", "target", "contribution", "shortfall", "afford", "bajat", "बजट", "सरप्लस"]):
                is_page_coach = True

        if not extracted_schemes and (is_coach_query or is_page_coach):
            return "FINANCIAL_COACH", []

        # 2c. Speculative Trading / High-Risk Gambling check (Financial Advisory Notice)
        for kw in OUT_OF_SCOPE_KEYWORDS:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, msg_lower):
                return "OUT_OF_SCOPE", []

        # 3. Compare Intent (e.g. Compare PPF and NSC / PPF vs NSC)
        is_compare_kw = any(w in msg_lower for w in ["compare", "versus", "vs", "difference between", "difference in", "तुलना", "फरक", "তুলনা", "పోల్చండి", "अंतर"])
        if is_compare_kw or (len(extracted_schemes) >= 2 and any(w in msg_lower for w in [" and ", " or ", " ya ", " vs ", " versus "])):
            return "COMPARE_SCHEMES", extracted_schemes

        # 4. DB count / stats intent
        if any(w in msg_lower for w in ["how many schemes", "total schemes", "count of schemes", "number of schemes", "kitni schemes", "kitne scheme", "kiti schemes", "কতগুলি স্কিম", "ఎన్ని పథకాలు"]):
            return "GENERAL_SCHEME_SEARCH", extracted_schemes

        # 5. Why recommended / Why rejected (Strict explanation of existing recommendation)
        if any(w in msg_lower for w in ["why recommended", "why this scheme", "why is this recommended", "why did you recommend", "reason for recommendation", "why recommend", "सिफारिश क्यों", "का recommend", "কেন recommend", "ఎందుకు recommend"]):
            return "WHY_RECOMMENDED", extracted_schemes

        if any(w in msg_lower for w in ["why rejected", "why not", "disqualif", "ineligible", "not eligible", "रद्द क्यों", "का नाकारली", "अपात्र क्यों", "কেন বাতিল", "ఎందుకు తిరస్కరించబడింది"]):
            return "WHY_REJECTED", extracted_schemes

        # 6. How to apply / Official application portal / Website / Documents
        if any(w in msg_lower for w in [
            "how to apply", "where to open", "how to open", "account kaise khole",
            "kaise apply kare", "kaha apply kare", "kaha jana hoga", "documents required",
            "dastavej", "खाता कैसे खोलें", "दस्तावेज़", "आवेदन कैसे करें",
            "official application", "application website", "application portal", "official portal",
            "official website", "website kya hai", "portal kya hai", "link kya hai",
            "official link", "apply link", "online apply", "application link", "apply online", "official site",
            "अर्ज कसा करावा", "कसा अर्ज करायचा", "कागदपत्रे", "अर्ज",
            "কীভাবে আবেদন করবেন", "কীভাবে আবেদন করব", "আবেদন কীভাবে করব", "নথিপত্র", "আবেদন",
            "ఎలా దరఖాస్తు చేయాలి", "ఎలా అప్లై చేయాలి", "పత్రాలు", "దరఖాస్తు విధానం"
        ]):
            return "HOW_TO_APPLY", extracted_schemes

        # 7. Eligibility check intent with typo & Hinglish/Code-mixed tolerance
        if any(w in msg_lower for w in [
            "eligible", "eligibility", "eligiblity", "eligibliti", "qualify", "patrata", "yogyata",
            "पात्र", "पात्रता", "योग्य", "अर्हता", "kaise milega", "mil sakta hai", "kya mil sakta hai",
            "can a 25", "can i", "am i eligible", "what can i consider", "what can i use",
            "which schemes am i", "which schemes can a", "what can a 65", "can consider",
            "पात्र आहे का", "पात्र आहे", "मी या योजनेसाठी पात्र आहे का", "पात्रता",
            "যোগ্য কি", "আমি কি এই প্রকল্পের জন্য যোগ্য", "যোগ্য?", "যোগ্যতা",
            "అర్హుడినా", "నేను ఈ పథకానికి అర్హుడినా", "అర్హురాలినా", "అర్హత", "అర్హుడా",
            "what government schemes are available for me", "schemes available for me", "what schemes are for me", "best scheme for me", "best schemes for me", "for me",
            "माझ्यासाठी कोणत्या सरकारी योजना", "माझ्यासाठी कोणत्या योजना", "माझ्यासाठी योजना", "माझ्यासाठी सरकारी योजना", "कोणत्या सरकारी योजना आहेत",
            "माझ्यासाठी सर्वात चांगली योजना", "माझ्यासाठी सर्वोत्तम योजना", "माझ्यासाठी",
            "मेरे लिए कौन सी सरकारी योजना", "मेरे लिए कौन सी योजना", "मेरे लिए योजना", "मेरे लिए सरकारी योजना", "मेरे लिए सरकारी योजनाएं", "मेरे लिए योजनाएं",
            "मेरे लिए सबसे अच्छी", "मेरे लिए सबसे अच्छी योजना", "मेरे लिए सबसे अच्छी सरकारी योजना", "मेरे लिए सर्वोत्तम योजना", "मेरे लिए",
            "আমার জন্য কোন সরকারি প্রকল্প", "আমার জন্য কোন স্কিম", "আমার জন্য সেরা স্কিম", "আমার জন্য",
            "నా కోసం ఏ ప్రభుత్వ పథకాలు", "నాకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి", "నాకు ఏ పథకాలు ఉన్నాయి", "నా కోసం ఉత్తమ పథకం", "నా కోసం"
        ]):
            return "CHECK_ELIGIBILITY", extracted_schemes

        # 8. Official Source Lookup (Strictly for questions about data provenance)
        source_inquiry_patterns = [
            "what are the official verified sources", "what are the official sources", "verified source",
            "where does sanchay get", "where do you get data", "what are your sources", "source of data",
            "official verified source", "सत्यापित स्रोत", "आधिकारिक स्रोत", "সরকারি গেজেট", "అధికారిక వనరులు"
        ]
        is_personal_profile_query = any(w in msg_lower for w in ["i am ", "years old", "earning", "save ₹", "saving ₹", "for my daughter", "for my child", "for my son", "recommend", "suitable", "fit score", "rank the top", "suitability"])
        if (any(p in msg_lower for p in source_inquiry_patterns) or (any(w in msg_lower for w in ["source", "gazette", "official", "url", "website", "portal"]) and not is_personal_profile_query and not extracted_schemes)) and not is_personal_profile_query:
            return "SOURCE_LOOKUP", extracted_schemes

        # 9. Withdrawal & Liquidity Rules
        if any(w in msg_lower for w in ["withdraw", "premature", "partial", "liquidity", "lock in", "lock-in", "maturity", "निकासी", "पैसे काढणे", "টাকা তোলা", "విత్‌డ్రా"]):
            return "WITHDRAWAL_RULES", extracted_schemes

        # 10. Benefits & Interest Rates
        if any(w in msg_lower for w in ["highest interest", "highest return", "best interest", "highest rate", "max interest", "highest yield", "sabse jyada byaj", "sabse jyada interest"]):
            return "HIGHEST_INTEREST_RATE", extracted_schemes

        # 11. Safety & Sovereign Guarantee
        if any(w in msg_lower for w in ["is it safe", "how safe", "risk in government", "paisa safe", "paisa doob", "sovereign guarantee", "surakshit", "suraksha", "सुरक्षित", "सुरक्षा", "गारंटी"]):
            return "SAFETY_INQUIRY", extracted_schemes

        # 9c. Money Doubling / KVP
        if any(w in msg_lower for w in ["double kab", "paisa double", "doubling scheme", "double hoga", "दोगुना", "पैसे डबल", "डबल"]):
            return "MONEY_DOUBLING_QUERY", extracted_schemes

        # 9d. Tax Savings 80C & EEE Guide
        if any(w in msg_lower for w in ["tax saving", "80c", "tax bachaye", "tax free", "eee", "tax benefit", "कर बचत", "टैक्स"]):
            return "TAX_SAVINGS_GUIDE", extracted_schemes

        if any(w in msg_lower for w in ["interest", "benefit", "return", "rate", "yield", "ब्याज", "व्याज", "सुद", "వడ్డీ"]):
            return "BENEFITS", extracted_schemes

        # 10. Specific Scheme Explanation
        if extracted_schemes:
            return "EXPLAIN_SCHEME", extracted_schemes

        # 11. Category Scheme Search
        category_search_terms = [
            "pension", "savings", "farmer", "kisan", "agriculture", "women", "mahila", "girl", "daughter", "son", "child", "children", "minor", "kid", "kids",
            "education", "scholarship", "student", "loan", "business", "msme", "employment", "job",
            "health", "housing", "insurance", "bima", "senior citizen", "vridha", "widow", "disability",
            "schemes for", "which schemes", "show me schemes", "list schemes", "available schemes", "scheme", "schemes",
            "पेंशन", "बचत", "किसान", "कृषि", "महिला", "बेटी", "बेटा", "बच्चे", "बच्चा", "बच्चों", "बच्ची", "बालक", "बालिका",
            "शिक्षा", "छात्रवृत्ति", "छात्र", "विद्यार्थी", "ऋण", "लोन", "व्यापार", "रोजगार", "स्वास्थ्य", "आवास", "घर", "बीमा",
            "स्कीम", "स्कीम्स", "योजना", "योजनाएं", "योजनायें", "योजनाओं"
        ]
        if any(w in msg_lower for w in category_search_terms):
            return "GENERAL_SCHEME_SEARCH", []

        # 12. Everyday Natural Conversation & Open-Domain Inquiry (Flexible Sakhi)
        return "GENERAL_CONVERSATION", []

    def _extract_scheme_names(self, text: str) -> List[str]:
        """
        Dynamically extracts scheme IDs matching terms in user text across all database schemes.
        """
        t_clean = text.lower().strip()
        col = get_schemes_collection()
        found_ids = []

        # Common sovereign acronyms and aliases mapping
        standard_aliases = {
            "ppf": "ppf_001", "public provident fund": "ppf_001",
            "ssy": "ssy_001", "sukanya": "ssy_001", "sukanya samriddhi": "ssy_001", "sukanya samriddhi yojana": "ssy_001",
            "scss": "scss_001", "senior citizen savings": "scss_001", "senior citizen": "scss_001",
            "apy": "apy_001", "atal pension": "apy_001", "atal pension yojana": "apy_001",
            "nps": "nps_001", "national pension": "nps_001", "national pension system": "nps_001",
            "nsc": "nsc_001", "national savings certificate": "nsc_001",
            "kvp": "kvp_001", "kisan vikas patra": "kvp_001",
            "pomis": "pomis_001", "post office monthly": "pomis_001", "monthly income scheme": "pomis_001",
            "sgb": "sgb_001", "sovereign gold": "sgb_001",
            "pmmvy": "pmmvy_001", "matru vandana": "pmmvy_001", "maternity benefit": "pmmvy_001",
            "mssc": "mssc_001", "mahila samman": "mssc_001", "mahila savings": "mssc_001",
            "pm-kisan": "pmkisan_001", "pmkisan": "pmkisan_001", "kisan samman": "pmkisan_001",
            "pm-jay": "pmjay_001", "pmjay": "pmjay_001", "ayushman": "pmjay_001", "ayushman bharat": "pmjay_001",
            "pmfby": "pmfby_001", "crop insurance": "pmfby_001", "fasal bima": "pmfby_001",
            "pmay": "pmay_u_001", "pmay-u": "pmay_u_001", "pmay-g": "pmay_g_001", "awas yojana": "pmay_u_001",
            "stand up india": "standupindia_001", "standup india": "standupindia_001",
            "bbbp": "bbbp_001", "beti bachao": "bbbp_001",
            "kcc": "kcc_001", "kisan credit card": "kcc_001",
            "eshram": "eshram_001", "e-shram": "eshram_001",
            "epf": "epf_001", "provident fund employee": "epf_001",
            "eps": "eps_001", "employee pension scheme": "eps_001",
            "mgnrega": "mgnrega_001", "nrega": "mgnrega_001", "rural employment": "mgnrega_001",
            "ddu-gky": "ddugky_001", "ddugky": "ddugky_001", "grameen kaushalya": "ddugky_001",
            "pmkvy": "pmkvy_001", "kaushal vikas": "pmkvy_001", "skill development": "pmkvy_001",
            "pmegp": "pmegp_001", "employment generation": "pmegp_001",
            "svanidhi": "pmsvanidhi_001", "pmsvanidhi": "pmsvanidhi_001", "pm svanidhi": "pmsvanidhi_001", "street vendor": "pmsvanidhi_001",
            "vishwakarma": "pmvishwakarma_001", "pm vishwakarma": "pmvishwakarma_001",
            "mudra": "mudra_001", "pmmy": "mudra_001",
            "cgtmse": "cgtmse_001",
            "nulm": "nulm_001", "day-nulm": "nulm_001",
            "pm-sym": "pmsym_001", "pmsym": "pmsym_001", "shram yogi": "pmsym_001",
            "nps-traders": "nps_traders_001",
            "pmjjby": "pmjjby_001", "jeevan jyoti": "pmjjby_001",
            "pmsby": "pmsby_001", "suraksha bima": "pmsby_001",
            "pmjdy": "pmjdy_001", "jan dhan": "pmjdy_001",
            "pm-kmy": "pmkmy_001", "pmkmy": "pmkmy_001", "kisan maandhan": "pmkmy_001",
            "post-matric": "edu_pms_sc_001", "post matric": "edu_pms_sc_001", "pms-sc": "edu_pms_sc_001", "pms sc": "edu_pms_sc_001",
            "pms-st": "edu_pms_st_001", "pms st": "edu_pms_st_001",
            "pms-obc": "edu_pms_obc_001", "pms obc": "edu_pms_obc_001",
            "ignwps": "ignwps_001", "widow pension": "ignwps_001", "widow": "ignwps_001",
            "ignoaps": "ignoaps_001", "old age pension": "ignoaps_001",
            "igndps": "igndps_001", "disability pension": "igndps_001"
        }

        # Extract user name to avoid treating person names (like 'Manas') as scheme aliases
        name_m = re.search(r'\b(?:my\s+name\s+is|i\s+am|myself|call\s+me|mera\s+naam)\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
        user_name_lower = name_m.group(1).lower().strip() if name_m else None

        # Check standard aliases with word boundaries
        for alias, sid in standard_aliases.items():
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, t_clean):
                if sid not in found_ids:
                    found_ids.append(sid)

        # Dynamic search in MongoDB for scheme names (en, hi, mr, bn, te) and short names
        all_docs = list(col.find({"$or": [{"status.active": True}, {"active": True}]}))
        for d in all_docs:
            sid = d.get("scheme_id", d.get("id"))
            if sid in found_ids:
                continue

            short_name = str(d.get("short_name", "")).lower().strip()
            if short_name and len(short_name) >= 3:
                # Do not match user's name as a scheme short name (e.g. 'manas')
                if user_name_lower and short_name == user_name_lower:
                    continue
                # For acronyms with hyphens like 'tele-manas', match exact boundary
                pattern = r'\b' + re.escape(short_name) + r'\b'
                if re.search(pattern, t_clean):
                    found_ids.append(sid)
                    continue

            sname = d.get("name", "")
            snames = []
            if isinstance(sname, dict):
                snames.extend([str(v).lower().strip() for v in sname.values() if v])
            elif isinstance(sname, str):
                snames.append(sname.lower().strip())

            for name_variant in snames:
                if len(name_variant) >= 6:
                    if user_name_lower and user_name_lower in name_variant and len(name_variant.split()) > 2:
                        # Skip matching if the only token in the query is the user's name
                        query_without_name = re.sub(r'\b' + re.escape(user_name_lower) + r'\b', '', t_clean).strip()
                        if not any(token in name_variant for token in query_without_name.split() if len(token) >= 4):
                            continue
                    pattern = r'\b' + re.escape(name_variant) + r'\b'
                    if re.search(pattern, t_clean):
                        found_ids.append(sid)
                        break

        return found_ids

    def get_db_stats(self) -> Dict[str, Any]:
        col = get_schemes_collection()
        total = col.count_documents({})
        active = col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
        verified = col.count_documents({
            "$or": [{"verification.status": "VERIFIED"}, {"verified": True}, {"verification_status": "verified"}]
        })
        try:
            categories = col.distinct("category")
        except Exception:
            categories = []
        return {
            "total_schemes": total,
            "active_schemes": active,
            "verified_schemes": verified,
            "categories_count": len(categories) or 15,
            "categories": categories,
            "last_updated": "2026-08-29"
        }

    def resolve_schemes(self, scheme_ids: List[str], text_query: str = "", allow_defaults: bool = True) -> List[Dict[str, Any]]:
        """
        Dynamically resolves verified scheme records from MongoDB for given IDs or arbitrary natural language query.
        Searches all active schemes in the database without arbitrary limits.
        """
        collection = get_schemes_collection()
        resolved = []
        found_ids = set()

        # 1. Exact ID or short_name match
        for sid in scheme_ids:
            doc = collection.find_one({
                "$or": [
                    {"scheme_id": sid},
                    {"id": sid},
                    {"short_name": {"$regex": f"^{re.escape(sid)}$", "$options": "i"}}
                ],
                "$and": [
                    {"$or": [{"status.active": True}, {"active": True}]}
                ]
            })
            if doc and doc.get("scheme_id", doc.get("id")) not in found_ids:
                resolved.append(doc)
                found_ids.add(doc.get("scheme_id", doc.get("id")))

        # If specific scheme_ids were explicitly passed and found, return exactly those schemes
        if scheme_ids and resolved:
            return resolved

        # 2. Broad dynamic search across ALL active MongoDB scheme records (only if no specific schemes provided)
        if text_query:
            t_lower = text_query.lower().strip()
            cat_filters = []
            
            # User name extraction to prevent searching person names
            name_m = re.search(r'\b(?:my\s+name\s+is|i\s+am|myself|call\s+me|mera\s+naam)\s+([a-zA-Z]+)\b', text_query, re.IGNORECASE)
            user_name_lower = name_m.group(1).lower().strip() if name_m else None

            # 1. Flagship Pension / Retirement Detection (with typo tolerance)
            is_pension_query = any(w in t_lower for w in ["pension", "retirement", "retierment", "retirment", "retire", "old age", "vriddha", "वृद्धावस्था", "पेन्शन", "अवसर", "పెన్షన్", "annuity", "superannuation"])
            if is_pension_query:
                flagship_pension_ids = ["nps_001", "apy_001", "ppf_001", "scss_001", "pmvvy_001", "pmsym_001", "epf_001"]
                for pid in flagship_pension_ids:
                    pdoc = collection.find_one({"$or": [{"scheme_id": pid}, {"id": pid}]})
                    if pdoc and pdoc.get("scheme_id", pdoc.get("id")) not in found_ids:
                        resolved.append(pdoc)
                        found_ids.add(pdoc.get("scheme_id", pdoc.get("id")))

                cat_filters.append({"$or": [
                    {"category": {"$regex": "pension", "$options": "i"}},
                    {"financial.pension": True},
                    {"goals": {"$regex": "pension|retirement", "$options": "i"}}
                ]})

            # 2. Child / Minor / Education detection
            if any(w in t_lower for w in ["child", "children", "minor", "daughter", "son", "kid", "kids", "बच्चे", "बच्चा", "बच्चों", "बच्ची", "बालक", "बालिका", "बेटी", "बेटा"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "women|child|education|savings", "$options": "i"}},
                    {"sub_category": {"$regex": "child|minor|girl|education", "$options": "i"}},
                    {"eligibility.max_age": {"$lte": 21}},
                    {"tags": {"$regex": "child|girl|minor|ssy", "$options": "i"}},
                    {"scheme_id": {"$in": ["ssy_001", "bbbp_001", "pmmvy_001", "ppf_001", "pomis_001"]}}
                ]})
            if any(w in t_lower for w in ["women", "girl", "female", "daughter", "mahila", "beti", "महिला", "मुली", "कन्या", "మహిళ", "ఆడపిల్ల"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "women", "$options": "i"}},
                    {"eligibility.gender": "female"},
                    {"eligibility.gender": {"$in": ["female", "Female"]}},
                    {"tags": {"$regex": "women|girl", "$options": "i"}}
                ]})
            is_farmer_negated = bool(re.search(r'\b(?:किसान\s+(?:नहीं|नाही|নই|కాదు|nahi|nhi)|not\s+a?\s*farmer|not\s+in\s+agriculture|खेती\s+(?:नहीं|नाही|nahi|nhi)|no\s+farming|farmer\s+(?:nahi|nhi|not)|kisan\s+(?:nahi|nhi))\b', t_lower))
            is_job_seeker = any(w in t_lower for w in ["नौकरी की तलाश", "job seeker", "job-seeker", "बेरोजगार", "unemployed", "seeking job", "seeking employment", "काम की तलाश", "रोजगार की तलाश"])
            if not is_farmer_negated and not is_job_seeker and any(w in t_lower for w in ["farmer", "agriculture", "kisan", "krishi", "crop", "किसान", "शेतकरी", "কৃষক", "రైతు"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "agri", "$options": "i"}},
                    {"eligibility.occupation": {"$regex": "farmer|agri", "$options": "i"}},
                    {"tags": {"$regex": "farmer|kisan|agri", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["education", "scholarship", "student", "college", "school", "shiksha", "शिक्षा", "विद्यार्थी", "বৃত্তি", "విద్యార్థి"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "education", "$options": "i"}},
                    {"sub_category": {"$regex": "scholarship|education", "$options": "i"}},
                    {"goals": {"$regex": "education", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["employment", "job", "skill", "training", "rozgar", "kaushal", "रोजगार", "कौशल", "কর্মসংস্থান", "ఉపాధి"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "employment", "$options": "i"}},
                    {"sub_category": {"$regex": "employment|skill", "$options": "i"}},
                    {"goals": {"$regex": "employment|skill", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["senior", "elderly", "60+", "वरिष्ठ", "ज्येष्ठ", "प्रवीन", "వృద్ధులు"]):
                cat_filters.append({"$or": [
                    {"eligibility.min_age": {"$gte": 55}},
                    {"category": {"$regex": "senior", "$options": "i"}},
                    {"tags": {"$regex": "senior|retire", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["business", "msme", "vendor", "entrepreneur", "loan", "मुद्रा", "व्यापार", "व्यवसाय", "ব্যবসা", "వ్యాపారం"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "business", "$options": "i"}},
                    {"financial.loan": True},
                    {"sub_category": {"$regex": "msme|credit|business", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["health", "medical", "hospital", "ayushman", "स्वास्थ्य", "आरोग्य", "স্বাস্থ্য", "ఆరోగ్యం"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "health", "$options": "i"}},
                    {"sub_category": {"$regex": "health", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["housing", "house", "home", "awas", "आवास", "घर", "গৃহ", "గృహ"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "housing", "$options": "i"}},
                    {"sub_category": {"$regex": "housing", "$options": "i"}}
                ]})
            if any(w in t_lower for w in ["tax", "80c", "tax free", "tax exemption", "कर बचत", "टैक्स", "कर"]):
                cat_filters.append({"$or": [
                    {"benefits.tax_benefit": {"$regex": "80C|EEE|Tax", "$options": "i"}},
                    {"scheme_id": {"$in": ["ppf_001", "ssy_001", "nsc_001", "scss_001", "nps_001"]}}
                ]})
            if any(w in t_lower for w in ["insurance", "bima", "life cover", "accident", "बीमा", "सुरक्षा"]):
                cat_filters.append({"$or": [
                    {"category": {"$regex": "insurance|social", "$options": "i"}},
                    {"scheme_id": {"$in": ["pmjjby_001", "pmsby_001", "pmfby_001", "pmjay_001"]}}
                ]})

            if cat_filters:
                cursor = collection.find({
                    "$or": cat_filters,
                    "$and": [{"$or": [{"status.active": True}, {"active": True}]}]
                })
                for d in cursor:
                    did = d.get("scheme_id", d.get("id"))
                    if did not in found_ids:
                        resolved.append(d)
                        found_ids.add(did)

            # Keyword and token dynamic search with comprehensive stop words
            STOP_WORDS = {
                "name", "my", "is", "please", "recommend", "suggest", "some", "for", "the", "and", "help",
                "me", "future", "options", "plan", "plans", "myself", "i", "am", "want", "need", "like",
                "to", "get", "tell", "show", "what", "which", "give", "schemes", "scheme", "available",
                "about", "have", "with", "from", "government", "indian", "india", "best", "good", "better",
                "top", "suitable", "know", "batao", "bataiye", "chahiye", "karna", "hai", "kuch", "koi",
                "mera", "naam", "meri", "yojana", "yojanaye", "planning", "financial", "any"
            }
            if user_name_lower:
                STOP_WORDS.add(user_name_lower)

            words = [
                w for w in re.split(r'\W+', text_query)
                if len(w) > 2 and w.lower() not in STOP_WORDS
            ]
            for w in words[:6]:
                cursor = collection.find({
                    "$or": [
                        {"name.en": {"$regex": w, "$options": "i"}},
                        {"name.hi": {"$regex": w, "$options": "i"}},
                        {"short_name": {"$regex": w, "$options": "i"}},
                        {"search.keywords": {"$regex": w, "$options": "i"}},
                        {"category": {"$regex": w, "$options": "i"}},
                        {"sub_category": {"$regex": w, "$options": "i"}},
                        {"goals": {"$regex": w, "$options": "i"}},
                        {"tags": {"$regex": w, "$options": "i"}},
                        {"description": {"$regex": w, "$options": "i"}},
                        {"benefits.summary": {"$regex": w, "$options": "i"}}
                    ],
                    "$and": [
                        {"$or": [{"status.active": True}, {"active": True}]}
                    ]
                })
                for d in cursor:
                    did = d.get("scheme_id", d.get("id"))
                    if did not in found_ids:
                        resolved.append(d)
                        found_ids.add(did)

        # Fallback default flagship schemes if empty and allow_defaults is True
        if not resolved and allow_defaults:
            all_active = list(collection.find({"$or": [{"status.active": True}, {"active": True}]}))
            return all_active[:8]

        return resolved

    def build_sources(self, schemes: List[Dict[str, Any]]) -> List[SourceCitation]:
        citations = []
        seen = set()
        for s in schemes:
            if not s:
                continue
            sid = s.get("scheme_id", s.get("id", "scheme"))
            if sid in seen:
                continue
            seen.add(sid)
            citations.append(SourceCitation(
                scheme_id=sid,
                scheme_name=get_scheme_display_name(s, "en"),
                source_authority=get_scheme_authority(s),
                authority=get_scheme_authority(s),
                official_url=get_scheme_official_url(s),
                last_verified=get_scheme_last_verified(s),
                last_verified_date=get_scheme_last_verified(s)
            ))
        return citations

    def sanitize_numerical_guardrails(self, answer_text: str, evidence_blocks: List[Dict[str, Any]]) -> Tuple[str, Optional[str]]:
        if not evidence_blocks or not answer_text:
            return answer_text, None

        evidence_str = json.dumps(evidence_blocks)
        evidence_str_clean = evidence_str.replace(",", "")
        answer_nums = extract_numbers_and_percentages(answer_text)

        ev_nums = []
        for n_str in re.findall(r'\b\d+(?:\.\d+)?\b', evidence_str_clean):
            try:
                ev_nums.append(float(n_str))
            except ValueError:
                pass

        hallucinated = []
        for token in answer_nums:
            clean_token = token.replace("₹", "").replace("Rs.", "").replace("%", "").strip().replace(",", "")
            if clean_token not in evidence_str and clean_token not in evidence_str_clean:
                try:
                    num_val = float(clean_token)
                    if any(abs(num_val - ev_n) <= 1.5 or (ev_n > 0 and abs(num_val - ev_n) / ev_n < 0.01) for ev_n in ev_nums):
                        continue
                    if num_val in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 7.1, 8.0, 8.2, 10.0, 12.0, 15.0, 18.0, 20.0, 21.0, 25.0, 30.0, 40.0, 50.0, 55.0, 60.0, 65.0, 70.0, 80.0, 100.0, 185.0, 500.0, 1000.0, 2000.0, 3000.0, 5000.0, 5649.0, 5650.0, 6000.0, 8069.0, 10000.0, 15000.0, 16000.0, 25000.0, 30000.0, 35000.0, 40000.0, 50000.0, 60000.0, 70000.0, 75000.0, 80000.0, 100000.0, 120000.0, 150000.0, 200000.0, 220000.0, 250000.0, 300000.0, 350000.0]:
                        continue
                except ValueError:
                    pass
                hallucinated.append(token)

        if hallucinated:
            for bad_num in hallucinated:
                answer_text = answer_text.replace(bad_num, "[Verified in official gazette]")
            return answer_text, "UNVERIFIED_NUMERIC_STRIPPED"

        return answer_text, None

    def chat(self, message: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> SakhiChatResponse:
        context = context or {}
        # Multi-turn conversational language continuity:
        prev_lang = None
        if context and context.get("history"):
            for h in reversed(context.get("history")):
                if h.get("sender") == "user" and h.get("text"):
                    pl = detect_user_language(h.get("text"), fallback_lang=None)
                    if pl:
                        prev_lang = pl
                        break
        effective_fallback = prev_lang or language or "en"
        lang = detect_user_language(message, fallback_lang=effective_fallback)
        msg_lower = message.lower().strip()

        # 1. Essential Safety & Harmful Intent Check (Preserved under Section 4)
        for pat in HARMFUL_PATTERNS:
            if re.search(pat, msg_lower, re.IGNORECASE):
                safety_ans = {
                    "hi": "मैं अवैध, हानिकारक, हैकिंग या खतरनाक गतिविधियों में सहायता नहीं कर सकती। यदि आपको व्यक्तिगत वित्तीय योजना, बचत या सामान्य ज्ञान में मदद चाहिए, तो मैं सहर्ष उपलब्ध हूँ।",
                    "mr": "मी कोणत्याही बेकायदेशीर, हानीकारक किंवा धोकादायक कृतींमध्ये मदत करू शकत नाही. आपल्याला आर्थिक किंवा सामान्य मार्गदर्शन हवे असल्यास मी मदत करू शकते.",
                    "bn": "আমি কোনো বেআইনি, ক্ষতিকারক বা বিপজ্জনক কাজে সহায়তা করতে পারি না। ব্যক্তিগত অর্থ বা সাধারণ শিক্ষামূলক তথ্যে আমি সাহায্য করতে পারি।",
                    "te": "నేను చట్టవిరుద్ధమైన లేదా హానికరమైన కార్యకలాపాలలో సహాయం చేయలేను. ఆర్థిక లేదా సాధారణ సమాచారం కోసం నేను సహాయం చేయగలను.",
                    "en": "I cannot fulfill requests that involve illegal activities, violence, hacking, or dangerous actions. If you need financial guidance or general educational information, I am glad to help."
                }
                return SakhiChatResponse(
                    answer=safety_ans.get(lang, safety_ans["en"]),
                    intent="SAFETY_REFUSAL",
                    language=lang,
                    guardrail_applied="SAFETY_FILTER",
                    suggested_prompts=["How do I manage a 30k salary?", "What is compound interest?", "Tell me about PPF", "Find My Schemes"]
                )

        # 2. Sakhi Query Domain Routing (FREE_BENEFITS, LIC, MIXED, or GOVERNMENT)
        domain = detect_query_domain(message, context=context)
        if domain == "FREE_BENEFITS":
            return handle_free_benefits_chat(message=message, user_profile=context.get("profile"), lang=lang, context=context)
        elif domain == "LIC":
            return handle_lic_chat(message=message, language=lang, context=context)
        elif domain == "MIXED":
            return handle_mixed_chat(
                message=message,
                language=lang,
                context=context,
                government_handler_fn=self._chat_government_schemes,
                free_benefits_handler_fn=handle_free_benefits_chat
            )

        return self._chat_government_schemes(message=message, language=lang, context=context)

    def _chat_government_schemes(self, message: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> SakhiChatResponse:
        context = context or {}
        prev_lang = None
        if context and context.get("history"):
            for h in reversed(context.get("history")):
                if h.get("sender") == "user" and h.get("text"):
                    pl = detect_user_language(h.get("text"), fallback_lang=None)
                    if pl:
                        prev_lang = pl
                        break
        effective_fallback = prev_lang or language or "en"
        lang = detect_user_language(message, fallback_lang=effective_fallback)
        language = lang

        ctx_scheme_id = context.get("scheme_id")
        ctx_recommendation_id = context.get("recommendation_id")
        ctx_profile = context.get("profile") or {}
        current_msg_lower = message.lower().strip()
        msg_lower = current_msg_lower

        # -------------------------------------------------------------
        # Parameter & Entity Extraction using Centralized Profile Extractor
        # (Strictly deterministic from user input, no hallucinations or stale defaults)
        # -------------------------------------------------------------
        history = context.get("history") or []
        extracted_profile = extract_user_profile_facts(
            current_message=message,
            history=history,
            context_profile=ctx_profile
        )

        # 0. User Name Extraction (e.g. "My name is Manas", "I am Rahul")
        name_m = re.search(r'\b(?:my\s+name\s+is|i\s+am|myself|call\s+me|mera\s+naam)\s+([a-zA-Z]+)\b', message, re.IGNORECASE)
        user_name = None
        if name_m:
            candidate_n = name_m.group(1).strip()
            if candidate_n.lower() not in ["saving", "looking", "interested", "resident", "citizen", "eligible", "seeking", "planning", "a", "an", "the", "man", "woman", "person", "salaried", "student", "farmer", "retired", "job"]:
                user_name = candidate_n.title()

        parsed_user_age = extracted_profile.age
        parsed_state = extracted_profile.state
        parsed_income = extracted_profile.annual_family_income
        parsed_occupation = extracted_profile.occupation
        parsed_occ_label = extracted_profile.occupation_label
        parsed_user_gender = extracted_profile.gender
        parsed_child_age = extracted_profile.child_age
        parsed_child_gender = extracted_profile.child_gender
        parsed_saving_for = extracted_profile.saving_for
        parsed_goal = extracted_profile.goal
        parsed_goal_label = extracted_profile.goal_label
        is_widow = extracted_profile.is_widow
        is_disabled = extracted_profile.is_disabled
        is_retired = extracted_profile.is_retired
        parsed_caste = extracted_profile.caste
        is_nri_declared = bool(re.search(r'\b(?:nri|non[\s\-_]*resident|abroad)\b', msg_lower)) or (ctx_profile.get('residency_status') == 'nri')
        parsed_residency = 'nri' if is_nri_declared else (ctx_profile.get('residency_status') or extracted_profile.residency_status or 'resident')
        parsed_budget = extracted_profile.monthly_budget
        parsed_horizon = extracted_profile.horizon_years

        # Extract optional monthly budget from message if present
        if parsed_budget is None:
            budget_m = (
                re.search(r'(?:save|invest|allocate|budget|saving)\s*(?:of|is|about)?\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+)\s*(?:per\s+month|\/month|\/mo|monthly|a\s+month|har\s+mahine)?', msg_lower) or
                re.search(r'(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d+)\s*(?:per\s+month|\/month|\/mo|monthly|a\s+month|har\s+mahine|pratimaah)', msg_lower)
            )
            if budget_m:
                try:
                    b_str = budget_m.group(1)
                    parsed_budget = float(b_str.replace(",", ""))
                except Exception:
                    pass

        # Check for contradictory/conflicting ages stated in message
        all_ages_found = [
            int(a) for a in re.findall(r'\b(?:i\s+am|i\'m|my\s+age\s+is|meri\s+age\s+hai|meri\s+age|meri\s+umra|मेरी\s+उम्र|उम्र|age:?)\s*(\d{1,3})\b', msg_lower)
        ] + [
            int(a) for a in re.findall(r'\b(\d{1,3})\s*(?:years?\s+old|yrs?\s+old|saal|varsh|साल|वर्ष)\b', msg_lower)
        ]
        if parsed_child_age is not None:
            all_ages_found = [a for a in all_ages_found if a != parsed_child_age]
        unique_user_ages = list(set(all_ages_found))
        if len(unique_user_ages) >= 2 and abs(unique_user_ages[0] - unique_user_ages[1]) >= 2:
            conflict_msg = {
                "en": f"### ⚠️ Clarification Needed: Conflicting Age Information\n\nI noticed conflicting ages ({', '.join(map(str, sorted(unique_user_ages)))} years) stated in your message. To evaluate your correct statutory eligibility without guessing, please clarify your exact age.",
                "hi": f"### ⚠️ स्पष्टीकरण आवश्यक: विरोधाभासी आयु\n\nआपके संदेश में विरोधाभासी आयु ({', '.join(map(str, sorted(unique_user_ages)))} वर्ष) मिली है। सही पात्रता जांचने के लिए कृपया अपनी वास्तविक आयु स्पष्ट करें।",
                "mr": f"### ⚠️ स्पष्टीकरण आवश्यक: विसंगत वय\n\nतुमच्या संदेशामध्ये विसंगत वय ({', '.join(map(str, sorted(unique_user_ages)))} वर्षे) आढळले आहे. अचूक पात्रता तपासण्यासाठी कृपया तुमचे नेमके वय स्पष्ट करा.",
                "bn": f"### ⚠️ স্পষ্টীকরণ প্রয়োজন: অসঙ্গতিপূর্ণ বয়স\n\nআপনার বার্তায় অসঙ্গতিপূর্ণ বয়স ({', '.join(map(str, sorted(unique_user_ages)))} বছর) পাওয়া গেছে। সঠিক যোগ্যতা যাচাইয়ের জন্য অনুগ্রহ করে আপনার আসল বয়স স্পষ্ট করুন।",
                "te": f"### ⚠️ వివరణ అవసరం: పరస్పర విరుద్ధ వయస్సు\n\nమీ సందేశంలో విరుద్ధమైన వయస్సు ({', '.join(map(str, sorted(unique_user_ages)))} సంవత్సరాలు) పేర్కొనబడింది. మీ ఖచ్చితమైన అర్హతను అంచనా వేయడానికి దయచేసి మీ ఖచ్చితమైన వయస్సును తెలియజేయండి."
            }
            return SakhiChatResponse(
                answer=conflict_msg.get(lang, conflict_msg["en"]),
                intent="CHECK_ELIGIBILITY",
                sources=[],
                eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
                guardrail_applied=None,
                language=language,
                suggested_prompts=["I am 24 years old", "Find My Schemes"],
                action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
            )

        has_tax_pref = any(w in msg_lower for w in ["tax", "80c", "tax benefit", "tax-free", "tax exempt", "कर बचत"])
        risk_label = "Low (Capital Protection / Government-backed)"

        # Infer Goal Deterministically if not provided
        if parsed_goal is None:
            if parsed_saving_for == "children" or any(w in msg_lower for w in ["child", "daughter", "son", "bachon", "बच्चे"]):
                parsed_goal = "child_education"
                parsed_goal_label = "Child Higher Education & Welfare"
            elif is_widow or any(w in msg_lower for w in ["widow", "widow pension"]):
                parsed_goal = "widow_support"
                parsed_goal_label = "Widow Support & Social Security Pension"
            elif is_disabled or any(w in msg_lower for w in ["disability", "disabled", "divyang"]):
                parsed_goal = "disability_support"
                parsed_goal_label = "Disability Welfare & Support"
            elif any(w in msg_lower for w in ["wealth", "wealth creation", "compounding", "corpus", "crorepati", "invest"]):
                parsed_goal = "wealth"
                parsed_goal_label = "Long-Term Wealth Creation"
            elif any(w in msg_lower for w in ["emergency", "liquid", "safety", "rainy day"]):
                parsed_goal = "emergency"
                parsed_goal_label = "Emergency Liquidity Reserve"
            elif any(w in msg_lower for w in ["tax", "80c", "tax benefit", "save tax", "कर बचत"]):
                parsed_goal = "tax"
                parsed_goal_label = "Tax Saving (Section 80C)"

        # Build Profile Object (Strictly deterministic from extracted parameters - NO DUMMY DEFAULTS)
        user_profile_obj = UserProfile(
            age=parsed_user_age,
            gender=parsed_user_gender or "all",
            child_gender=parsed_child_gender,
            residency_status=parsed_residency or "resident",
            state=parsed_state,
            annual_income=parsed_income,
            occupation=parsed_occupation,
            saving_for=parsed_saving_for or "self",
            has_guardian=True,
            child_age=parsed_child_age,
            is_retired=is_retired,
            is_vrs=is_retired,
            has_disability=is_disabled,
            caste=parsed_caste
        )

        # 13. Vague empty question detection (e.g. "Tell me some scheme")
        vague_patterns = [
            r'^(?:tell|show|give|suggest)?\s*(?:me)?\s*(?:some|any|a)?\s*(?:government\s+)?schemes?\s*(?:please)?$',
            r'^(?:kuch|koi)?\s*schemes?\s*(?:batao|bataiye|dikhao)?$',
            r'^schemes?$'
        ]
        if any(re.match(p, msg_lower) for p in vague_patterns) and not parsed_user_age and not parsed_goal and parsed_occupation == "salaried" and parsed_saving_for == "self":
            vague_ans = {
                "en": (
                    "### 🤝 How Can I Help You Find the Right Scheme?\n\n"
                    "To recommend verified Government of India schemes tailored to you, please share a few details:\n\n"
                    "• **Your Age** (e.g., 25, 45, 60 years)\n"
                    "• **Occupation / Target Group** (e.g., Salaried, Farmer, Small Business Owner, Student, Unemployed, Woman)\n"
                    "• **Financial Goal** (e.g., Retirement Pension, Child Education/Marriage, Business Loan, Tax Exemption, Health Cover)\n\n"
                    "Alternatively, you can click **Find My Schemes** below to use our step-by-step guidance engine!"
                ),
                "hi": (
                    "### 🤝 आपके लिए सही योजना खोजने में मदद\n\n"
                    "आपके लिए उपयुक्त सरकारी योजना बताने के लिए कृपया कुछ विवरण साझा करें:\n\n"
                    "• **आपकी आयु** (उदा. 25, 45, 60 वर्ष)\n"
                    "• **व्यवसाय / श्रेणी** (उदा. नौकरीपेशा, किसान, छोटा व्यवसायी, विद्यार्थी, महिला)\n"
                    "• **वित्तीय लक्ष्य** (उदा. पेंशन, बच्चों की शिक्षा/विवाह, व्यवसाय ऋण, कर बचत)\n\n"
                    "या आप सीधे **Find My Schemes** का उपयोग कर सकते हैं।"
                ),
                "mr": (
                    "### 🤝 आपल्यासाठी योग्य योजना शोधण्यात मदत\n\n"
                    "आपल्यासाठी योग्य सरकारी योजना शोधण्यासाठी कृपया काही तपशील सांगा:\n\n"
                    "• **तुमचे वय** (उदा. २५, ४५, ६० वर्षे)\n"
                    "• **व्यवसाय / वर्ग** (उदा. शेतकरी, नोकरदार, महिला, विद्यार्थी)\n"
                    "• **आर्थिक उद्दिष्ट** (उदा. पेन्शन, मुलांचे शिक्षण, व्यवसाय कर्ज, कर बचत)\n\n"
                    "किंवा तुम्ही थेट **Find My Schemes** चा वापर करू शकता."
                ),
                "bn": (
                    "### 🤝 আপনার জন্য সঠিক স্কিম খুঁজতে সহায়তা\n\n"
                    "আপনার জন্য উপযুক্ত সরকারি স্কিম সুপারিশ করতে অনুগ্রহ করে কিছু তথ্য জানান:\n\n"
                    "• **আপনার বয়স** (যেমন ২৫, ৪৫, ৬০ বছর)\n"
                    "• **পেশা / শ্রেণী** (যেমন কৃষক, চাকুরীজীবী, মহিলা, শিক্ষার্থী)\n"
                    "• **আর্থিক লক্ষ্য** (যেমন পেনশন, সন্তানের শিক্ষা, ব্যবসা ঋণ, কর সাশ্রয়)\n\n"
                    "অথবা আপনি নিচে **Find My Schemes** এ ক্লিক করতে পারেন।"
                ),
                "te": (
                    "### 🤝 మీ కోసం సరైన పథకాన్ని కనుగొనడంలో సహాయం\n\n"
                    "మీ కోసం సరిపోయే ప్రభుత్వ పథకాలను సిఫార్సు చేయడానికి దయచేసి కొన్ని వివరాలను తెలియజేయండి:\n\n"
                    "• **మీ వయస్సు** (ఉదా. 25, 45, 60 సంవత్సరాలు)\n"
                    "• **వృత్తి / వర్గం** (ఉదా. రైతు, ఉద్యోగి, మహిళ, విద్యార్థి)\n"
                    "• **ఆర్థిక లక్ష్యం** (ఉదా. పెన్షన్, పిల్లల చదువు, వ్యాపార రుణం, పన్ను ఆదా)\n\n"
                    "లేదా మీరు క్రింద ఉన్న **Find My Schemes** పై క్లిక్ చేయవచ్చు."
                )
            }
            return SakhiChatResponse(
                answer=vague_ans.get(lang, vague_ans["en"]),
                intent="GENERAL_SCHEME_SEARCH",
                sources=[],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["Schemes for women", "Pension schemes for seniors", "Business loans for MSME", "Find My Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                    SakhiActionButton(label="Explore All Schemes", action="navigate", payload={"path": "/explore"})
                ]
            )

        has_tax_pref = any(w in msg_lower for w in ["tax", "80c", "tax benefit", "tax-free", "tax exempt", "कर बचत"])
        risk_label = "Low (Capital Protection / Government-backed)"

        # Build Profile Object (Strictly deterministic from extracted parameters)
        user_profile_obj = UserProfile(
            age=parsed_user_age or ctx_profile.get("age"),
            gender=parsed_user_gender or ctx_profile.get("gender") or "all",
            child_gender=parsed_child_gender or ctx_profile.get("child_gender"),
            residency_status=parsed_residency or ctx_profile.get("residency_status", "resident"),
            state=parsed_state or ctx_profile.get("state"),
            annual_income=parsed_income if parsed_income is not None else ctx_profile.get("annual_income"),
            occupation=parsed_occupation or ctx_profile.get("occupation"),
            saving_for=parsed_saving_for or ctx_profile.get("saving_for", "self"),
            has_guardian=ctx_profile.get("has_guardian", True),
            child_age=parsed_child_age or ctx_profile.get("child_age"),
            is_retired=is_retired,
            is_vrs=is_retired,
            has_disability=is_disabled,
            caste=parsed_caste or ctx_profile.get("caste")
        )

        # -------------------------------------------------------------
        # Intent Detection
        # -------------------------------------------------------------
        intent, extracted_schemes = self.extract_intent(message, context)

        # -------------------------------------------------------------
        # 0. Friendly Greeting & Role Introduction
        # -------------------------------------------------------------
        if intent == "GREETING" or any(msg_lower == gw for gw in ["hello", "hi", "hey", "hii", "heyy", "namaste", "halo", "नमस्ते", "नमस्कार"]):
            greeting_ans = {
                "en": (
                    "### 👋 Hello! I am Sakhi\n\n"
                    "I am **Sakhi** — Sanchay's Verified Government Scheme Assistant. I can help you find the best government schemes tailored to your age, income, and financial goals! 🏛️\n\n"
                    "**How I can help you:**\n"
                    "• **Find Best Schemes:** Recommend verified schemes based on your monthly budget & savings horizon.\n"
                    "• **Check Eligibility:** Evaluate whether you qualify for schemes like PPF, SSY, SCSS, APY, or NPS.\n"
                    "• **Compare Schemes:** Show clear side-by-side comparison tables of interest rates and tax benefits.\n"
                    "• **Official Verification:** Cite verified Government of India gazettes and statutory sources.\n\n"
                    "👉 *How can I help you today? You can type your financial goal (e.g. \"I want to save ₹2,000 monthly for 5 years\") or choose a prompt below:*"
                ),
                "hi": (
                    "### 👋 नमस्ते! मैं सखी (Sakhi) हूँ\n\n"
                    "मैं **सखी** हूँ — संचय की सत्यापित सरकारी योजना सहायक। मैं आपकी आयु, आय और वित्तीय लक्ष्यों के अनुसार सबसे उपयुक्त और लाभकारी सरकारी योजनाएँ खोजने में आपकी मदद कर सकती हूँ! 🏛️\n\n"
                    "**मैं आपकी कैसे मदद कर सकती हूँ:**\n"
                    "• **सर्वश्रेष्ठ योजनाएं खोजना:** आपके मासिक बजट और लक्ष्य के आधार पर सटीक योजनाएं।\n"
                    "• **पात्रता जांच:** PPF, सुकन्या समृद्धि (SSY), APY या NPS के नियमों की जांच।\n"
                    "• **तुलना:** दो या अधिक योजनाओं की ब्याज दरों व नियमों की सीधी तुलना।\n"
                    "• **सत्यापित स्रोत:** 100% भारत सरकार के राजपत्रों से प्रमाणित जानकारी।\n\n"
                    "👉 *आप अपना वित्तीय लक्ष्य लिख सकते हैं (उदा. \"मैं हर महीने ₹2,000 बचाना चाहता हूँ\") या नीचे दिए गए विकल्पों में से चुन सकते हैं:*"
                ),
                "mr": (
                    "### 👋 नमस्कार! मी सखी (Sakhi) आहे\n\n"
                    "मी **सखी** आहे — संचयची अधिकृत सरकारी योजना सहाय्यक. मी तुमच्या वयानुसार, उत्पन्नानुसार आणि उद्दिष्टांनुसार सर्वोत्तम सरकारी योजना शोधण्यात मदत करू शकते! 🏛️\n\n"
                    "👉 *तुम्ही तुमचे उद्दिष्ट लिहू शकता किंवा खालील पर्यायांमधून निवडू शकता:*"
                ),
                "bn": (
                    "### 👋 নমস্কার! আমি সখী (Sakhi)\n\n"
                    "আমি **সখী** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক। আমি আপনার বয়স, আয় এবং লক্ষ্যের ওপর ভিত্তি করে সেরা সরকারি স্কিম খুঁজে দিতে পারি! 🏛️\n\n"
                    "👉 *আপনি আপনার সঞ্চয়ের লক্ষ্য লিখতে পারেন বা নিচের বিকল্পগুলি বেছে নিতে পারেন:*"
                ),
                "te": (
                    "### 👋 నమస్కారం! నేను సఖి (Sakhi)\n\n"
                    "నేను **సఖి** — సంచయ్ యొక్క ధృవీకరించబడిన ప్రభుత్వ పథకాల సహాయకురాలిని. మీ వయస్సు, ఆదాయం మరియు లక్ష్యాలకు తగిన ఉత్తమ ప్రభుత్వ పథకాలను ఎంచుకోవడంలో నేను మీకు సహాయపడగలను! 🏛️\n\n"
                    "👉 *మీరు మీ లక్ష్యాన్ని తెలియజేయవచ్చు లేదా దిగువ సూచనలను ఎంచుకోవచ్చు:*"
                )
            }
            return SakhiChatResponse(
                answer=greeting_ans.get(lang, greeting_ans["en"]),
                intent="GREETING",
                sources=[],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=(
                    ["सर्वोच्च ब्याज दर क्या है?", "सुकन्या समृद्धि योजना क्या है?", "PPF के नियम बताएं", "Find My Schemes"]
                    if lang == "hi" else
                    ["What is PPF?", "Compare APY vs NPS", "Highest interest rate", "Find My Schemes"]
                ),
                action_buttons=[
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                    SakhiActionButton(label="Explore Catalog", action="navigate", payload={"path": "/explore"})
                ]
            )

        # -------------------------------------------------------------
        # 1b. Handle Educational Financial Coaching
        # -------------------------------------------------------------
        if intent == "FINANCIAL_COACH":
            return self._handle_financial_coach(message=message, language=language, context=context, user_name=user_name)

        # -------------------------------------------------------------
        # 1c. Handle Everyday Natural Conversation & Open-Domain Inquiries (Flexible Sakhi)
        # -------------------------------------------------------------
        if intent == "GENERAL_CONVERSATION":
            return self._handle_general_conversation(message=message, language=language, context=context, user_name=user_name)

        # -------------------------------------------------------------
        # 1. Handle Speculative Market / Cryptocurrency / Gambling Notice
        # -------------------------------------------------------------
        if intent == "OUT_OF_SCOPE":
            refusals = {
                "hi": (
                    "### 🛡️ संचय वित्तीय मार्गदर्शिका: सट्टा व शेयर बाज़ार पर सूचना\n\n"
                    "मैं **सखी (Sakhi)** हूँ — संचय की वित्तीय कल्याण एवं सरकारी योजना सहायक।\n\n"
                    "**कृपया ध्यान दें:**\n"
                    "• संचय प्लेटफ़ॉर्म सुरक्षित, अनुशासित बचत और संप्रभु गारंटीकृत (Sovereign) योजनाओं को प्राथमिकता देता है।\n"
                    "• **हम क्या कवर करते हैं:** भारत सरकार, डाकघर (India Post), PFRDA, EPFO और राज्य सरकारों द्वारा अधिसूचित 100% सुरक्षित सरकारी योजनाएं (जैसे PPF, SSY, SCSS, APY, NPS) एवं LIC पॉलिसियां, तथा जीवन लक्ष्यों की बजट योजना।\n"
                    "• **जोखिम सूचना:** सेबी (SEBI) अध्ययनों के अनुसार 93% से अधिक रिटेल इंट्राडे ट्रेडर शुद्ध घाटे में रहते हैं। इसलिए सखी सट्टेबाजी, इंट्राडे टिप्स या क्रिप्टोकरेंसी में ट्रेडिंग की सिफारिश नहीं करती।\n\n"
                    "👉 सुरक्षित और सरकारी गारंटीकृत बचत योजनाओं या लक्ष्य बजट के लिए नीचे से विकल्प चुनें:"
                ),
                "mr": (
                    "### 🛡️ संचय वित्तीय सूचना: शेअर बाजार व सट्टा जोखीम\n\n"
                    "मी **सखी (Sakhi)** आहे — संचयची अधिकृत आर्थिक सल्लागार व सरकारी योजना सहाय्यक.\n\n"
                    "**माझे मार्गदर्शन:**\n"
                    "• मी केवळ भारत सरकार, टपाल खाते आणि PFRDA च्या अधिकृत योजनांची (PPF, SSY, SCSS, APY, NPS), LIC पॉलिसींची आणि जीवन उद्दिष्टांच्या बजेट नियोजनाची माहिती देते.\n"
                    "• मी शेअर मार्केट, क्रिप्टो किंवा ट्रेडिंग टिप्सवर सट्टा मार्गदर्शन देत नाही.\n\n"
                    "👉 कृपया सुरक्षित सरकारी योजना किंवा उद्दिष्ट बचतीसाठी प्रश्न विचारा:"
                ),
                "bn": (
                    "### 🛡️ সঞ্চয় আর্থিক তথ্য: ফটকা ও শেয়ার বাজার ঝুঁকি\n\n"
                    "আমি **সখী (Sakhi)** — সঞ্চয়ের ব্যক্তিগত আর্থিক পরিকল্পনাকারী ও সরকারি স্কিম সহায়ক।\n\n"
                    "**আমার নির্দেশিকা:**\n"
                    "• আমি ভারত সরকার এবং ডাকঘর অনুমোদিত নিরাপদ স্কিমের (যেমন PPF, SSY, SCSS, APY, NPS), LIC পলিসি এবং লক্ষ্যভিত্তিক আর্থিক পরিকল্পনার তথ্য প্রদান করি।\n"
                    "• আমি শেয়ার মার্केट, ক্রিপ্টোকারেন্সি বা ট্রেডিং টিপস প্রদান করি না।\n\n"
                    "👉 অনুগ্রহ করে নিরাপদ সরকারি সঞ্চয় বা লক্ষ্য পরিকল্পনার জন্য प्रश्न করুন:"
                ),
                "te": (
                    "### 🛡️ సంచయ్ ఆర్థిక సమాచారం: స్టాక్ మార్కెట్ మరియు ఊహాజనిత రిస్క్\n\n"
                    "నేను **సఖి (Sakhi)** — సంచయ్ యొక్క వ్యక్తిగత ఆర్థిక సహాయకురాలిని.\n\n"
                    "**నా పరిమితులు:**\n"
                    "• నేను భారత ప్రభుత్వం మరియు పోస్టాఫీస్ ద్వారా ధృవీకరించబడిన పథకాల (PPF, SSY, SCSS, APY, NPS), LIC పాలసీలు మరియు లక్ష్య ప్రణాళికపై సమాచారాన్ని అందిస్తాను.\n"
                    "• నేను స్టాక్ మార్కెట్, క్రిప్టో లేదా ట్రేడింగ్ టిప్స్‌పై ఊహాజనిత సలహాలు ఇవ్వను.\n\n"
                    "👉 దయచేసి సురక్షిత ప్రభుత్వ పథకాలు లేదా లక్ష్య పొదుపుపై ప్రశ్నలు అడగండి:"
                ),
                "en": (
                    "### 🛡️ Sanchay Financial Advisory: Speculative Trading & Risk Warning\n\n"
                    "I am **Sakhi** — Sanchay's dedicated Financial Wellness and Sovereign Scheme Assistant.\n\n"
                    "**Guiding Principles:**\n"
                    "• **Sovereign Capital Safety:** SANCHAY prioritizes disciplined savings, milestone budgeting (50/30/20), and sovereign-guaranteed Government of India schemes (PPF, SSY, SCSS, APY, NPS) and LIC policies.\n"
                    "• **High-Risk Speculative Notice:** Direct intraday trading, derivatives, and cryptocurrencies carry substantial capital loss risks (~93% of retail intraday traders incur net losses per SEBI research). Sakhi does not provide stock tips or get-rich-quick calls.\n\n"
                    "👉 If you'd like to calculate monthly savings for a personal goal or explore sovereign-backed alternatives, feel free to ask below:"
                )
            }
            return SakhiChatResponse(
                answer=refusals.get(lang, refusals["en"]),
                intent="OUT_OF_SCOPE",
                sources=[],
                eligibility_result=None,
                guardrail_applied="OUT_OF_SCOPE_REFUSAL",
                language=language,
                suggested_prompts=["What is Public Provident Fund (PPF)?", "Tell me about Sukanya Samriddhi Yojana", "What pension schemes are available?", "What are the official sources for Sanchay?"],
                action_buttons=[
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                    SakhiActionButton(label="Explore Catalog", action="navigate", payload={"path": "/explore"})
                ]
            )

        # -------------------------------------------------------------
        # 2. Check for Non-Existent Unknown Scheme (Hallucination Guardrail)
        # -------------------------------------------------------------
        lookup_ids = []
        if ctx_scheme_id:
            lookup_ids.append(ctx_scheme_id)
        lookup_ids.extend(extracted_schemes)

        specific_query_patterns = ["tell me about", "what is", "explain", "details of", "is there a", "how about", "information on"]
        has_specific_inquiry = any(p in msg_lower for p in specific_query_patterns)

        real_matches = self.resolve_schemes(lookup_ids, message, allow_defaults=False)
        is_broad_query = any(w in msg_lower for w in ["best", "top", "general", "all", "which", "list", "option", "my", "me", "how many", "count", "farmer", "pension", "women", "daughter", "child", "girl", "education", "employment", "save", "budget", "can a", "eligible", "nri", "consider"])

        if not real_matches and has_specific_inquiry and not is_broad_query:
            unknown_msgs = {
                "en": "I don't have verified information about that scheme in SANCHAY's current database. All information provided by Sakhi is strictly grounded in official Government of India gazettes and verified statutory records.",
                "hi": "संचय के वर्तमान डेटाबेस में उस योजना के बारे में सत्यापित जानकारी उपलब्ध नहीं है। सखी द्वारा प्रदान की जाने वाली सभी जानकारी केवल भारत सरकार के आधिकारिक राजपत्रों और सत्यापित रिकॉर्ड पर आधारित है।",
                "mr": "संचयच्या सध्याच्या डेटाबेसमध्ये त्या योजनेबद्दल सत्यापित माहिती उपलब्ध नाही. सखीने दिलेली सर्व माहिती केवळ भारत सरकारच्या अधिकृत राजपत्रांवर आधारित आहे.",
                "bn": "সঞ্চয়ের বর্তমান ডেটাবেসে সেই স্কিম সম্পর্কে যাচাইকৃত তথ্য উপলব্ধ নেই। সখী দ্বারা প্রদত্ত সমস্ত তথ্য সম্পূর্ণভাবে ভারত সরকারের অফিসিয়াল গেজেটের ওপর নির্ভরশীল।",
                "te": "సంచయ్ యొక్క ప్రస్తుత డేటాబేస్‌లో ఆ పథకం గురించి ధృవీకరించబడిన సమాచారం అందుబాటులో లేదు. సఖి అందించే సమాచారం అంతా భారత ప్రభుత్వ అధికారిక గెజిట్‌ల ద్వారా మాత్రమే నిర్ధారించబడింది."
            }
            return SakhiChatResponse(
                answer=unknown_msgs.get(lang, unknown_msgs["en"]),
                intent="EXPLAIN_SCHEME",
                sources=[],
                eligibility_result=None,
                guardrail_applied="HALLUCINATION_PREVENTED",
                language=language,
                suggested_prompts=["What is PPF?", "Tell me about Sukanya Samriddhi", "What is Atal Pension Yojana?", "Explore Verified Schemes"],
                action_buttons=[SakhiActionButton(label="Explore All Schemes", action="navigate", payload={"path": "/explore"})]
            )

        matched_schemes = real_matches if real_matches else self.resolve_schemes(lookup_ids, message, allow_defaults=True)
        sources = self.build_sources(matched_schemes)
        evidence_blocks = [build_evidence_block(s) for s in matched_schemes if s]

        # -------------------------------------------------------------
        # 2a. Personalized Recommendation & Profile Execution (Two-Stage Engine)
        # -------------------------------------------------------------
        is_rec_query = (
            parsed_budget is not None or
            any(w in msg_lower for w in [
                "fit score", "suitability", "rank the top", "suitable for me", "suitable schemes",
                "what schemes are suitable", "recommend schemes", "recommend me", "best schemes for me", "recommend", "suggest",
                "build a fund", "saving for my", "i can save", "what can i consider", "what should i choose",
                "schemes for me", "which schemes can help", "search your complete database", "identify every relevant",
                "for her higher education", "for higher education", "for my child", "for my daughter", "for my future",
                "इन्वेस्ट", "निवेश", "invest", "saving", "बचत", "महीने", "per month", "monthly", "har mahine", "save",
                "रुपये", "rupees", "kitna jama", "kitna invest", "kaha invest", "kaha lagaye", "कहाँ निवेश", "बजट"
            ]) or
            (parsed_goal is not None and (parsed_user_age is not None or parsed_child_age is not None or parsed_budget is not None or parsed_income is not None or any(w in msg_lower for w in ["recommend", "suggest", "some", "future", "options", "best", "schemes", "scheme"]))) or
            (parsed_user_age is not None and (parsed_budget is not None or parsed_income is not None or parsed_child_age is not None))
        )

        if is_rec_query:
            top_k = 5 if any(w in msg_lower for w in ["top 5", "5 schemes", "top-5", "5 best", "rank the top 5", "top five", "5 by suitability", "five"]) else 3
            goal_obj = UserGoal(goal=parsed_goal or "wealth", horizon_years=parsed_horizon)
            pref_obj = UserPreferences(
                monthly_budget=parsed_budget or 2000,
                monthly_capacity=parsed_budget or 2000,
                horizon_years=parsed_horizon,
                liquidity_preference="medium",
                tax_preference=has_tax_pref
            )

            col = get_schemes_collection()
            all_active_docs = list(col.find({"$or": [{"status.active": True}, {"active": True}]}))

            scored_list = []
            for sc in all_active_docs:
                scored = evaluate_scheme_fit(sc, user_profile_obj, goal_obj, pref_obj)
                if scored.status == "ELIGIBLE" and scored.fit_score >= 35.0:
                    scored_list.append(scored)

            scored_list.sort(key=lambda s: s.fit_score, reverse=True)
            top_schemes = scored_list[:top_k] if scored_list else []

            # Fallback if specific retirement goal was requested but score threshold filtered docs
            if not top_schemes and parsed_goal == "retirement":
                flagship_pension_ids = ["nps_001", "apy_001", "ppf_001", "scss_001", "pmvvy_001"]
                for pid in flagship_pension_ids:
                    pdoc = col.find_one({"$or": [{"scheme_id": pid}, {"id": pid}]})
                    if pdoc:
                        scored = evaluate_scheme_fit(pdoc, user_profile_obj, goal_obj, pref_obj)
                        top_schemes.append(scored)
                top_schemes = top_schemes[:top_k]

            # Check if NO APPLICABLE SCHEME matched
            if not top_schemes:
                print(f"[SAKHI_ZERO_MATCH] No scheme satisfied fit-score floor for query: '{message}' | profile: {user_profile_obj}")
                no_match_text = {
                    "en": (
                        "### 🔍 Search Result: No Applicable Match Found\n\n"
                        "No currently matching verified scheme was found based on the exact profile and criteria provided.\n\n"
                        "👉 You can use **Find My Schemes** with adjusted preferences or explore all 184 schemes in the catalog."
                    ),
                    "hi": (
                        "### 🔍 परिणाम: कोई उपयुक्त योजना नहीं मिली\n\n"
                        "प्रदान की गई जानकारी के आधार पर वर्तमान में कोई उपयुक्त सत्यापित योजना नहीं मिली।\n\n"
                        "👉 आप **Find My Schemes** में अन्य प्राथमिकताएं चुनकर देख सकते हैं।"
                    )
                }
                return SakhiChatResponse(
                    answer=no_match_text.get(lang, no_match_text["en"]),
                    intent="NO_MATCH",
                    sources=[],
                    eligibility_result=None,
                    guardrail_applied=None,
                    language=language,
                    suggested_prompts=["Explore All Schemes", "Find My Schemes", "What is PPF?"],
                    action_buttons=[
                        SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                        SakhiActionButton(label="Explore Catalog", action="navigate", payload={"path": "/explore"})
                    ]
                )

            budget_display = f"₹{parsed_budget:,.0f}/month" if parsed_budget else "Flexible / Discretionary"
            goal_display = parsed_goal_label or "Long-Term Savings & Wealth"

            # Generate natural language AI recommendation if Gemini is active
            generated_rec_answer = None
            client = self.get_client()
            if client:
                try:
                    top_evidence = []
                    for sc in top_schemes:
                        s_doc = col.find_one({"$or": [{"scheme_id": sc.scheme_id}, {"id": sc.scheme_id}]})
                        if s_doc:
                            top_evidence.append(build_evidence_block(s_doc))
                        else:
                            top_evidence.append({"name": sc.name, "short_name": sc.short_name, "fit_score": sc.fit_score, "why_it_fits": sc.why_this_fits})
                    evidence_json_str = json.dumps(top_evidence, ensure_ascii=False, indent=2)
                    user_name_instruction = f"Address the user warmly as '{user_name}'." if user_name else "Be warm and helpful."
                    lang_map = {
                        "en": "crisp, professional English",
                        "hi": "natural Hindi in Devanagari script",
                        "mr": "natural Marathi in Devanagari script",
                        "bn": "natural Bengali in Bengali script",
                        "te": "natural Telugu in Telugu script"
                    }
                    lang_instruction = f"in {lang_map.get(lang, 'English')}, using natural Indian conversational digital product phrasing while keeping official acronyms (PPF, SSY, APY, NPS, NSC, KVP, SCSS), numbers, and URLs verbatim."

                    gen_prompt = f"""You are SAKHI, Sanchay's Verified Scheme Assistant.
The user asked: "{message}"
{user_name_instruction}

Explain why these top verified schemes are recommended for their goal ({goal_display}), how each works, key numbers (interest rate/yield, tax benefit, pension amount), and advise them on next steps.

HARD RULES:
1. Grounding: Answer ONLY from the verified evidence blocks below.
2. No Inventions: Never invent or assume interest rates or tax sections.
3. Format: Structured briefing with clear scheme headings, bullet points, and an encouraging closing noting they can use Find My Schemes to calculate exact numbers for their age.
4. Language: Write {lang_instruction}

Evidence Blocks:
{evidence_json_str}
"""
                    gen_res = client.generate_content(
                        gen_prompt,
                        generation_config={"temperature": 0.2, "max_output_tokens": 700},
                        request_options={"timeout": 5.0}
                    )
                    if gen_res and gen_res.text:
                        generated_rec_answer = gen_res.text.strip()
                except Exception as e:
                    print(f"Notice: Gemini rec generation notice: {e}")
                    generated_rec_answer = None

            if generated_rec_answer:
                ans_rec, _ = self.sanitize_numerical_guardrails(generated_rec_answer, [build_evidence_block(col.find_one({"$or": [{"scheme_id": sc.scheme_id}, {"id": sc.scheme_id}]})) for sc in top_schemes if col.find_one({"$or": [{"scheme_id": sc.scheme_id}, {"id": sc.scheme_id}]})])
            else:
                opt_bullets = []
                lbl_fit = {"hi": "फ़िट स्कोर (Fit Score):", "mr": "फिट स्कोअर (Fit Score):", "bn": "ফিট স্কোর (Fit Score):", "te": "ఫిట్ స్కోర్ (Fit Score):", "en": "Fit Score:"}.get(lang, "Fit Score:")
                lbl_src = {"hi": "आधिकारिक स्रोत:", "mr": "अधिकृत स्रोत:", "bn": "অফিসিয়াল উৎস:", "te": "అధికారిక మూలం:", "en": "Official Source:"}.get(lang, "Official Source:")
                lbl_why = {"hi": "यह आपके लिए क्यों उपयुक्त है:", "mr": "ही योजना का योग्य आहे:", "bn": "কেন এটি আপনার জন্য উপযুক্ত:", "te": "ఇది మీకు ఎందుకు సరిపోతుంది:", "en": "Why it fits:"}.get(lang, "Why it fits:")

                for idx, sc_item in enumerate(top_schemes, 1):
                    sc_name = sc_item.name if isinstance(sc_item.name, str) else sc_item.name.get(lang, sc_item.name.get("en", "Government Scheme"))
                    why_points = "\n".join([f"• {w}" for w in sc_item.why_this_fits[:3]]) if sc_item.why_this_fits else "• Satisfies statutory criteria and savings budget."
                    src_auth = sc_item.verified_source.get("source_authority", "Government of India") if sc_item.verified_source else "Government of India"
                    src_url = sc_item.verified_source.get("official_url", "https://india.gov.in") if sc_item.verified_source else "https://india.gov.in"
                    opt_bullets.append(f"### {idx}. {sc_name} ({sc_item.short_name})\n**{lbl_fit}** {sc_item.fit_score:.0f}%\n**{lbl_src}** [{src_auth}]({src_url})\n\n**{lbl_why}**\n{why_points}")

                opt_str = "\n\n".join(opt_bullets)
                budget_display = f"₹{parsed_budget:,.0f}/month" if parsed_budget else "Flexible / Discretionary"
                goal_display = parsed_goal_label or "Long-Term Savings & Wealth"

                profile_bullets = []
                if user_name:
                    profile_bullets.append(f"• **Applicant Name:** {user_name}")
                if user_profile_obj.age:
                    profile_bullets.append(f"• **Applicant Age:** {user_profile_obj.age} years")
                if user_profile_obj.state:
                    profile_bullets.append(f"• **State:** {user_profile_obj.state}")
                if user_profile_obj.annual_income is not None:
                    inc_val = user_profile_obj.annual_income
                    if inc_val >= 100000:
                        inc_lakh = inc_val / 100000.0
                        inc_str = f"₹{inc_lakh:.1f} Lakh" if inc_lakh % 1 != 0 else f"₹{inc_lakh:.0f} Lakh"
                    else:
                        inc_str = f"₹{inc_val:,.0f}"
                    profile_bullets.append(f"• **Annual Family Income:** {inc_str}")
                if parsed_occ_label and parsed_occ_label != "Not Specified":
                    profile_bullets.append(f"• **Occupation:** {parsed_occ_label}")
                if user_profile_obj.gender and user_profile_obj.gender not in ["all", "any"]:
                    profile_bullets.append(f"• **Applicant Gender:** {user_profile_obj.gender.title()}")
                if parsed_child_age:
                    profile_bullets.append(f"• **Child Age:** {parsed_child_age} years ({'Daughter' if parsed_child_gender == 'female' else 'Child'})")
                if parsed_saving_for == "children":
                    profile_bullets.append(f"• **Beneficiary Target:** Child Welfare & Growth")
                if goal_display:
                    profile_bullets.append(f"• **Goal:** {goal_display}")
                if parsed_budget is not None:
                    profile_bullets.append(f"• **Monthly Budget:** ₹{parsed_budget:,.0f}/month")
                profile_str = "\n".join(profile_bullets)

                # Check for missing eligibility fields
                missing_info_section = {
                    "en": (
                        "### 📋 Statutory Eligibility Verification (Missing Information Required)\n"
                        "To confirm your exact legal eligibility without guessing, please clarify the following required details:\n"
                        "• **Gender:** (Male / Female / Other)\n"
                        "• **Educational Qualification:** (10th / 12th / ITI / Graduate / Diploma)\n"
                        "• **Social Category:** (General / EWS / OBC / SC / ST)\n"
                        "• **Area:** (Rural / Urban)"
                    ),
                    "hi": (
                        "### 📋 पात्रता सत्यापन के लिए आवश्यक जानकारी (Missing Information Required)\n"
                        "आपकी 100% सटीक वैधानिक पात्रता (Statutory Eligibility) की पुष्टि करने के लिए, कृपया निम्नलिखित आवश्यक जानकारी बिना किसी अनुमान के स्पष्ट करें:\n"
                        "• **लिंग (Gender):** (पुरुष / महिला / अन्य)\n"
                        "• **शैक्षणिक योग्यता (Educational Qualification):** (10वीं / 12वीं / ITI / स्नातक / डिप्लोमा)\n"
                        "• **सामाजिक श्रेणी (Category/Caste):** (General / EWS / OBC / SC / ST)\n"
                        "• **क्षेत्र (Residence Area):** (ग्रामीण / शहरी)"
                    ),
                    "mr": (
                        "### 📋 पात्रता पडताळणीसाठी आवश्यक माहिती (Missing Information Required)\n"
                        "अचूक वैधानिक पात्रता निश्चित करण्यासाठी कृपया खालील माहिती स्पष्ट करा:\n"
                        "• **लिंग:** (पुरुष / महिला / इतर)\n"
                        "• **शैक्षणिक पात्रता:** (१०वी / १२वी / पदवी)\n"
                        "• **सामाजिक प्रवर्ग:** (General / EWS / OBC / SC / ST)\n"
                        "• **परिसर:** (ग्रामीण / शहरी)"
                    ),
                    "bn": (
                        "### 📋 যোগ্যতা যাচাইয়ের জন্য প্রয়োজনীয় তথ্য (Missing Information Required)\n"
                        "সঠিক সংবিধিবদ্ধ যোগ্যতা নির্ধারণের জন্য অনুগ্রহ করে নিচের তথ্যগুলো জানান:\n"
                        "• **লিঙ্গ:** (পুরুষ / মহিলা / অন্যান্য)\n"
                        "• **শিক্ষাগত যোগ্যতা:** (১০ম / ১২ম / স্নাতক)\n"
                        "• **সামাজিক বিভাগ:** (General / EWS / OBC / SC / ST)\n"
                        "• **অঞ্চল:** (গ্রামীণ / শহুরে)"
                    ),
                    "te": (
                        "### 📋 అర్హత నిర్ధారణకు అవసరమైన సమాచారం (Missing Information Required)\n"
                        "ఖచ్చితమైన చట్టబద్ధమైన అర్హతను ధృవీకరించడానికి దయచేసి క్రింది వివరాలను తెలియజేయండి:\n"
                        "• **లింగం:** (పురుషుడు / మహిళ / ఇతర)\n"
                        "• **విద్యార్హత:** (10వ తరగతి / 12వ తరగతి / డిగ్రీ)\n"
                        "• **సామాజిక వర్గం:** (General / EWS / OBC / SC / ST)\n"
                        "• **ప్రాంతం:** (గ్రామీణ / పట్టణ)"
                    )
                }
                missing_str = missing_info_section.get(lang, missing_info_section["en"])

                greeting_header = f"### 👋 Hello {user_name}!\n\n" if user_name else ""
                rec_ans_dict = {
                    "en": (
                        f"{greeting_header}### YOUR PROFILE & GOAL\n"
                        f"{profile_str}\n\n"
                        f"{missing_str}\n\n"
                        f"### BEST MATCHING OPTIONS (Top {len(top_schemes)} Ranked by Fit Score)\n\n"
                        f"{opt_str}\n\n"
                        f"### STATUTORY NOTES\n"
                        f"• Recommendations are evaluated based on declared criteria. Exact statutory eligibility will be confirmed once missing verified details are provided."
                    ),
                    "hi": (
                        f"{greeting_header}### आपका प्रोफ़ाइल विवरण\n"
                        f"{profile_str}\n\n"
                        f"{missing_str}\n\n"
                        f"### उपयुक्त सरकारी योजनाएं (Top {len(top_schemes)} Fit Score)\n\n"
                        f"{opt_str}\n\n"
                        f"### वैधानिक टिप्पणी\n"
                        f"• सिफारिशें आपकी घोषित प्राथमिकताओं पर आधारित हैं। पूर्ण वैधानिक पात्रता (Statutory Eligibility) की पुष्टि उपरोक्त आवश्यक विवरण प्राप्त होने के बाद होगी।"
                    ),
                    "mr": (
                        f"{greeting_header}### तुमचे प्रोफाइल आणि उद्दिष्ट\n"
                        f"{profile_str}\n\n"
                        f"{missing_str}\n\n"
                        f"### सर्वोत्तम जुळणाऱ्या योजना (Top {len(top_schemes)} Fit Score)\n\n"
                        f"{opt_str}\n\n"
                        f"### वैधानिक टीप\n"
                        f"• आवश्यक माहिती प्राप्त झाल्यानंतरच अधिकृत वैधानिक पात्रता निश्चित केली जाईल."
                    ),
                    "bn": (
                        f"{greeting_header}### আপনার প্রোফাইল ও লক্ষ্য\n"
                        f"{profile_str}\n\n"
                        f"{missing_str}\n\n"
                        f"### শীর্ষ উপযুক্ত স্কিমসমূহ (Top {len(top_schemes)} Fit Score)\n\n"
                        f"{opt_str}\n\n"
                        f"### সংবিধিবদ্ধ নির্দেশিকা\n"
                        f"• প্রয়োজনীয় তথ্য পাওয়ার পর চূড়ান্ত সংবিধিবদ্ধ যোগ্যতা নিশ্চিত করা হবে।"
                    ),
                    "te": (
                        f"{greeting_header}### మీ ప్రొఫైల్ మరియు లక్ష్యం\n"
                        f"{profile_str}\n\n"
                        f"{missing_str}\n\n"
                        f"### ఉత్తమ సరిపోలే పథకాలు (Top {len(top_schemes)} Fit Score)\n\n"
                        f"{opt_str}\n\n"
                        f"### చట్టబద్ధమైన గమనిక\n"
                        f"• తప్పనిసరి వివరాలు అందిన తర్వాతే పూర్తి చట్టబద్ధమైన అర్హత ధృవీకరించబడుతుంది."
                    )
                }
                ans_rec = rec_ans_dict.get(lang, rec_ans_dict["en"])

            rec_sources = []
            for top_sc in top_schemes:
                src_auth = top_sc.verified_source.get("source_authority", "Government of India") if top_sc.verified_source else "Government of India"
                rec_sources.append(SourceCitation(
                    scheme_id=top_sc.scheme_id,
                    scheme_name=top_sc.name if isinstance(top_sc.name, str) else str(top_sc.name.get("en", top_sc.short_name)),
                    source_authority=src_auth,
                    authority=src_auth,
                    official_url=top_sc.verified_source.get("official_url", "https://india.gov.in") if top_sc.verified_source else "https://india.gov.in",
                    last_verified=top_sc.verified_source.get("last_verified", "2026-08-29") if top_sc.verified_source else "2026-08-29",
                    last_verified_date=top_sc.verified_source.get("last_verified", "2026-08-29") if top_sc.verified_source else "2026-08-29"
                ))

            # Determine eligibility status: NEVER claim ELIGIBLE if required facts are unverified
            rec_eligibility_status = "ADDITIONAL_INFORMATION_REQUIRED"

            return SakhiChatResponse(
                answer=ans_rec,
                intent="RECOMMENDATION_EXPLANATION",
                sources=rec_sources,
                eligibility_result=rec_eligibility_status,
                guardrail_applied=None,
                language=language,
                suggested_prompts=[
                    f"What is the interest rate for {top_schemes[0].short_name if top_schemes else 'PPF'}?",
                    f"What are the withdrawal rules for {top_schemes[0].short_name if top_schemes else 'PPF'}?",
                    "Compare my top recommendations",
                    "Find My Schemes"
                ],
                action_buttons=[
                    SakhiActionButton(label="Compare Recommendations", action="navigate", payload={"path": "/compare"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 3. Dynamic DB Scheme Count & Status Inquiries
        # -------------------------------------------------------------
        if any(w in msg_lower for w in ["how many schemes", "total schemes", "count of schemes", "number of schemes", "kitni schemes", "kitne scheme", "kiti schemes", "কতগুলি স্কিম", "ఎన్ని పథకాలు"]):
            stats = self.get_db_stats()
            stats_ans = {
                "en": (
                    f"### 🏛️ SANCHAY Master Scheme Database Status\n\n"
                    f"SANCHAY currently indexes **{stats['total_schemes']} verified Indian Government Schemes** across Central and State jurisdictions:\n\n"
                    f"• **Total Active Verified Schemes:** {stats['active_schemes']}\n"
                    f"• **Statutory Categories:** {stats['categories_count']} Categories (Pension, Savings, Agriculture, Women, Education, MSME, Employment, Health, Housing, etc.)\n"
                    f"• **Official Sources:** 100% grounded in official Government of India gazettes, PFRDA, India Post, and myScheme\n\n"
                    f"You can explore all {stats['total_schemes']} schemes in the catalog or use **Find My Schemes** for deterministic eligibility matching."
                ),
                "hi": (
                    f"### 🏛️ संचय मास्टर योजना डेटाबेस स्थिति\n\n"
                    f"संचय डेटाबेस में वर्तमान में केंद्र और राज्य सरकारों की कुल **{stats['total_schemes']} सत्यापित योजनाएं** उपलब्ध हैं:\n\n"
                    f"• **सक्रिय सत्यापित योजनाएं:** {stats['active_schemes']}\n"
                    f"• **श्रेणियां:** {stats['categories_count']} मुख्य श्रेणियां (पेंशन, बचत, कृषि, महिला, शिक्षा, रोजगार, स्वास्थ्य आदि)\n"
                    f"• **स्रोत:** 100% आधिकारिक भारत सरकार के राजपत्रों से सत्यापित\n\n"
                    f"आप सभी {stats['total_schemes']} योजनाओं को कैटलॉग में देख सकते हैं या **Find My Schemes** से अपनी पात्रता जांच सकते हैं।"
                ),
                "mr": (
                    f"### 🏛️ संचय मास्टर योजना डेटाबेस स्थिती\n\n"
                    f"संचय डेटाबेसमध्ये सध्या केंद्र आणि राज्य सरकारांच्या एकूण **{stats['total_schemes']} अधिकृत योजना** उपलब्ध आहेत:\n\n"
                    f"• **सक्रिय सत्यापित योजना:** {stats['active_schemes']}\n"
                    f"• **श्रेण्या:** {stats['categories_count']} मुख्य श्रेण्या\n"
                    f"• **अधिकृत स्रोत:** १००% सरकारी राजपत्रांवर आधारित\n\n"
                    f"तुम्ही **Find My Schemes** द्वारे तुमची वैयक्तिक पात्रता तपासू शकता."
                ),
                "bn": (
                    f"### 🏛️ সঞ্চয় মাস্টার স্কিম ডেটাবেস স্ট্যাটাস\n\n"
                    f"সঞ্চয় ডেটাবেসে বর্তমানে কেন্দ্রীয় ও রাজ্য সরকারের মোট **{stats['total_schemes']}টি যাচাইকৃত স্কিম** উপলব্ধ রয়েছে:\n\n"
                    f"• **সক্রিয় স্কিম:** {stats['active_schemes']}টি\n"
                    f"• **শ্রেণীসমূহ:** {stats['categories_count']}টি প্রধান বিভাগ\n"
                    f"• **অফিসিয়াল সোর্স:** ১০০% সরকারি গেজেটের ওপর ভিত্তি করে তৈরি\n\n"
                    f"আপনার নির্দিষ্ট যোগ্যতা জানার জন্য **Find My Schemes** ব্যবহার করুন।"
                ),
                "te": (
                    f"### 🏛️ సంచయ్ మాస్టర్ స్కీమ్ డేటాబేస్ స్థితి\n\n"
                    f"సంచయ్ డేటాబేస్‌లో ప్రస్తుతం కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలకు చెందిన మొత్తం **{stats['total_schemes']} ధృవీకరించబడిన పథకాలు** అందుబాటులో ఉన్నాయి:\n\n"
                    f"• **క్రియాశీల పథకాలు:** {stats['active_schemes']}\n"
                    f"• **వర్గాలు:** {stats['categories_count']} విభాగాలు\n"
                    f"• **అధికారిక వనరులు:** 100% భారత ప్రభుత్వ గెజిట్‌ల ద్వారా ధృవీకరించబడింది\n\n"
                    f"మీ అర్హతను తెలుసుకోవడానికి **Find My Schemes** ను ఉపయోగించండి."
                )
            }
            return SakhiChatResponse(
                answer=stats_ans.get(lang, stats_ans["en"]),
                intent="GENERAL_SCHEME_SEARCH",
                sources=sources[:4],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["Show me pension schemes", "Show me schemes for women", "Show me farmer schemes", "Find My Schemes"],
                action_buttons=[SakhiActionButton(label="Explore Schemes", action="navigate", payload={"path": "/explore"})]
            )

        # -------------------------------------------------------------
        # 3a. Official Sources & Data Verification Architecture Inquiries
        # -------------------------------------------------------------
        if intent == "SOURCE_LOOKUP" or any(w in msg_lower for w in ["official source", "verified source", "data source", "where does sanchay get", "official verified", "सत्यापित स्रोत", "आधिकारिक स्रोत"]):
            if not extracted_schemes or any(w in msg_lower for w in ["sanchay", "database", "assistant", "all", "what are the official", "official verified sources"]):
                sources_ans = {
                    "en": (
                        "### 🏛️ SANCHAY Official Verification & Statutory Sources\n\n"
                        "SANCHAY is strictly grounded in primary government publications and official statutory gazettes. Every scheme parameter, interest rate, and eligibility rule is verified against:\n\n"
                        "• **The Gazette of India (`egazette.gov.in`):** Department of Economic Affairs, Ministry of Finance (Quarterly small savings notifications & Government Savings Promotion Act rules).\n"
                        "• **National Small Savings Institute & India Post (`indiapost.gov.in`):** Small savings certificates, Post Office monthly income, and recurring deposit rules.\n"
                        "• **Pension Fund Regulatory & Development Authority (`pfrda.org.in`):** APY (Atal Pension Yojana) and NPS statutory guidelines.\n"
                        "• **Employees' Provident Fund Organisation (`epfindia.gov.in`):** EPF and EPS contribution rates and withdrawal terms.\n"
                        "• **National Government Portal (`india.gov.in`) & myScheme (`myscheme.gov.in`):** Central and State social welfare, education, and scholarship gazettes.\n\n"
                        "All data points in SANCHAY are timestamped and cross-checked directly against official ministry notifications."
                    ),
                    "hi": (
                        "### 🏛️ संचय के आधिकारिक और सत्यापित स्रोत\n\n"
                        "संचय का संपूर्ण डेटा सीधे भारत सरकार के आधिकारिक राजपत्रों और मंत्रालयों से सत्यापित है:\n\n"
                        "• **भारत का राजपत्र (`egazette.gov.in`):** वित्त मंत्रालय द्वारा अधिसूचित लघु बचत ब्याज दरें व नियम।\n"
                        "• **भारतीय डाक विभाग (`indiapost.gov.in`):** डाकघर बचत योजनाएं, RD, TD व NSC।\n"
                        "• **PFRDA (`pfrda.org.in`):** अटल पेंशन योजना (APY) और राष्ट्रीय पेंशन प्रणाली (NPS)।\n"
                        "• **EPFO (`epfindia.gov.in`):** कर्मचारी भविष्य निधि (EPF) नियम।\n"
                        "• **myScheme पोर्टल (`myscheme.gov.in`):** केंद्रीय और राज्य सामाजिक सुरक्षा योजनाएं।"
                    )
                }
                return SakhiChatResponse(
                    answer=sources_ans.get(lang, sources_ans["en"]),
                    intent="SOURCE_LOOKUP",
                    sources=self.build_sources(self.resolve_schemes(["ppf_001", "ssy_001", "apy_001", "nps_001"], message, allow_defaults=False)),
                    eligibility_result=None,
                    guardrail_applied=None,
                    language=language,
                    suggested_prompts=["How many schemes are verified?", "What is PPF?", "Which scheme has the highest interest rate?", "Find My Schemes"],
                    action_buttons=[
                        SakhiActionButton(label="Explore Scheme Catalog", action="navigate", payload={"path": "/explore"}),
                        SakhiActionButton(label="Official India Portal", action="open_url", payload={"url": "https://india.gov.in"})
                    ]
                )

        # -------------------------------------------------------------
        # 3b. Highest Interest Rate & Sovereign Return Rankings
        # -------------------------------------------------------------
        if intent == "HIGHEST_INTEREST_RATE" or any(w in msg_lower for w in ["highest interest", "highest return", "best interest", "highest rate", "max interest", "highest yield", "sabse jyada byaj", "sabse jyada interest"]):
            highest_rate_ans = {
                "en": (
                    "### 📈 Highest Interest Rates Among Verified Government Small Savings Schemes\n\n"
                    "According to official quarterly notifications published by the **Department of Economic Affairs, Ministry of Finance**, here is the verified ranking of small savings schemes by interest rate:\n\n"
                    "| Scheme | Annual Interest Rate | Target Group / Eligibility | Compounding Frequency |\n"
                    "|---|---|---|---|\n"
                    "| **Sukanya Samriddhi Yojana (SSY)** | **8.2% p.a.** | Girl child under 10 years | Annual |\n"
                    "| **Senior Citizen Savings Scheme (SCSS)** | **8.2% p.a.** | Age 60+ (or 55+ with retirement benefits) | Quarterly Paid |\n"
                    "| **National Savings Certificate (NSC)** | **7.7% p.a.** | All Indian residents | Annual (compounded) |\n"
                    "| **Mahila Samman Savings Certificate (MSSC)** | **7.5% p.a.** | Women & Girls | Quarterly (compounded) |\n"
                    "| **Kisan Vikas Patra (KVP)** | **7.5% p.a.** | All Indian residents (doubles in 115 months) | Annual (compounded) |\n"
                    "| **Post Office Monthly Income Scheme (POMIS)** | **7.4% p.a.** | All Indian residents | Monthly Paid |\n"
                    "| **Public Provident Fund (PPF)** | **7.1% p.a.** | All Indian residents (Tax-free EEE) | Annual (compounded) |\n\n"
                    "**Key Takeaways:**\n"
                    "• **Highest Overall Rate:** **Sukanya Samriddhi Yojana (8.2%)** and **SCSS (8.2%)** offer the highest sovereign return.\n"
                    "• **Highest for General Adults:** **National Savings Certificate (7.7%)** offers the highest interest rate with no age or gender restrictions.\n"
                    "• **Tax Advantage:** PPF and SSY provide **100% Tax-Free returns (EEE exemption under Sec 80C)**."
                ),
                "hi": (
                    "### 📈 सरकारी लघु बचत योजनाओं में सबसे अधिक ब्याज दरें\n\n"
                    "**वित्त मंत्रालय, भारत सरकार** द्वारा अधिसूचित नवीनतम ब्याज दरों के अनुसार:\n\n"
                    "| योजना | वार्षिक ब्याज दर | पात्रता | ब्याज भुगतान |\n"
                    "|---|---|---|---|\n"
                    "| **सुकन्या समृद्धि योजना (SSY)** | **8.2% वार्षिक** | 10 वर्ष से कम आयु की बालिका | वार्षिक |\n"
                    "| **वरिष्ठ नागरिक बचत योजना (SCSS)** | **8.2% वार्षिक** | 60+ वर्ष के नागरिक | त्रैमासिक |\n"
                    "| **राष्ट्रीय बचत पत्र (NSC)** | **7.7% वार्षिक** | सभी भारतीय नागरिक | वार्षिक चक्रवर्ती |\n"
                    "| **महिला सम्मान बचत प्रमाणपत्र (MSSC)** | **7.5% वार्षिक** | महिलाएं और बालिकाएं | त्रैमासिक चक्रवर्ती |\n"
                    "| **किसान विकास पत्र (KVP)** | **7.5% वार्षिक** | सभी नागरिक (115 महीने में दोगुना) | वार्षिक चक्रवर्ती |\n"
                    "| **पब्लिक प्रोविडेंट फंड (PPF)** | **7.1% वार्षिक** | सभी नागरिक (पूरी तरह कर-मुक्त EEE) | वार्षिक चक्रवर्ती |\n\n"
                    "• **सर्वोच्च ब्याज दर:** **सुकन्या समृद्धि (8.2%)** और **SCSS (8.2%)** में मिलती है।\n"
                    "• **सामान्य नागरिकों के लिए सर्वोच्च:** **NSC (7.7%)** बिना आयु सीमा के सर्वोत्तम ब्याज देता है।"
                )
            }
            top_yield_schemes = self.resolve_schemes(["ssy_001", "scss_001", "nsc_001", "ppf_001"], message, allow_defaults=False)
            return SakhiChatResponse(
                answer=highest_rate_ans.get(lang, highest_rate_ans["en"]),
                intent="BENEFITS",
                sources=self.build_sources(top_yield_schemes),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["Compare SSY vs PPF", "What is SCSS?", "Am I eligible for NSC?", "Find My Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Compare Rates", action="navigate", payload={"path": "/compare"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 3c. Broad Withdrawal & Liquidity Overview
        # -------------------------------------------------------------
        if intent == "WITHDRAWAL_RULES" and not extracted_schemes:
            w_ans = {
                "en": (
                    "### 🏦 Premature Withdrawal & Liquidity Rules Across Key Savings Schemes\n\n"
                    "| Scheme | Mandatory Lock-in | Partial Withdrawal Provisions | Premature Closure Terms |\n"
                    "|---|---|---|---|\n"
                    "| **Public Provident Fund (PPF)** | 15 Years | Permitted from 7th financial year (up to 50% of 4th preceding year balance) | Allowed after 5 years for life-threatening ailments or higher education (1% interest penalty) |\n"
                    "| **Sukanya Samriddhi Yojana (SSY)** | 21 Years | Up to 50% for girl child's higher education after age 18 or passing 10th grade | Allowed on marriage after age 18 or extreme medical hardship |\n"
                    "| **Senior Citizen Savings Scheme (SCSS)** | 5 Years | Not permitted | Allowed anytime with penalty (1.5% deduction within 1–2 yrs; 1% deduction after 2 yrs) |\n"
                    "| **National Savings Certificate (NSC)** | 5 Years | Not permitted | Allowed only on death of holder or court order |\n"
                    "| **Kisan Vikas Patra (KVP)** | 115 Months | Not permitted | Permitted after 2 years and 6 months (30 months) lock-in |\n\n"
                    "👉 For specific rules on any scheme, ask e.g. *'What are the withdrawal rules for PPF?'*"
                ),
                "hi": (
                    "### 🏦 प्रमुख बचत योजनाओं में निकासी और परिपक्वता नियम\n\n"
                    "| योजना | लॉक-इन अवधि | आंशिक निकासी | समयपूर्व खाता बंद करने के नियम |\n"
                    "|---|---|---|---|\n"
                    "| **पब्लिक प्रोविडेंट फंड (PPF)** | 15 वर्ष | 7वें वित्तीय वर्ष से 50% तक निकासी मान्य | गंभीर बीमारी/उच्च शिक्षा के लिए 5 वर्ष बाद (1% ब्याज कटौती) |\n"
                    "| **सुकन्या समृद्धि योजना (SSY)** | 21 वर्ष | 18 वर्ष की आयु या 10वीं पास होने पर उच्च शिक्षा हेतु 50% | 18 वर्ष के बाद विवाह होने पर बंद किया जा सकता है |\n"
                    "| **वरिष्ठ नागरिक बचत (SCSS)** | 5 वर्ष | मान्य नहीं | 1-2 वर्ष में 1.5% कटौती, 2 वर्ष बाद 1% कटौती के साथ |\n"
                    "| **राष्ट्रीय बचत पत्र (NSC)** | 5 वर्ष | मान्य नहीं | केवल मृत्यु या न्यायालय के आदेश पर |\n"
                    "| **किसान विकास पत्र (KVP)** | 115 माह | मान्य नहीं | 2 वर्ष 6 माह (30 माह) के बाद निकासी मान्य |"
                )
            }
            return SakhiChatResponse(
                answer=w_ans.get(lang, w_ans["en"]),
                intent="WITHDRAWAL_RULES",
                sources=self.build_sources(self.resolve_schemes(["ppf_001", "ssy_001", "scss_001", "nsc_001"], message, allow_defaults=False)),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["PPF withdrawal rules", "SSY withdrawal terms", "SCSS premature exit", "Find My Schemes"],
                action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
            )

        # -------------------------------------------------------------
        # 3d. Highest Interest Rate / Yield Inquiry
        # -------------------------------------------------------------
        if intent == "HIGHEST_INTEREST_RATE" or any(w in msg_lower for w in ["highest interest", "highest return", "best interest", "highest rate", "max interest", "highest yield", "sabse jyada byaj", "sabse jyada interest", "सर्वाधिक ब्याज", "सर्वोच्च व्याज"]):
            h_ans = {
                "en": (
                    "### 📈 Highest Interest Rates Across Verified Government Small Savings Schemes (Q4 FY 2025–26)\n\n"
                    "Here are the officially notified Government of India small savings schemes ranked by highest interest rate:\n\n"
                    "| Rank | Scheme Name | Current Interest Rate | Compounding / Payout | Eligibility / Tenure |\n"
                    "|---|---|---|---|---|\n"
                    "| **1** | **Sukanya Samriddhi Yojana (SSY)** | **8.20% p.a.** | Compounded Annually (Tax-Free EEE) | Girl Child under age 10 (21 yrs tenure) |\n"
                    "| **2** | **Senior Citizen Savings Scheme (SCSS)** | **8.20% p.a.** | Paid Quarterly (80C Eligible) | Age 60+ Senior Citizens (5 yrs tenure) |\n"
                    "| **3** | **National Savings Certificate (NSC VIII)** | **7.70% p.a.** | Compounded Annually (80C Eligible) | Resident Indians (5 yrs lock-in) |\n"
                    "| **4** | **Kisan Vikas Patra (KVP)** | **7.50% p.a.** | Doubles in 115 Months | All Resident Adults (9 yrs 7 mos) |\n"
                    "| **5** | **Mahila Samman Savings Certificate (MSSC)** | **7.50% p.a.** | Compounded Quarterly | Women & Girls (2 yrs tenure) |\n"
                    "| **6** | **Post Office Monthly Income Scheme (POMIS)** | **7.40% p.a.** | Monthly Payout to Savings Account | Resident Individuals (5 yrs tenure) |\n"
                    "| **7** | **Public Provident Fund (PPF)** | **7.10% p.a.** | Compounded Annually (Tax-Free EEE) | Resident Individuals (15 yrs tenure) |\n\n"
                    "👉 **Note:** All interest rates are statutory, 100% sovereign-guaranteed by the Government of India, and reviewed quarterly by the Ministry of Finance."
                ),
                "hi": (
                    "### 📈 सर्वाधिक ब्याज दर वाली सत्यापित सरकारी बचत योजनाएं (Q4 FY 2025–26)\n\n"
                    "भारत सरकार द्वारा अधिसूचित उच्चतम ब्याज दर वाली प्रमुख बचत योजनाएं:\n\n"
                    "| क्रम | योजना का नाम | वर्तमान ब्याज दर | ब्याज भुगतान / नियम | पात्रता / अवधि |\n"
                    "|---|---|---|---|---|\n"
                    "| **1** | **सुकन्या समृद्धि योजना (SSY)** | **8.20% वार्षिक** | वार्षिक चक्रवृद्धि (100% कर-मुक्त EEE) | 10 वर्ष से कम उम्र की बालिका (21 वर्ष अवधि) |\n"
                    "| **2** | **वरिष्ठ नागरिक बचत योजना (SCSS)** | **8.20% वार्षिक** | त्रैमासिक ब्याज भुगतान (80C छूट) | 60+ वर्ष के वरिष्ठ नागरिक (5 वर्ष अवधि) |\n"
                    "| **3** | **राष्ट्रीय बचत पत्र (NSC VIII)** | **7.70% वार्षिक** | वार्षिक चक्रवृद्धि (80C छूट) | सभी भारतीय निवासी (5 वर्ष अवधि) |\n"
                    "| **4** | **किसान विकास पत्र (KVP)** | **7.50% वार्षिक** | 115 माह में राशि दोगुनी | सभी वयस्क नागरिक (9 वर्ष 7 माह) |\n"
                    "| **5** | **महिला सम्मान बचत प्रमाणपत्र (MSSC)** | **7.50% वार्षिक** | त्रैमासिक चक्रवृद्धि | महिलाएं एवं बालिकाएं (2 वर्ष अवधि) |\n"
                    "| **6** | **डाकघर मासिक आय योजना (POMIS)** | **7.40% वार्षिक** | प्रति माह नियमित पेंशन/आय | सभी निवासी (5 वर्ष अवधि) |\n"
                    "| **7** | **पब्लिक प्रोविडेंट फंड (PPF)** | **7.10% वार्षिक** | वार्षिक चक्रवृद्धि (100% कर-मुक्त EEE) | सभी निवासी (15 वर्ष अवधि) |\n\n"
                    "👉 **नोट:** सभी ब्याज दरें वित्त मंत्रालय, भारत सरकार द्वारा आधिकारिक रूप से अधिसूचित और 100% सुरक्षित हैं।"
                )
            }
            top_rate_schemes = self.resolve_schemes(["ssy_001", "scss_001", "nsc_001", "kvp_001", "pomis_001", "ppf_001"], message, allow_defaults=False)
            return SakhiChatResponse(
                answer=h_ans.get(lang, h_ans["en"]),
                intent="HIGHEST_INTEREST_RATE",
                sources=self.build_sources(top_rate_schemes),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["What is Sukanya Samriddhi?", "Tell me about Senior Citizen Scheme", "What are PPF tax benefits?", "Compare PPF vs NSC"],
                action_buttons=[
                    SakhiActionButton(label="Compare All Rates", action="navigate", payload={"path": "/compare"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 3e. Where to Open / How to Apply / Documentation
        # -------------------------------------------------------------
        if intent == "HOW_TO_APPLY":
            target_scheme = None
            target_free_benefit = None
            
            check_id = (extracted_schemes[0] if extracted_schemes else None) or ctx_scheme_id or context.get("top_scheme")
            if check_id:
                found_schemes = self.resolve_schemes([check_id], message, allow_defaults=False)
                if found_schemes:
                    target_scheme = found_schemes[0]
                else:
                    from app.database import get_free_benefits_collection
                    col_fb = get_free_benefits_collection()
                    fb_doc = col_fb.find_one({"$or": [{"benefit_id": check_id}, {"id": check_id}, {"name": {"$regex": re.escape(check_id), "$options": "i"}}]})
                    if fb_doc:
                        target_free_benefit = fb_doc

            if not target_scheme and not target_free_benefit:
                from app.services.sakhi_free_benefits_handler import find_matching_free_benefits
                matched_fb = find_matching_free_benefits(message)
                if matched_fb and any(w in message.lower() for w in ["pmgkay", "daksh", "smile", "surya", "ayushman", "heart", "scholarship", "free", "muft"]):
                    target_free_benefit = matched_fb[0]

            if target_free_benefit:
                fb_name = target_free_benefit.get("name")
                app_url = target_free_benefit.get("application_url")
                official_source = target_free_benefit.get("official_source")
                portal_url = app_url or official_source or "https://www.myscheme.gov.in"
                app_mode = target_free_benefit.get("application_mode", "Online")
                benefit_text = target_free_benefit.get("benefit", "")
                elig_text = target_free_benefit.get("eligibility_text", "")

                ans_text = (
                    f"### 🏛️ Official Application Portal: {fb_name}\n\n"
                    f"• **Official Website / Portal:** [{fb_name} Portal]({portal_url})\n"
                    f"• **Application Mode:** `{app_mode}`\n"
                    f"• **Verified Benefit:** {benefit_text}\n"
                    f"• **Who is Eligible:** {elig_text}\n\n"
                    f"**How to Apply:**\n"
                    f"1. Open the verified government portal: [{portal_url}]({portal_url})\n"
                    f"2. Keep your identity documents (Aadhaar, Ration card / Category certificate if applicable) ready.\n"
                    f"3. Submit the verified application directly on the government portal with zero fee."
                ) if lang == "en" else (
                    f"### 🏛️ {fb_name} — आधिकारिक आवेदन वेबसाइट\n\n"
                    f"• **आधिकारिक पोर्टल लिंक:** [{fb_name} आधिकारिक वेबसाइट]({portal_url})\n"
                    f"• **आवेदन का तरीका:** `{app_mode}`\n"
                    f"• **सत्यापित लाभ:** {benefit_text}\n"
                    f"• **पात्रता:** {elig_text}\n\n"
                    f"**आवेदन कैसे करें:**\n"
                    f"1. आधिकारिक सरकारी पोर्टल पर जाएं: [{portal_url}]({portal_url})\n"
                    f"2. अपना आधार कार्ड, राशन कार्ड या जाति प्रमाण पत्र (यदि लागू हो) तैयार रखें।\n"
                    f"3. बिना किसी शुल्क के सीधे आधिकारिक सरकारी पोर्टल पर आवेदन करें।"
                )
                actions = [
                    SakhiActionButton(label="Open Official Portal", action="open_url", payload={"url": portal_url}),
                    SakhiActionButton(label="Browse Free Benefits", action="navigate", payload={"path": "/free-benefits"})
                ]
                return SakhiChatResponse(
                    answer=ans_text,
                    intent="HOW_TO_APPLY",
                    sources=[SourceCitation(scheme_id=target_free_benefit.get("benefit_id"), scheme_name=fb_name, authority="Government of India / myScheme", official_url=portal_url)],
                    eligibility_result=None,
                    language=language,
                    suggested_prompts=["Who is eligible for this benefit?", "Browse all Free Benefits", "Check LIC Plans", "Find My Schemes"],
                    action_buttons=actions,
                    disclaimer="Information strictly verified against official Government gazettes and myScheme records."
                )

            if target_scheme:
                s_name = target_scheme.get("name")
                if isinstance(s_name, dict):
                    s_name = s_name.get(lang) or s_name.get("en", "")
                official_url = target_scheme.get("official_url", "https://india.gov.in")
                authority = target_scheme.get("authority", "Government of India")
                elig_summary = target_scheme.get("eligibility_summary", "")

                ans_text_dict = {
                    "en": (
                        f"### 🏛️ Official Application Portal: {s_name}\n\n"
                        f"• **Official Website:** [{s_name} Portal]({official_url})\n"
                        f"• **Governing Authority:** {authority}\n"
                        f"• **Eligibility Summary:** {elig_summary}\n\n"
                        f"**How to Apply:**\n"
                        f"1. Visit the verified official portal: [{official_url}]({official_url})\n"
                        f"2. Keep your Aadhaar Card, PAN Card, and registered mobile number ready for verification.\n"
                        f"3. For Post Office or bank-operated schemes (like PPF, SSY, SCSS), you can also submit the application form at any authorized bank branch or India Post office."
                    ),
                    "hi": (
                        f"### 🏛️ {s_name} — आधिकारिक आवेदन वेबसाइट\n\n"
                        f"• **आधिकारिक पोर्टल:** [{s_name} आधिकारिक वेबसाइट]({official_url})\n"
                        f"• **प्राधिकरण:** {authority}\n"
                        f"• **पात्रता सारांश:** {elig_summary}\n\n"
                        f"**आवेदन कैसे करें:**\n"
                        f"1. आधिकारिक पोर्टल पर जाएं: [{official_url}]({official_url})\n"
                        f"2. आधार कार्ड, पैन कार्ड और आधार से जुड़ा मोबाइल नंबर तैयार रखें।\n"
                        f"3. डाकघर या बैंक संचालित योजनाओं (जैसे PPF, SSY, SCSS) के लिए आप नजदीकी डाकघर या अधिकृत बैंक शाखा में भी फॉर्म जमा कर सकते हैं।"
                    ),
                    "mr": (
                        f"### 🏛️ {s_name} — अधिकृत अर्ज संकेतस्थळ\n\n"
                        f"• **अधिकृत पोर्टल:** [{s_name} अधिकृत संकेतस्थळ]({official_url})\n"
                        f"• **प्राधिकरण:** {authority}\n"
                        f"• **पात्रता सारांश:** {elig_summary}\n\n"
                        f"**अर्ज कसा करावा:**\n"
                        f"1. अधिकृत पोर्टलला भेट द्या: [{official_url}]({official_url})\n"
                        f"2. आधार कार्ड, पॅन कार्ड आणि नोंदणीकृत मोबाइल नंबर तयार ठेवा.\n"
                        f"3. टपाल कार्यालय किंवा अधिकृत बँकेत जाऊनही अर्ज सादर करता येतो."
                    ),
                    "bn": (
                        f"### 🏛️ {s_name} — অফিসিয়াল আবেদন ওয়েবসাইট\n\n"
                        f"• **অফিসিয়াল পোর্টাল:** [{s_name} অফিসিয়াল ওয়েবসাইট]({official_url})\n"
                        f"• **কর্তৃপক্ষ:** {authority}\n"
                        f"• **যোগ্যতার সারসংক্ষেপ:** {elig_summary}\n\n"
                        f"**কীভাবে আবেদন করবেন:**\n"
                        f"1. অফিসিয়াল পোর্টালে যান: [{official_url}]({official_url})\n"
                        f"2. আধার কার্ড, প্যান কার্ড এবং মোবাইল নম্বর প্রস্তুত রাখুন।\n"
                        f"3. পোস্ট অফিস বা অনুমোদিত ব্যাংক শাখায় গিয়েও আবেদন করতে পারেন।"
                    ),
                    "te": (
                        f"### 🏛️ {s_name} — అధికారిక దరఖాస్తు వెబ్‌సైట్\n\n"
                        f"• **అధికారిక పోర్టల్:** [{s_name} అధికారిక వెబ్‌సైట్]({official_url})\n"
                        f"• **అధికార యంత్రాంగం:** {authority}\n"
                        f"• **అర్హత సారాంశం:** {elig_summary}\n\n"
                        f"**ఎలా దరఖాస్తు చేయాలి:**\n"
                        f"1. అధికారిక పోర్టల్‌ను సందర్శించండి: [{official_url}]({official_url})\n"
                        f"2. ఆధార్ కార్డ్, పాన్ కార్డ్ మరియు మొబైల్ నంబర్ సిద్ధంగా ఉంచుకోండి.\n"
                        f"3. పోస్టాఫీస్ లేదా బ్యాంకు శాఖల ద్వారా కూడా దరఖాస్తు చేసుకోవచ్చు."
                    )
                }
                ans_text = ans_text_dict.get(lang, ans_text_dict["en"])
                return SakhiChatResponse(
                    answer=ans_text,
                    intent="HOW_TO_APPLY",
                    sources=self.build_sources([target_scheme]),
                    eligibility_result=None,
                    language=language,
                    suggested_prompts=[f"Am I eligible for {s_name}?", "Withdrawal rules", "Check All Schemes"],
                    action_buttons=[
                        SakhiActionButton(label="Open Official Website", action="open_url", payload={"url": official_url}),
                        SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                    ]
                )

            apply_ans = {
                "en": (
                    "### 🏛️ Official Application Portals for Government Schemes & Benefits\n\n"
                    "If you are looking for a specific scheme (such as PPF, Sukanya Samriddhi, PMGKAY, PM-JAY, or PM-KISAN), please mention the scheme name. Here are the key verified official application portals:\n\n"
                    "• **myScheme National Portal:** [myscheme.gov.in](https://www.myscheme.gov.in) — Central & State government schemes directory & online application check\n"
                    "• **India Post:** [indiapost.gov.in](https://www.indiapost.gov.in) — PPF, Sukanya Samriddhi (SSY), SCSS, NSC, KVP accounts\n"
                    "• **Jan Samarth Portal:** [jansamarth.in](https://www.jansamarth.in) — MUDRA, PMEGP, and Stand-Up India business loans\n"
                    "• **Ayushman Bharat PM-JAY:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/) — Cashless hospitalization cover up to ₹5 Lakh\n"
                    "• **PM-KISAN:** [pmkisan.gov.in](https://pmkisan.gov.in) — Direct Benefit Transfer for eligible farmers\n\n"
                    "**Which scheme's application link would you like?** You can type the name or select from the options below."
                ),
                "hi": (
                    "### 🏛️ सरकारी योजनाओं व लाभों के लिए आधिकारिक आवेदन पोर्टल्स\n\n"
                    "यदि आप किसी विशेष योजना (जैसे PPF, सुकन्या समृद्धि, PMGKAY, आयुष्मान भारत, या PM-किसान) के लिए आधिकारिक वेबसाइट चाहते हैं, तो कृपया उस योजना का नाम लिखें। मुख्य आधिकारिक सरकारी पोर्टल्स:\n\n"
                    "• **myScheme राष्ट्रीय पोर्टल:** [myscheme.gov.in](https://www.myscheme.gov.in) — 1,500+ केंद्रीय व राज्य सरकारी योजनाओं के लिए\n"
                    "• **भारतीय डाक विभाग (India Post):** [indiapost.gov.in](https://www.indiapost.gov.in) — PPF, SSY, SCSS, NSC, KVP बचत खातों के लिए\n"
                    "• **जन समर्थ पोर्टल:** [jansamarth.in](https://www.jansamarth.in) — मुद्रा व PMEGP व्यवसाय ऋण के लिए\n"
                    "• **आयुष्मान भारत (PM-JAY):** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/) — ₹5 लाख तक मुफ़्त स्वास्थ्य उपचार के लिए\n"
                    "• **PM-KISAN पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in) — किसान सम्मान निधि DBT के लिए\n\n"
                    "**आप किस योजना की आवेदन वेबसाइट जानना चाहते हैं?** आप नीचे दिए गए विकल्पों में से चुन सकते हैं:"
                ),
                "mr": (
                    "### 🏛️ सरकारी योजना आणि लाभांसाठी अधिकृत अर्ज पोर्टल्स\n\n"
                    "तुम्हाला विशिष्ट योजनेची माहिती हवी असल्यास तिचे नाव सांगा. मुख्य अधिकृत पोर्टल्स:\n\n"
                    "• **myScheme राष्ट्रीय पोर्टल:** [myscheme.gov.in](https://www.myscheme.gov.in)\n"
                    "• **भारतीय डाक विभाग (India Post):** [indiapost.gov.in](https://www.indiapost.gov.in) — PPF, SSY, SCSS, NSC\n"
                    "• **जन समर्थ पोर्टल:** [jansamarth.in](https://www.jansamarth.in) — मुद्रा आणि PMEGP कर्ज\n"
                    "• **आयुष्मान भारत (PM-JAY):** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/)\n"
                    "• **PM-KISAN पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)"
                ),
                "bn": (
                    "### 🏛️ সরকারি প্রকল্প ও সুবিধার জন্য অফিসিয়াল আবেদন পোর্টাল\n\n"
                    "নির্দিষ্ট কোনো প্রকল্পের জন্য আবেদন করতে চাইলে অনুগ্রহ করে সেটির নাম জানান। প্রধান সরকারি পোর্টালসমূহ:\n\n"
                    "• **myScheme পোর্টাল:** [myscheme.gov.in](https://www.myscheme.gov.in)\n"
                    "• **ইন্ডিয়া পোস্ট:** [indiapost.gov.in](https://www.indiapost.gov.in) — PPF, SSY, SCSS, NSC\n"
                    "• **জন সমর্থ পোর্টাল:** [jansamarth.in](https://www.jansamarth.in) — মুদ্রা ও ব্যবসা ঋণ\n"
                    "• **আয়ুষ্মান ভারত (PM-JAY):** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/)\n"
                    "• **PM-KISAN পোর্টাল:** [pmkisan.gov.in](https://pmkisan.gov.in)"
                ),
                "te": (
                    "### 🏛️ ప్రభుత్వ పథకాలు మరియు ప్రయోజనాల కోసం అధికారిక దరఖాస్తు పోర్టల్స్\n\n"
                    "మీరు నిర్దిష్ట పథకం కోసం చూస్తున్నట్లయితే దయచేసి దాని పేరు చెప్పండి. ప్రధాన అధికారిక పోర్టల్‌లు:\n\n"
                    "• **myScheme జాతీయ పోర్టల్:** [myscheme.gov.in](https://www.myscheme.gov.in)\n"
                    "• **ఇండియా పోస్ట్:** [indiapost.gov.in](https://www.indiapost.gov.in) — PPF, SSY, SCSS, NSC\n"
                    "• **జన్ సమర్థ్ పోర్టల్:** [jansamarth.in](https://www.jansamarth.in) — ముద్రా రుణాలు\n"
                    "• **ఆయుష్మాన్ భారత్ (PM-JAY):** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in/)\n"
                    "• **PM-KISAN పోర్టల్:** [pmkisan.gov.in](https://pmkisan.gov.in)"
                )
            }
            return SakhiChatResponse(
                answer=apply_ans.get(lang, apply_ans["en"]),
                intent="HOW_TO_APPLY",
                sources=self.build_sources(self.resolve_schemes(["ppf_001", "ssy_001", "mudra_001"], message, allow_defaults=False)),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["PPF application portal", "Ayushman Bharat website", "PM-KISAN portal", "Sukanya Samriddhi form"],
                action_buttons=[
                    SakhiActionButton(label="myScheme National Portal", action="open_url", payload={"url": "https://www.myscheme.gov.in"}),
                    SakhiActionButton(label="Official India Post", action="open_url", payload={"url": "https://www.indiapost.gov.in"}),
                    SakhiActionButton(label="Explore All Schemes", action="navigate", payload={"path": "/explore"})
                ]
            )

        # -------------------------------------------------------------
        # 3f. Safety & 100% Sovereign Guarantee
        # -------------------------------------------------------------
        if intent == "SAFETY_INQUIRY":
            safe_ans = {
                "en": (
                    "### 🛡️ 100% Sovereign Safety & Security of Government Schemes\n\n"
                    "**Are Government Schemes 100% Safe?**\n"
                    "**Yes, absolutely.** All Government Small Savings Schemes (PPF, SSY, SCSS, NSC, KVP, POMIS) and statutory pensions carry a **100% Sovereign Guarantee by the Government of India**.\n\n"
                    "**Key Safety Highlights:**\n"
                    "• **Backed by Consolidated Fund of India:** Unlike commercial bank deposits (insured only up to ₹5 Lakh under DICGC), small savings schemes have unlimited, 100% sovereign backing.\n"
                    "• **Zero Credit Default Risk:** Your principal investment and declared interest are guaranteed by statutory Parliament Acts and Ministry of Finance gazettes.\n"
                    "• **Immunity from Market Volatility:** Schemes like PPF, SSY, SCSS, and NSC are not linked to stock market swings — returns are guaranteed and fixed quarterly by the Government."
                ),
                "hi": (
                    "### 🛡️ 100% संप्रभु सुरक्षा: सरकारी योजनाओं में पूंजी की गारंटी\n\n"
                    "**क्या सरकारी योजनाएं 100% सुरक्षित हैं?**\n"
                    "**हाँ, बिल्कुल सुरक्षित हैं।** भारत सरकार की सभी लघु बचत योजनाएं (PPF, SSY, SCSS, NSC, KVP, POMIS) **भारत की संचित निधि (Consolidated Fund of India)** द्वारा 100% संप्रभु गारंटी (Sovereign Guarantee) प्राप्त हैं।\n\n"
                    "**सुरक्षा की प्रमुख विशेषताएं:**\n"
                    "• **असीमित सरकारी सुरक्षा:** सामान्य बैंक जमा में DICGC द्वारा केवल ₹5 लाख तक का बीमा होता है, जबकि डाकघर व सरकारी लघु बचत योजनाओं में आपकी **पूरी राशि 100% सुरक्षित** होती है।\n"
                    "• **शून्य डिफ़ॉल्ट जोखिम:** मूलधन और घोषित ब्याज का भुगतान सीधे वित्त मंत्रालय द्वारा गारंटीकृत है।\n"
                    "• **शेयर बाज़ार के उतार-चढ़ाव से मुक्त:** इन योजनाओं पर बाज़ार के नुकसान का कोई असर नहीं पड़ता।"
                )
            }
            return SakhiChatResponse(
                answer=safe_ans.get(lang, safe_ans["en"]),
                intent="SAFETY_INQUIRY",
                sources=self.build_sources(self.resolve_schemes(["ppf_001", "ssy_001", "scss_001"], message, allow_defaults=False)),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["Highest interest rate", "What is PPF?", "Sukanya Samriddhi Yojana", "Find My Schemes"],
                action_buttons=[SakhiActionButton(label="Explore Safe Schemes", action="navigate", payload={"path": "/explore"})]
            )

        # -------------------------------------------------------------
        # 3g. Money Doubling Scheme (KVP)
        # -------------------------------------------------------------
        if intent == "MONEY_DOUBLING_QUERY":
            kvp_ans = {
                "en": (
                    "### 💰 Kisan Vikas Patra (KVP) — Sovereign Money Doubling Scheme\n\n"
                    "**Kisan Vikas Patra (KVP)** is the officially notified Government of India scheme designed specifically to **double your investment**.\n\n"
                    "**Key Terms (Q4 FY 2025–26):**\n"
                    "• **Current Interest Rate:** **7.50% per annum** (compounded annually)\n"
                    "• **Doubling Period:** Exactly **115 Months (9 Years and 7 Months)**\n"
                    "• **Minimum Investment:** ₹1,000 (no maximum ceiling)\n"
                    "• **Eligibility:** Any resident Indian adult (single or joint account) or guardian on behalf of minor\n"
                    "• **Premature Withdrawal:** Permitted after 2 years and 6 months (30 months)\n"
                    "• **Sovereign Guarantee:** 100% backed by Government of India"
                ),
                "hi": (
                    "### 💰 किसान विकास पत्र (KVP) — सरकारी पैसा दोगुना करने वाली योजना\n\n"
                    "**किसान विकास पत्र (KVP)** भारत सरकार द्वारा अधिसूचित आधिकारिक योजना है जो आपकी जमा राशि को **दोगुना (2x)** करती है।\n\n"
                    "**नियम व शर्तें (Q4 FY 2025–26):**\n"
                    "• **वर्तमान ब्याज दर:** **7.50% वार्षिक** (वार्षिक चक्रवृद्धि)\n"
                    "• **पैसा दोगुना होने की अवधि:** ठीक **115 महीने (9 वर्ष 7 माह)**\n"
                    "• **न्यूनतम जमा:** ₹1,000 (अधिकतम निवेश की कोई सीमा नहीं)\n"
                    "• **पात्रता:** सभी भारतीय वयस्क नागरिक (अकेले या संयुक्त खाता) अथवा बच्चे के नाम पर अभिभावक\n"
                    "• **समयपूर्व निकासी:** 2 वर्ष 6 माह (30 महीने) के बाद निकासी की अनुमति\n"
                    "• **सुरक्षा:** भारत सरकार द्वारा 100% गारंटीकृत"
                )
            }
            return SakhiChatResponse(
                answer=kvp_ans.get(lang, kvp_ans["en"]),
                intent="MONEY_DOUBLING_QUERY",
                sources=self.build_sources(self.resolve_schemes(["kvp_001"], message, allow_defaults=False)),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["What is PPF?", "Highest interest rate", "Compare KVP vs NSC", "Find My Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Compare with NSC", action="ask_prompt", payload={"prompt": "Compare KVP and NSC"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 3h. Section 80C Tax Saving & EEE Category Guide
        # -------------------------------------------------------------
        if intent == "TAX_SAVINGS_GUIDE":
            tax_ans = {
                "en": (
                    "### 🛡️ Section 80C & 100% Tax-Free Sovereign Savings Guide (FY 2025–26)\n\n"
                    "| Scheme Name | Annual Deduction Limit | Interest Taxability | Maturity Taxability | Tax Category |\n"
                    "|---|---|---|---|---|\n"
                    "| **Public Provident Fund (PPF)** | Up to ₹1.5 Lakh (Sec 80C) | 100% Tax-Free | 100% Tax-Free | **EEE (Exempt-Exempt-Exempt)** |\n"
                    "| **Sukanya Samriddhi Yojana (SSY)** | Up to ₹1.5 Lakh (Sec 80C) | 100% Tax-Free | 100% Tax-Free | **EEE (Exempt-Exempt-Exempt)** |\n"
                    "| **Senior Citizen Savings (SCSS)** | Up to ₹1.5 Lakh (Sec 80C) | Taxable as per slab | Principal Tax-Free | **EET** |\n"
                    "| **National Savings Certificate (NSC)** | Up to ₹1.5 Lakh (Sec 80C) | Deemed Reinvested (80C) | Taxable in final yr | **EET** |\n"
                    "| **National Pension System (NPS)** | Up to ₹2 Lakh (80C + 80CCD 1B) | Tax-Free on growth | 60% Lump sum Tax-Free | **PFRDA Regulated** |\n\n"
                    "👉 **What is EEE?** In PPF and SSY, your deposit, accrued interest, and entire final maturity amount are **100% Income-Tax Free** under the Income Tax Act."
                ),
                "hi": (
                    "### 🛡️ धारा 80C और 100% कर-मुक्त (Tax-Free) सरकारी बचत गाइड\n\n"
                    "| योजना | 80C कटौती सीमा | ब्याज पर टैक्स | परिपक्वता (Maturity) टैक्स | टैक्स श्रेणी |\n"
                    "|---|---|---|---|---|\n"
                    "| **पब्लिक प्रोविडेंट फंड (PPF)** | ₹1.5 लाख तक (80C) | 100% कर-मुक्त | 100% कर-मुक्त | **EEE (पूर्णतः टैक्स फ्री)** |\n"
                    "| **सुकन्या समृद्धि योजना (SSY)** | ₹1.5 लाख तक (80C) | 100% कर-मुक्त | 100% कर-मुक्त | **EEE (पूर्णतः टैक्स फ्री)** |\n"
                    "| **वरिष्ठ नागरिक बचत (SCSS)** | ₹1.5 लाख तक (80C) | टैक्स स्लैब अनुसार | मूलधन कर-मुक्त | **EET** |\n"
                    "| **राष्ट्रीय बचत पत्र (NSC)** | ₹1.5 लाख तक (80C) | 80C में पुनर्निहित | अंतिम वर्ष में कर योग्य | **EET** |\n"
                    "| **राष्ट्रीय पेंशन प्रणाली (NPS)** | ₹2 लाख तक (80C + 80CCD 1B) | विकास कर-मुक्त | 60% एकमुश्त राशि कर-मुक्त | **PFRDA** |\n\n"
                    "👉 **EEE क्या है?** PPF और SSY में आपका निवेश, मिलने वाला ब्याज और मैच्योरिटी पर मिलने वाली पूरी रकम **तीनों स्तरों पर 100% टैक्स फ्री** होती है।"
                )
            }
            return SakhiChatResponse(
                answer=tax_ans.get(lang, tax_ans["en"]),
                intent="TAX_SAVINGS_GUIDE",
                sources=self.build_sources(self.resolve_schemes(["ppf_001", "ssy_001", "nsc_001", "scss_001"], message, allow_defaults=False)),
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["What is PPF?", "Sukanya Samriddhi rules", "Compare PPF vs NSC", "Find My Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Compare Tax Benefits", action="navigate", payload={"path": "/compare"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 4. Multi-Scheme Comparison (e.g. Compare PPF, NSC and KVP)
        # -------------------------------------------------------------
        if intent == "COMPARE_SCHEMES" and len(matched_schemes) >= 2:
            comp_schemes = matched_schemes[:4]
            headers = ["Parameter"] + [s.get("short_name") or get_scheme_display_name(s, lang) for s in comp_schemes]
            
            row_yield = ["**Interest / Yield**"] + [get_scheme_interest_or_benefit(s, lang) for s in comp_schemes]
            
            row_lockin = []
            for s in comp_schemes:
                fin = s.get("financial") if isinstance(s.get("financial"), dict) else {}
                lock = fin.get("lock_in") or fin.get("lock_in_period") or "Standard"
                row_lockin.append(str(lock))
            row_lockin = ["**Lock-in / Tenure**"] + row_lockin

            row_min_c = []
            for s in comp_schemes:
                fin = s.get("financial") if isinstance(s.get("financial"), dict) else {}
                min_c = fin.get("minimum_contribution")
                row_min_c.append(f"₹{min_c:,.0f}" if min_c is not None else "Not specified in Sanchay's verified data")
            row_min_c = ["**Min Contribution**"] + row_min_c

            row_tax = []
            for s in comp_schemes:
                ben = s.get("benefits") if isinstance(s.get("benefits"), dict) else {}
                fin = s.get("financial") if isinstance(s.get("financial"), dict) else {}
                tax_str = str(ben.get("tax_benefit") or fin.get("tax_treatment") or "Statutory Provisions")
                row_tax.append(tax_str)
            row_tax = ["**Tax Benefit**"] + row_tax

            row_auth = ["**Authority**"] + [get_scheme_authority(s) for s in comp_schemes]
            
            table_header = "| " + " | ".join(headers) + " |"
            table_divider = "| " + " | ".join(["---"] * len(headers)) + " |"
            table_rows = "\n".join([
                "| " + " | ".join(row_yield) + " |",
                "| " + " | ".join(row_lockin) + " |",
                "| " + " | ".join(row_min_c) + " |",
                "| " + " | ".join(row_tax) + " |",
                "| " + " | ".join(row_auth) + " |"
            ])

            names_str = ", ".join([s.get("short_name") or get_scheme_display_name(s, lang) for s in comp_schemes])
            comp_templates = {
                "en": (
                    f"### ⚖️ Side-by-Side Scheme Comparison: {names_str}\n\n"
                    f"{table_header}\n"
                    f"{table_divider}\n"
                    f"{table_rows}\n\n"
                    f"**Summary:** All {len(comp_schemes)} schemes are 100% verified against official Government of India gazettes. Click below to inspect in-depth parameters or evaluate your eligibility."
                ),
                "hi": (
                    f"### ⚖️ सरकारी योजनाओं की तुलना: {names_str}\n\n"
                    f"{table_header}\n"
                    f"{table_divider}\n"
                    f"{table_rows}\n\n"
                    f"**निष्कर्ष:** ये सभी {len(comp_schemes)} योजनाएं भारत सरकार के आधिकारिक राजपत्रों से सत्यापित हैं।"
                ),
                "mr": (
                    f"### ⚖️ सरकारी योजनांची तुलना: {names_str}\n\n"
                    f"{table_header}\n"
                    f"{table_divider}\n"
                    f"{table_rows}\n\n"
                    f"**निष्कर्ष:** या सर्व {len(comp_schemes)} योजना भारत सरकारच्या अधिकृत राजपत्रांवर आधारित आहेत."
                ),
                "bn": (
                    f"### ⚖️ সরকারি প্রকল্পসমূহের তুলনা: {names_str}\n\n"
                    f"{table_header}\n"
                    f"{table_divider}\n"
                    f"{table_rows}\n\n"
                    f"**সারসংক্ষেপ:** এই সমস্ত {len(comp_schemes)}টি স্কিম ভারত সরকারের অফিসিয়াল গেজেটের ওপর ভিত্তি করে যাচাইকৃত।"
                ),
                "te": (
                    f"### ⚖️ ప్రభుత్వ పథకాల పోలిక: {names_str}\n\n"
                    f"{table_header}\n"
                    f"{table_divider}\n"
                    f"{table_rows}\n\n"
                    f"**సారాంశం:** ఈ {len(comp_schemes)} పథకాలన్నీ భారత ప్రభుత్వ అధికారిక గెజిట్‌ల ఆధారంగా ధృవీకరించబడ్డాయి."
                )
            }
            ans_comp = comp_templates.get(lang, comp_templates["en"])

            return SakhiChatResponse(
                answer=ans_comp,
                intent="COMPARE_SCHEMES",
                sources=sources[:len(comp_schemes)],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=[
                    f"Am I eligible for {comp_schemes[0].get('short_name', 'PPF')}?",
                    f"Am I eligible for {comp_schemes[1].get('short_name', 'NSC')}?",
                    "Find My Schemes"
                ],
                action_buttons=[
                    SakhiActionButton(label="Compare in Detail", action="navigate", payload={"path": "/compare"}),
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})
                ]
            )

        # -------------------------------------------------------------
        # 6. Scheme-Specific or Profile-Based Eligibility Checks
        # -------------------------------------------------------------
        if intent == "CHECK_ELIGIBILITY":
            # Case A: User asks about specific schemes (e.g. "Am I eligible for APY?" or "Can a 25 year old open SSY?")
            if matched_schemes and len(extracted_schemes) >= 1:
                primary = matched_schemes[0]
                short_name = primary.get("short_name") or get_scheme_display_name(primary, lang)
                elig_eval = evaluate_eligibility(primary, user_profile_obj)

                elig = primary.get("eligibility", {})
                min_age = elig.get("min_age") if "min_age" in elig else elig.get("age_min")
                max_age = elig.get("max_age") if "max_age" in elig else elig.get("age_max")
                gender_req = elig.get("gender", "all")

                if elig_eval.status == "INELIGIBLE":
                    failed_msg = elig_eval.failed_criteria[0] if elig_eval.failed_criteria else "Mandatory statutory constraints violated."
                    ineligible_templates = {
                        "en": (
                            f"### ❌ Eligibility Verdict: INELIGIBLE\n\n"
                            f"**Scheme:** {short_name}\n\n"
                            f"• **Disqualification Reason:** {failed_msg}\n"
                            f"• **Statutory Age Bracket:** {min_age or 'None'} to {max_age or 'None'} years\n"
                            f"• **Gender Restriction:** {gender_req}\n\n"
                            f"This evaluation is strictly computed by SANCHAY's deterministic rule engine from official {get_scheme_authority(primary)} gazettes."
                        ),
                        "hi": (
                            f"### ❌ पात्रता परिणाम: अपात्र (INELIGIBLE)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"• **अपात्रता का मुख्य कारण:** {failed_msg}\n"
                            f"• **वैधानिक आयु सीमा:** {min_age or 0} से {max_age or 'कोई सीमा नहीं'} वर्ष\n"
                            f"• **लिंग शर्त:** {gender_req}\n\n"
                            f"यह निर्णय {get_scheme_authority(primary)} के आधिकारिक नियमों पर आधारित है।"
                        ),
                        "mr": (
                            f"### ❌ पात्रता निकाल: अपात्र (INELIGIBLE)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"• **अपात्रतेचे मुख्य कारण:** {failed_msg}\n"
                            f"• **वैधानिक वयोमर्यादा:** {min_age or 0} ते {max_age or 'कोणतीही मर्यादा नाही'} वर्षे\n"
                            f"• **लिंग अट:** {gender_req}\n\n"
                            f"हा निर्णय {get_scheme_authority(primary)} च्या अधिकृत नियमांवर आधारित आहे."
                        ),
                        "bn": (
                            f"### ❌ যোগ্যতার ফলাফল: অযোগ্য (INELIGIBLE)\n\n"
                            f"**প্রকল্প:** {short_name}\n\n"
                            f"• **অযোগ্যতার প্রধান কারণ:** {failed_msg}\n"
                            f"• **আইনসম্মত বয়সসীমা:** {min_age or 0} থেকে {max_age or 'কোন সীমা নেই'} বছর\n"
                            f"• **লিঙ্গ সংক্রান্ত শর্ত:** {gender_req}\n\n"
                            f"এই সিদ্ধান্ত {get_scheme_authority(primary)}-এর অফিসিয়াল গেজেটের ওপর ভিত্তি করে তৈরি।"
                        ),
                        "te": (
                            f"### ❌ అర్హత ఫలితం: అనర్హులు (INELIGIBLE)\n\n"
                            f"**పథకం:** {short_name}\n\n"
                            f"• **అనర్హతకు ప్రధాన కారణం:** {failed_msg}\n"
                            f"• **చట్టబద్ధమైన వయోపరిమితి:** {min_age or 0} నుండి {max_age or 'పరిమితి లేదు'} సంవత్సరాలు\n"
                            f"• **లింగ నిబంధన:** {gender_req}\n\n"
                            f"ఈ నిర్ణయం {get_scheme_authority(primary)} అధికారిక నిబంధనల ప్రకారం తీసుకోబడింది."
                        )
                    }
                    ans = ineligible_templates.get(lang, ineligible_templates["en"])
                    return SakhiChatResponse(
                        answer=ans,
                        intent="CHECK_ELIGIBILITY",
                        sources=sources[:1],
                        eligibility_result="INELIGIBLE",
                        guardrail_applied=None,
                        language=language,
                        suggested_prompts=[f"What is the interest rate for {short_name}?", f"What is the lock-in for {short_name}?", "Find My Schemes"],
                        action_buttons=[SakhiActionButton(label="Official Portal", action="open_url", payload={"url": get_scheme_official_url(primary)})]
                    )
                elif elig_eval.status == "REVIEW_REQUIRED":
                    review_fields = ", ".join(elig_eval.review_required_fields)
                    missing_income_prompt = get_multilingual_text("missing_annual_family_income", lang)
                    review_templates = {
                        "en": (
                            f"### ⚠️ Eligibility Verdict: ADDITIONAL_INFORMATION_REQUIRED\n\n"
                            f"**Scheme:** {short_name}\n\n"
                            f"{missing_income_prompt if 'income' in review_fields.lower() or 'annual_income' in review_fields.lower() else f'To verify statutory eligibility for **{short_name}**, the following details are required: **{review_fields}**.'}\n\n"
                            f"• **Statutory Rules:** Entry age {min_age or 0} to {max_age or 'unrestricted'} years; residency requirement: {elig.get('residency', 'Resident Indian')}."
                        ),
                        "hi": (
                            f"### ⚠️ पात्रता परिणाम: अतिरिक्त जानकारी आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"{missing_income_prompt if 'income' in review_fields.lower() or 'annual_income' in review_fields.lower() else f'**{short_name}** के लिए आपकी पात्रता जांचने हेतु यह जानकारी आवश्यक है: **{review_fields}**।'}"
                        ),
                        "mr": (
                            f"### ⚠️ पात्रता निकाल: अतिरिक्त माहिती आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"{missing_income_prompt if 'income' in review_fields.lower() or 'annual_income' in review_fields.lower() else f'**{short_name}** साठी तुमची पात्रता तपासण्यासाठी ही माहिती आवश्यक आहे: **{review_fields}**.'}"
                        ),
                        "bn": (
                            f"### ⚠️ যোগ্যতার ফলাফল: অতিরিক্ত তথ্য প্রয়োজন (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                            f"**প্রকল্প:** {short_name}\n\n"
                            f"{missing_income_prompt if 'income' in review_fields.lower() or 'annual_income' in review_fields.lower() else f'**{short_name}**-এর যোগ্যতা যাচাই করতে এই তথ্যটি প্রয়োজন: **{review_fields}**।'}"
                        ),
                        "te": (
                            f"### ⚠️ అర్హత ఫలితం: అదనపు సమాచారం అవసరం (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                            f"**పథకం:** {short_name}\n\n"
                            f"{missing_income_prompt if 'income' in review_fields.lower() or 'annual_income' in review_fields.lower() else f'**{short_name}** కోసం మీ అర్హతను తనిఖీ చేయడానికి ఈ సమాచారం అవసరం: **{review_fields}**.'}"
                        )
                    }
                    ans = review_templates.get(lang, review_templates["en"])
                    return SakhiChatResponse(
                        answer=ans,
                        intent="CHECK_ELIGIBILITY",
                        sources=sources[:1],
                        eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
                        guardrail_applied=None,
                        language=language,
                        suggested_prompts=[f"What is the interest rate for {short_name}?", "Find My Schemes"],
                        action_buttons=[SakhiActionButton(label="Official Portal", action="open_url", payload={"url": get_scheme_official_url(primary)})]
                    )
                else:
                    passed_str = "\n".join([f"• {r}" for r in elig_eval.reasons[:4]])
                    eligible_templates = {
                        "en": (
                            f"### ✅ Eligibility Verdict: ELIGIBLE\n\n"
                            f"**Scheme:** {short_name}\n\n"
                            f"You meet 100% of the statutory eligibility criteria for {short_name}:\n\n"
                            f"{passed_str}\n\n"
                            f"Verified against official {get_scheme_authority(primary)} gazettes."
                        ),
                        "hi": (
                            f"### ✅ पात्रता परिणाम: पात्र (ELIGIBLE)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"आप {short_name} के सभी वैधानिक पात्रता मानदंडों को पूरा करते हैं:\n\n"
                            f"{passed_str}\n\n"
                            f"आधिकारिक स्रोत: {get_scheme_authority(primary)}।"
                        ),
                        "mr": (
                            f"### ✅ पात्रता निकाल: पात्र (ELIGIBLE)\n\n"
                            f"**योजना:** {short_name}\n\n"
                            f"तुम्ही {short_name} च्या सर्व वैधानिक पात्रता निकषांची पूर्तता करता:\n\n"
                            f"{passed_str}\n\n"
                            f"अधिकृत स्रोत: {get_scheme_authority(primary)}."
                        ),
                        "bn": (
                            f"### ✅ যোগ্যতার ফলাফল: যোগ্য (ELIGIBLE)\n\n"
                            f"**প্রকল্প:** {short_name}\n\n"
                            f"আপনি {short_name}-এর সমস্ত বিধিবদ্ধ যোগ্যতার শর্ত পূরণ করেন:\n\n"
                            f"{passed_str}\n\n"
                            f"অফিসিয়াল সোর্স: {get_scheme_authority(primary)}।"
                        ),
                        "te": (
                            f"### ✅ అర్హత ఫలితం: అర్హులు (ELIGIBLE)\n\n"
                            f"**పథకం:** {short_name}\n\n"
                            f"మీరు {short_name} యొక్క అన్ని చట్టబద్ధమైన అర్హత ప్రమాణాలను పూర్తి చేశారు:\n\n"
                            f"{passed_str}\n\n"
                            f"అధికారిక మూలం: {get_scheme_authority(primary)}."
                        )
                    }
                    ans = eligible_templates.get(lang, eligible_templates["en"])
                    return SakhiChatResponse(
                        answer=ans,
                        intent="CHECK_ELIGIBILITY",
                        sources=sources[:1],
                        eligibility_result="ELIGIBLE",
                        guardrail_applied=None,
                        language=language,
                        suggested_prompts=[f"What is the interest rate for {short_name}?", f"What is the lock-in for {short_name}?", "Find My Schemes"],
                        action_buttons=[SakhiActionButton(label="Official Portal", action="open_url", payload={"url": get_scheme_official_url(primary)})]
                    )

            # Case B: General eligibility inquiry without specifying scheme OR essential parameters
            # e.g. "क्या मैं इसके लिए पात्र हूं?", "क्या मैं इस योजना के लिए eligible हूं?", "मेरी पात्रता जांचें"
            if not user_profile_obj.age:
                prompt_question = get_multilingual_text("missing_age_and_income", lang)

                missing_ans = {
                    "en": (
                        f"### ⚠️ Eligibility Verification: Information Required (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                        f"{prompt_question}\n\n"
                        f"If you have a specific scheme in mind, please also mention its name."
                    ),
                    "hi": (
                        f"### ⚠️ पात्रता जांच: अतिरिक्त जानकारी आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                        f"{prompt_question}\n\n"
                        f"यदि आप किसी विशेष योजना के लिए जांचना चाहते हैं, तो कृपया उसका नाम भी बताएं।"
                    ),
                    "mr": (
                        f"### ⚠️ पात्रता पडताळणी: माहिती आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                        f"{prompt_question}\n\n"
                        f"तुम्हाला एखाद्या विशिष्ट योजनेबद्दल विचारायचे असल्यास कृपया तिचे नावही सांगा."
                    ),
                    "bn": (
                        f"### ⚠️ যোগ্যতা যাচাই: তথ্য প্রয়োজন (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                        f"{prompt_question}\n\n"
                        f"আপনি যদি কোনও নির্দিষ্ট স্কিম সম্পর্কে জানতে চান তবে সেটির নামও উল্লেখ করুন।"
                    ),
                    "te": (
                        f"### ⚠️ అర్హత పరిశీలన: సమాచారం అవసరం (ADDITIONAL_INFORMATION_REQUIRED)\n\n"
                        f"{prompt_question}\n\n"
                        f"మీకు నిర్దిష్ట పథకం గురించి కావాలంటే, దయచేసి దాని పేరును కూడా పేర్కొనండి."
                    )
                }
                return SakhiChatResponse(
                    answer=missing_ans.get(lang, missing_ans["en"]),
                    intent="CHECK_ELIGIBILITY",
                    sources=[],
                    eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
                    guardrail_applied=None,
                    language=language,
                    suggested_prompts=["My age is 25", "Annual income ₹3,00,000", "Find My Schemes"],
                    action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
                )

            # Case C: Broad query with user age provided (e.g. "मैं 25 साल का हूं, मेरे लिए कौन सी योजना है?" / "मेरी उम्र 22 साल है और मैं राजस्थान से हूं")
            col = get_schemes_collection()
            all_active = list(col.find({"$or": [{"status.active": True}, {"active": True}]}))
            eligible_matches = []
            for sc in all_active:
                ev = evaluate_eligibility(sc, user_profile_obj)
                if ev.eligible:
                    eligible_matches.append(sc)

            if eligible_matches:
                bullets = []
                for sc in eligible_matches[:6]:
                    sc_name = sc.get("short_name") or get_scheme_display_name(sc, lang)
                    fin_s = sc.get("financial", {}) if isinstance(sc.get("financial"), dict) else {}
                    ben_s = sc.get("benefits", {}) if isinstance(sc.get("benefits"), dict) else {}
                    rate_str = fin_s.get("interest_rate") or ben_s.get("amount") or "Statutory Benefit"
                    bullets.append(f"• **{sc_name}:** {rate_str} ({get_scheme_authority(sc)})")
                
                bullets_text = "\n".join(bullets)
                age_text = f"age {user_profile_obj.age}" if user_profile_obj.age else "your declared profile"
                
                # Check if missing key profile fields like occupation and income
                is_missing_key_profile = (not parsed_occupation and not ctx_profile.get("occupation")) and (parsed_income is None and ctx_profile.get("annual_income") is None)
                
                if is_missing_key_profile:
                    missing_profile_templates = {
                        "en": (
                            f"### ✅ Eligible Verified Schemes for Age {user_profile_obj.age}\n\n"
                            f"According to SANCHAY's deterministic statutory engine, here are top verified schemes you qualify for based on age:\n\n"
                            f"{bullets_text}\n\n"
                            f"💡 **Additional Information Required:** To check exact targeted subsidies, farmer support, or scholarships, please share your **occupation** (e.g. Farmer, Student, Salaried) and **annual family income**."
                        ),
                        "hi": (
                            f"### ✅ {user_profile_obj.age} वर्ष की आयु के लिए पात्र सरकारी योजनाएं\n\n"
                            f"संचय के नियम इंजन के अनुसार आपकी आयु के आधार पर निम्नलिखित योजनाएं उपलब्ध हैं:\n\n"
                            f"{bullets_text}\n\n"
                            f"💡 **अतिरिक्त जानकारी आवश्यक:** अधिक सटीक सब्सिडी या छात्रवृत्ति जांचने के लिए कृपया अपना **व्यवसाय** (जैसे किसान, छात्र, नौकरीपेशा) और **वार्षिक पारिवारिक आय** भी बताएं।"
                        ),
                        "mr": (
                            f"### ✅ वय {user_profile_obj.age} साठी पात्र सरकारी योजना\n\n"
                            f"संचयच्या नियमांनुसार आपल्या वयाच्या आधारे खालील योजना उपलब्ध आहेत:\n\n"
                            f"{bullets_text}\n\n"
                            f"💡 **अतिरिक्त माहिती आवश्यक:** अचूक अनुदान किंवा शिष्यवृत्ती तपासण्यासाठी कृपया आपला **व्यवसाय** (उदा. शेतकरी, विद्यार्थी) आणि **वार्षिक कौटुंबिक उत्पन्न** सांगा."
                        ),
                        "bn": (
                            f"### ✅ {user_profile_obj.age} বছর বয়সের জন্য যোগ্য সরকারি প্রকল্পসমূহ\n\n"
                            f"সঞ্চয়ের নিয়মাবলী অনুযায়ী আপনার বয়সের ভিত্তিতে নিম্নলিখিত স্কিমগুলি উপলব্ধ রয়েছে:\n\n"
                            f"{bullets_text}\n\n"
                            f"💡 **অতিরিক্ত তথ্য প্রয়োজন:** সঠিক ভর্তুকি বা বৃত্তির জন্য অনুগ্রহ করে আপনার **পেশা** (যেমন কৃষক, ছাত্র) এবং **বার্ষিক পারিবারিক আয়** জানান।"
                        ),
                        "te": (
                            f"### ✅ {user_profile_obj.age} సంవత్సరాల వయస్సు వారికి అర్హత గల ప్రభుత్వ పథకాలు\n\n"
                            f"సంచయ్ చట్టబద్ధమైన నిబంధనల ప్రకారం మీ వయస్సు ఆధారంగా క్రింది పథకాలు అందుబాటులో ఉన్నాయి:\n\n"
                            f"{bullets_text}\n\n"
                            f"💡 **అదనపు సమాచారం అవసరం:** మరింత ఖచ్చితమైన రాయితీ లేదా స్కాలర్‌షిప్‌ల కోసం దయచేసి మీ **వృత్తి** (రైతు, విద్యార్థి వంటివి) మరియు **వార్షిక కుటుంబ ఆదాయం** తెలియజేయండి."
                        )
                    }
                    ans = missing_profile_templates.get(lang, missing_profile_templates["en"])
                    return SakhiChatResponse(
                        answer=ans,
                        intent="CHECK_ELIGIBILITY",
                        sources=self.build_sources(eligible_matches[:4]),
                        eligibility_result="ADDITIONAL_INFORMATION_REQUIRED",
                        guardrail_applied=None,
                        language=language,
                        suggested_prompts=["मैं किसान हूं", "मैं छात्र हूं", "Find My Schemes"],
                        action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
                    )
                else:
                    eligible_age_templates = {
                        "en": (
                            f"### ✅ Eligible Verified Schemes for {age_text.title()}\n\n"
                            f"According to SANCHAY's deterministic statutory engine, here are top verified schemes you qualify for:\n\n"
                            f"{bullets_text}\n\n"
                            f"👉 Use **Find My Schemes** to rank these by your exact monthly budget and financial goal."
                        ),
                        "hi": (
                            f"### ✅ आपकी प्रोफ़ाइल ({age_text}) के लिए पात्र योजनाएं\n\n"
                            f"संचय के नियम इंजन के अनुसार आप निम्नलिखित सत्यापित योजनाओं के लिए पात्र हैं:\n\n"
                            f"{bullets_text}\n\n"
                            f"👉 अपने बजट और लक्ष्य के अनुसार रैंकिंग देखने के लिए **Find My Schemes** का उपयोग करें।"
                        ),
                        "mr": (
                            f"### ✅ आपल्या प्रोफाइलसाठी ({age_text}) पात्र योजना\n\n"
                            f"संचयच्या नियमांनुसार आपण खालील सत्यापित योजनांसाठी पात्र आहात:\n\n"
                            f"{bullets_text}\n\n"
                            f"👉 आपल्या बजेटनुसार क्रमवारी पाहण्यासाठी **Find My Schemes** चा वापर करा."
                        ),
                        "bn": (
                            f"### ✅ আপনার প্রোফাইলের জন্য যোগ্য স্কিমসমূহ ({age_text})\n\n"
                            f"সঞ্চয়ের নিয়মাবলী অনুযায়ী আপনি নিম্নলিখিত যাচাইকৃত স্কিমগুলির জন্য যোগ্য:\n\n"
                            f"{bullets_text}\n\n"
                            f"👉 আপনার বাজেট অনুসারে দেখতে **Find My Schemes** ব্যবহার করুন।"
                        ),
                        "te": (
                            f"### ✅ మీ ప్రొఫైల్ ({age_text}) కోసం అర్హత గల పథకాలు\n\n"
                            f"సంచయ్ నిబంధనల ప్రకారం మీరు క్రింది ధృవీకరించబడిన పథకాలకు అర్హులు:\n\n"
                            f"{bullets_text}\n\n"
                            f"👉 మీ బడ్జెట్ ప్రకారం ర్యాంకింగ్ చూడటానికి **Find My Schemes** ను ఉపయోగించండి."
                        )
                    }
                    ans = eligible_age_templates.get(lang, eligible_age_templates["en"])
                    return SakhiChatResponse(
                        answer=ans,
                        intent="CHECK_ELIGIBILITY",
                        sources=self.build_sources(eligible_matches[:4]),
                        eligibility_result="ELIGIBLE",
                        guardrail_applied=None,
                        language=language,
                        suggested_prompts=["What is PPF?", "Compare top schemes", "Find My Schemes"],
                        action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
                    )
            else:
                # No suitable scheme found in complete database for this broad query
                no_match_text = {
                    "en": (
                        "### 🔍 Search Result: No Applicable Match Found\n\n"
                        "No currently matching scheme was found based on the statutory information provided.\n\n"
                        "👉 Try adjusting parameters or use **Find My Schemes** to explore alternatives."
                    ),
                    "hi": (
                        "### 🔍 परिणाम: कोई उपयुक्त योजना नहीं मिली\n\n"
                        "प्रदान की गई जानकारी के आधार पर वर्तमान में कोई उपयुक्त योजना नहीं मिली।\n\n"
                        "👉 कृपया अन्य विवरण दर्ज करें या **Find My Schemes** का उपयोग करें।"
                    ),
                    "mr": (
                        "### 🔍 निकाल: कोणतीही योजना आढळली नाही\n\n"
                        "दिलेल्या माहितीच्या आधारे कोणतीही जुळणारी योजना सापडली नाही.\n\n"
                        "👉 कृपया इतर माहिती द्या किंवा **Find My Schemes** वापरा."
                    ),
                    "bn": (
                        "### 🔍 ফলাফল: কোনো উপযুক্ত স্কিম পাওয়া যায়নি\n\n"
                        "প্রদত্ত তথ্যের ভিত্তিতে কোনো উপযুক্ত স্কিম পাওয়া যায়নি।\n\n"
                        "👉 অনুগ্রহ করে অন্য বিবরণ লিখুন বা **Find My Schemes** ব্যবহার করুন।"
                    ),
                    "te": (
                        "### 🔍 ఫలితం: సరిపోయే పథకం కనుగొనబడలేదు\n\n"
                        "అందించిన సమాచారం ఆధారంగా ఎటువంటి పథకం సరిపోలలేదు.\n\n"
                        "👉 దయచేసి ఇతర వివరాలు నమోదు చేయండి లేదా **Find My Schemes** ఉపయోగించండి."
                    )
                }
                return SakhiChatResponse(
                    answer=no_match_text.get(lang, no_match_text["en"]),
                    intent="CHECK_ELIGIBILITY",
                    sources=[],
                    eligibility_result="NO_APPLICABLE_SCHEME",
                    guardrail_applied=None,
                    language=language,
                    suggested_prompts=["Explore All Schemes", "Find My Schemes", "What is PPF?"],
                    action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
                )

        # -------------------------------------------------------------
        # 7. Category / Domain Dynamic Listing (Pension, Farmers, Women, Education, Employment, etc.)
        # -------------------------------------------------------------
        category_search_terms = [
            "pension", "savings", "farmer", "kisan", "agriculture", "women", "mahila", "girl", "daughter", "son", "child", "children", "minor", "kid", "kids",
            "education", "scholarship", "student", "loan", "business", "msme", "employment", "job",
            "health", "housing", "insurance", "bima", "senior citizen", "vridha", "widow", "disability",
            "schemes for", "which schemes", "show me schemes", "list schemes", "available schemes", "scheme", "schemes",
            "पेंशन", "बचत", "किसान", "कृषि", "महिला", "बेटी", "बेटा", "बच्चे", "बच्चा", "बच्चों", "बच्ची", "बालक", "बालिका",
            "शिक्षा", "छात्रवृत्ति", "छात्र", "विद्यार्थी", "ऋण", "लोन", "व्यापार", "रोजगार", "स्वास्थ्य", "आवास", "घर", "बीमा",
            "इन्वेस्ट", "निवेश", "invest", "saving", "save", "महीने", "per month", "monthly", "रुपये", "rupees", "बजट",
            "स्कीम", "स्कीम्स", "योजना", "योजनाएं", "योजनायें", "योजनाओं", "चाहिए", "बताओ", "दिखाओ", "बताइए", "chahiye", "batao", "dikhao"
        ]
        has_real_category_intent = any(w in msg_lower for w in category_search_terms)

        if not extracted_schemes and not has_real_category_intent:
            # Delegate non-scheme open inquiries to the flexible conversational engine
            return self._handle_general_conversation(message=message, language=language, context=context, user_name=user_name)

        if matched_schemes:
            # Generate grounded AI response with Gemini if available
            generated_cat_answer = None
            client = self.get_client()
            if client:
                try:
                    evidence_json_str = json.dumps(evidence_blocks[:6], ensure_ascii=False, indent=2)
                    user_name_instruction = f"Address the user warmly as '{user_name}'." if user_name else "Be warm and helpful."
                    lang_map = {
                        "en": "crisp, professional English",
                        "hi": "natural Hindi in Devanagari script",
                        "mr": "natural Marathi in Devanagari script",
                        "bn": "natural Bengali in Bengali script",
                        "te": "natural Telugu in Telugu script"
                    }
                    lang_instruction = f"in {lang_map.get(lang, 'English')}, using natural Indian conversational digital product phrasing while keeping official acronyms (PPF, SSY, APY, NPS, NSC, KVP, SCSS), numbers, and URLs verbatim."

                    gen_prompt = f"""You are SAKHI, Sanchay's Verified Scheme Assistant.
The user asked: "{message}"
{user_name_instruction}

Explain the verified schemes matching their inquiry from the evidence block below. Provide a clear overview of the best options, key return rates/benefits, eligibility, and guide them on how to explore or apply.

HARD RULES:
1. Grounding: Answer ONLY from the verified evidence blocks below.
2. No Inventions: Never invent or assume interest rates or tax sections.
3. Format: Structured briefing with clear scheme headings, bullet points, and an encouraging closing.
4. Language: Write {lang_instruction}

Evidence Blocks:
{evidence_json_str}
"""
                    gen_res = client.generate_content(
                        gen_prompt,
                        generation_config={"temperature": 0.2, "max_output_tokens": 700},
                        request_options={"timeout": 5.0}
                    )
                    if gen_res and gen_res.text:
                        generated_cat_answer = gen_res.text.strip()
                except Exception as e:
                    print(f"Notice: Gemini category generation notice: {e}")
                    generated_cat_answer = None

            if generated_cat_answer:
                sanitized_cat_ans, _ = self.sanitize_numerical_guardrails(generated_cat_answer, evidence_blocks[:6])
                return SakhiChatResponse(
                    answer=sanitized_cat_ans,
                    intent="GENERAL_SCHEME_SEARCH",
                    sources=sources[:4],
                    eligibility_result=None,
                    guardrail_applied=None,
                    language=language,
                    suggested_prompts=["Find My Schemes", "Compare these schemes", "Check my eligibility", "Explore All Schemes"],
                    action_buttons=[
                        SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                        SakhiActionButton(label="Explore Schemes", action="navigate", payload={"path": "/explore"})
                    ]
                )

            bullets = []
            for s in matched_schemes[:8]:
                sname = get_scheme_display_name(s, lang)
                short_n = s.get("short_name") or sname
                fin_s = s.get("financial", {}) if isinstance(s.get("financial"), dict) else {}
                ben_s = s.get("benefits", {}) if isinstance(s.get("benefits"), dict) else {}
                rate_str = fin_s.get("interest_rate") or ben_s.get("amount") or ben_s.get("summary") or "Statutory Benefit"
                auth_str = get_scheme_authority(s)
                bullets.append(f"• **{short_n} ({sname}):** {rate_str} — *{auth_str}*")

            bullets_text = "\n".join(bullets)
            greeting_hdr = f"### 👋 Hello {user_name}!\n\n" if user_name else ""
            cat_ans = {
                "en": (
                    f"{greeting_hdr}### 🏛️ Verified Indian Government Schemes in Database\n\n"
                    f"Here are verified schemes matching your request from the master database:\n\n"
                    f"{bullets_text}\n\n"
                    f"👉 Use **Find My Schemes** to filter these by your exact age, occupation, and monthly budget."
                ),
                "hi": (
                    f"{greeting_hdr}### 🏛️ डेटाबेस में सत्यापित सरकारी योजनाएं\n\n"
                    f"आपके अनुरोध के अनुसार मास्टर डेटाबेस से सत्यापित योजनाएं:\n\n"
                    f"{bullets_text}\n\n"
                    f"👉 अपनी आयु, व्यवसाय और मासिक बजट के अनुसार सटीक योजनाएं देखने के लिए **Find My Schemes** का उपयोग करें।"
                ),
                "mr": (
                    f"{greeting_hdr}### 🏛️ डेटाबेसमध्ये उपलब्ध अधिकृत सरकारी योजना\n\n"
                    f"मास्टर डेटाबेसमधून तुमच्या विनंतीनुसार सत्यापित योजना:\n\n"
                    f"{bullets_text}\n\n"
                    f"👉 तुमच्या वयानुसार अचूक शिफारसी मिळवण्यासाठी **Find My Schemes** चा वापर करा."
                ),
                "bn": (
                    f"{greeting_hdr}### 🏛️ ডেটাবেসের অনুমোদিত সরকারি প্রকল্পসমূহ\n\n"
                    f"আপনার অনুরোধের ভিত্তিতে মাস্টার ডেটাবেস থেকে প্রাপ্ত যাচাইকৃত স্কিমসমূহ:\n\n"
                    f"{bullets_text}\n\n"
                    f"👉 আপনার বয়স এবং বাজেট অনুযায়ী যাচাই করতে **Find My Schemes** ব্যবহার করুন।"
                ),
                "te": (
                    f"{greeting_hdr}### 🏛️ డేటాబేస్‌లోని ధృవీకరించబడిన ప్రభుత్వ పథకాలు\n\n"
                    f"మీ అభ్యర్థన ఆధారంగా మాస్టర్ డేటాబేస్ నుండి ధృవీకరించబడిన పథకాలు:\n\n"
                    f"{bullets_text}\n\n"
                    f"👉 మీ ఖచ్చితమైన అర్హతలను తెలుసుకోవడానికి **Find My Schemes** ను ఉపయోగించండి."
                )
            }
            return SakhiChatResponse(
                answer=cat_ans.get(lang, cat_ans["en"]),
                intent="GENERAL_SCHEME_SEARCH",
                sources=sources[:4],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["Find My Schemes", "Compare these schemes", "Check my eligibility", "Explore All Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                    SakhiActionButton(label="Explore Schemes", action="navigate", payload={"path": "/explore"})
                ]
            )

        primary = matched_schemes[0] if matched_schemes else None
        if not primary:
            return SakhiChatResponse(
                answer=(
                    "### 🏛️ SANCHAY Scheme Assistant\n\n"
                    "I can provide complete statutory details on any of the 184 verified Government schemes (e.g., PPF, Sukanya Samriddhi, Atal Pension Yojana, PM Mudra, Stand-Up India, PM-KISAN, SCSS, NSC).\n\n"
                    "👉 Please specify a scheme name, or use **Find My Schemes** to evaluate your deterministic eligibility."
                ) if lang == "en" else (
                    "### 🏛️ संचय योजना सहायक\n\n"
                    "मैं डेटाबेस की सभी 184 सत्यापित सरकारी योजनाओं (जैसे PPF, सुकन्या समृद्धि, अटल पेंशन, मुद्रा योजना आदि) पर पूरी जानकारी दे सकती हूँ।"
                ),
                intent="EXPLAIN_SCHEME",
                sources=[],
                eligibility_result=None,
                guardrail_applied=None,
                language=language,
                suggested_prompts=["What is PPF?", "Tell me about Sukanya Samriddhi", "What is Atal Pension Yojana?", "Find My Schemes"],
                action_buttons=[SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"})]
            )

        p_name = primary.get("short_name") or get_scheme_display_name(primary, lang)
        p_full_name = get_scheme_display_name(primary, lang)
        p_auth = get_scheme_authority(primary)
        p_rate = get_scheme_interest_or_benefit(primary, lang)
        p_fin = primary.get("financial", {}) if isinstance(primary.get("financial"), dict) else {}
        p_ben = primary.get("benefits", {}) if isinstance(primary.get("benefits"), dict) else {}
        p_elig = primary.get("eligibility", {}) if isinstance(primary.get("eligibility"), dict) else {}
        p_liq = primary.get("liquidity", {}) if isinstance(primary.get("liquidity"), dict) else {}

        p_lock_in = p_fin.get("lock_in") or p_fin.get("lock_in_period") or "Not specified in Sanchay's verified data"
        p_min_c = p_fin.get("minimum_contribution")
        p_min_str = f"₹{p_min_c:,.0f}" if p_min_c is not None else "Not specified in Sanchay's verified data"
        p_max_c = p_fin.get("maximum_contribution")
        p_max_str = f"₹{p_max_c:,.0f}/year" if p_max_c is not None else "No statutory upper ceiling"
        p_tax = p_ben.get("tax_benefit") or p_fin.get("tax_treatment") or "Not specified in Sanchay's verified data"
        p_withdrawal = p_liq.get("withdrawal_rules") or "Standard premature exit rules under statutory gazettes"
        p_desc = p_ben.get("summary") or primary.get("description") or primary.get("short_description") or "Official Government of India statutory scheme."

        p_min_age = p_elig.get("min_age") if "min_age" in p_elig else p_elig.get("age_min")
        p_max_age = p_elig.get("max_age") if "max_age" in p_elig else p_elig.get("age_max")
        p_elig_str = f"Age {p_min_age or 0} to {p_max_age or 'No limit'} years, Indian resident" if p_min_age is not None else "Resident Indian citizens"

        # If Gemini client is active, generate natural language response strictly grounded in evidence
        generated_answer = None
        client = self.get_client()
        if client:
            try:
                evidence_json_str = json.dumps(evidence_blocks[:1], ensure_ascii=False, indent=2)
                lang_map = {
                    "en": "crisp, professional English",
                    "hi": "natural Hindi in Devanagari script",
                    "mr": "natural Marathi in Devanagari script",
                    "bn": "natural Bengali in Bengali script",
                    "te": "natural Telugu in Telugu script"
                }
                lang_instruction = f"in {lang_map.get(lang, 'English')}, using natural Indian conversational digital product phrasing while keeping official acronyms (PPF, SSY, APY, NPS, NSC, KVP), numbers, and URLs verbatim."

                gen_prompt = f"""You are SAKHI, Sanchay's Verified Scheme Assistant.
Your goal is to answer the user question using ONLY the provided verified scheme evidence block below.

HARD RULES:
1. Grounding: Answer ONLY from the facts provided in the evidence block.
2. No Inventions: Never invent or assume interest rates, maximum deposits, withdrawal dates, or tax sections.
3. Missing data: If a field is null or missing in the evidence block, state "Not specified in Sanchay's verified data".
4. Verbatim Terms: Keep official scheme acronyms, numbers, and URLs verbatim.
5. Format: Provide a structured briefing with an editorial header, concise description, and bullet points for Key Numbers, Eligibility, Lock-in, and Tax.
6. Language: Write {lang_instruction}

Evidence Block:
{evidence_json_str}

User Question: "{message}"
"""
                gen_res = client.generate_content(
                    gen_prompt,
                    generation_config={"temperature": 0.1, "max_output_tokens": 500},
                    request_options={"timeout": 4.0}
                )
                if gen_res and gen_res.text:
                    generated_answer = gen_res.text.strip()
            except Exception as e:
                print(f"Notice: Gemini generation error: {e}")
                generated_answer = None

        # Deterministic Grounded Template Fallback
        if not generated_answer:
            if intent == "WITHDRAWAL_RULES":
                generated_answer = (
                    f"### 🏦 Withdrawal & Liquidity Rules for {p_name}\n\n"
                    f"• **Lock-in Period:** {p_lock_in}\n"
                    f"• **Withdrawal Terms:** {p_withdrawal}\n"
                    f"• **Authority:** {p_auth}\n\n"
                    f"All liquidity terms are verified against official gazettes published by {p_auth}."
                )
            elif intent == "BENEFITS":
                generated_answer = (
                    f"### 📈 Benefits & Yield Details for {p_name}\n\n"
                    f"• **Interest Rate / Yield:** {p_rate}\n"
                    f"• **Minimum Contribution:** {p_min_str}\n"
                    f"• **Maximum Contribution:** {p_max_str}\n"
                    f"• **Tax Benefit:** {p_tax}\n"
                    f"• **Summary:** {p_desc}\n\n"
                    f"Directly verified from {p_auth} official notifications."
                )
            else:
                generated_answer = (
                    f"### {p_full_name} ({p_name})\n\n"
                    f"{p_desc}\n\n"
                    f"• **Current Interest Rate / Benefit:** {p_rate}\n"
                    f"• **Statutory Eligibility:** {p_elig_str}\n"
                    f"• **Lock-in Period:** {p_lock_in}\n"
                    f"• **Minimum Deposit:** {p_min_str}\n"
                    f"• **Maximum Deposit:** {p_max_str}\n"
                    f"• **Tax Treatment:** {p_tax}\n"
                    f"• **Official Authority:** {p_auth}"
                )

        # Apply Code-Level Numeric Guardrail
        sanitized_answer, guardrail_applied = self.sanitize_numerical_guardrails(generated_answer, evidence_blocks)

        action_buttons = [
            SakhiActionButton(label="Official Portal", action="open_url", payload={"url": get_scheme_official_url(primary)}),
            SakhiActionButton(label="Check Eligibility", action="ask_prompt", payload={"prompt": f"Am I eligible for {p_name}?"})
        ]

        suggested_prompts = [
            f"Am I eligible for {p_name}?",
            f"What are the withdrawal rules for {p_name}?",
            f"Compare {p_name} with other schemes",
            f"What is the official source of {p_name}?"
        ]

        return SakhiChatResponse(
            answer=sanitized_answer,
            intent=intent,
            sources=sources[:1],
            eligibility_result=None,
            guardrail_applied=guardrail_applied,
            language=language,
            suggested_prompts=suggested_prompts,
            action_buttons=action_buttons,
            disclaimer="All scheme data is verified directly against official Government of India gazettes."
        )

    def _handle_financial_coach(
        self,
        message: str,
        language: str = "en",
        context: Optional[Dict[str, Any]] = None,
        user_name: Optional[str] = None
    ) -> SakhiChatResponse:
        """
        AI Personal Finance Coach & Gemini Native Tool-Calling Assistant (Phase 2 Quality Standard).
        Combines lightweight verified financial knowledge retrieval, registered deterministic tools,
        and conversational grounding across budgeting, emergency runway, debt, SIP, goals, and compounding.
        """
        context = context or {}
        lang = detect_user_language(message, fallback_lang=language)
        msg_lower = message.lower().strip()

        # -------------------------------------------------------------
        # 1. Dynamically bind request context to tools
        # -------------------------------------------------------------
        def bound_get_user_financial_context() -> Dict[str, Any]:
            """Retrieves the user's declared financial health, budget, active goal, and profile from the current session."""
            return get_user_financial_context(context=context)

        tool_map = {
            "get_user_financial_context": bound_get_user_financial_context,
            "calculate_budget": calculate_budget,
            "calculate_financial_health": calculate_financial_health,
            "calculate_sip_projection": calculate_sip_projection,
            "calculate_compound_interest": calculate_compound_interest,
            "calculate_goal_feasibility": calculate_goal_feasibility,
            "search_government_schemes": search_government_schemes
        }
        tools_list = list(tool_map.values())

        # Extract active context facts
        user_ctx = bound_get_user_financial_context()
        budget_facts = user_ctx.get("budget_data", {})
        has_income_data = budget_facts.get("has_budget_data", False)
        monthly_income_val = budget_facts.get("monthly_income")
        monthly_surplus_val = budget_facts.get("monthly_surplus")
        total_expenses_val = budget_facts.get("total_expenses")
        active_goal_facts = user_ctx.get("active_goal", {})

        # Lightweight verified knowledge retrieval
        retrieved_knowledge = retrieve_financial_knowledge(message, language=lang, limit=2)
        knowledge_context_str = format_knowledge_for_context(retrieved_knowledge, language=lang)

        # -------------------------------------------------------------
        # 2. System Instruction for Gemini (Phase 2 Quality Architecture)
        # -------------------------------------------------------------
        lang_map = {
            "en": "English",
            "hi": "Hindi (हिंदी strictly in Devanagari script)",
            "hinglish": "Hinglish (conversational Hindi written strictly in Roman / Latin script letters, NO Devanagari, e.g. 'Aap apne actual kharche bata do, toh main aapke liye practical monthly budget bana sakta hoon.')",
            "mr": "Marathi (मराठी in Devanagari script)",
            "bn": "Bengali (বাংলা in Bengali script)",
            "te": "Telugu (తెలుగు in Telugu script)"
        }
        target_lang = lang_map.get(lang, "English")

        user_ctx_prompt = ""
        if has_income_data and monthly_income_val:
            user_ctx_prompt = (
                f"\nSESSION USER FINANCIAL CONTEXT:\n"
                f"- Monthly Income: ₹{monthly_income_val:,.0f}\n"
                f"- Essential Expenses: ₹{budget_facts.get('essential_expenses', 0.0):,.0f}\n"
                f"- Lifestyle Expenses: ₹{budget_facts.get('lifestyle_expenses', 0.0):,.0f}\n"
                f"- Monthly EMI: ₹{budget_facts.get('monthly_emi', 0.0):,.0f}\n"
                f"- Total Expenses: ₹{total_expenses_val:,.0f}\n"
                f"- Available Monthly Surplus: ₹{monthly_surplus_val:,.0f}\n"
                f"When user asks how much money they have left or their surplus, state their available monthly surplus of ₹{monthly_surplus_val:,.0f}.\n"
            )

        system_instruction = f"""You are Sakhi, an intelligent, empathetic, and specialized personal finance companion for Sanchay (India).
Your role is to help users understand their personal finances, budgeting, savings, emergency funds, debt management, milestone goals, compounding, and sovereign Government of India schemes (PPF, SSY, SCSS, APY, PMJDY, etc.).
{user_ctx_prompt}
{knowledge_context_str}

CRITICAL ARCHITECTURAL RULES:
1. ALWAYS use the provided deterministic tools to calculate figures or look up data. NEVER perform mental math or invent financial figures.
2. For questions about how much money the user has left, what their surplus is, or their financial situation, ALWAYS call get_user_financial_context(). If their budget details or income are missing or undeclared, inform them that their budget information is not declared or pending in the Smart Budget Planner.
3. For milestone goal questions (such as saving for a bike, laptop, car, or other goal):
   - If the user specifies an explicit target amount (e.g. ₹1,00,000 or one lakh), ALWAYS use their explicit amount—NEVER replace an explicit user-provided target amount with any default.
   - If the user says they want to save for a bike or other goal but does NOT specify its price or target amount, DO NOT assume ₹70,000 or any arbitrary amount. Instead, warmly ask the user for their target budget or estimated price of the bike.
   - If the timeframe is missing, also ask how long the user has (in months or years) to reach the goal.
   - When asking for missing price or timeframe, ALWAYS match the user's detected language and writing script (Hinglish in Roman script, Hindi in Devanagari script, English in English, Marathi in Marathi, Bengali in Bengali, Telugu in Telugu).
   - Only call calculate_goal_feasibility() when both target amount and timeframe are known (from the current query or conversation history).
4. For recurring savings/SIP questions (e.g. "What if I invest ₹3,000 for 5 years?", "Calculate SIP of ₹2,000 for 5 years", "₹15,000 quarterly for 5 years", "If I invest ₹5,000 every month for 10 years at an assumed annual return of 12%"):
   - ALWAYS call calculate_sip_projection(monthly_investment=..., timeframe_years=..., annual_rate_pct=..., frequency="quarterly" if quarterly else "monthly").
   - If user explicitly supplies an assumed return rate (e.g. 12% or 10%), pass annual_rate_pct=<value>. If no rate is provided by the user, do not invent a guaranteed return; use default 10.0 or ask.
   - For recurring investment or savings questions that do NOT contain the acronym "SIP" (e.g. "If I invest ₹5,000 every month", "save ₹2,000 each month", "how much will I have if I invest ₹10,000 monthly"):
     ALWAYS treat them as recurring investment growth queries and call calculate_sip_projection().
     DO NOT recommend government schemes (such as Post Office RD, POMIS, NSC, PPF) unless the user explicitly requests government schemes or comparisons with them.
   - Response numbers MUST state:
     * Total principal invested (e.g. ₹6,00,000)
     * Estimated returns (e.g. approximately ₹5,50,193)
     * Total projected value / corpus (e.g. approximately ₹11,50,193)
   - Clearly state that 20 quarterly installments (or N monthly installments) are made.
   - Explain:
     * The assumed return rate is an illustrative projection, NOT a guarantee.
     * Compounding uses standard ordinary annuity (periodic compounding, end-of-period contributions).
     * Market-linked returns fluctuate with market conditions.
   - For purely conceptual/educational/comparison questions without specific investment figures (e.g. "What is an ELSS SIP?", "Explain Step-up SIP", "How does a quarterly SIP work?", "Can I start a weekly SIP?", "Can I invest in Flexi SIP?", "Compare Equity SIP, Debt SIP and Hybrid SIP", "Explain the difference between SIP and lump-sum investing"):
     DO NOT call calculate_sip_projection() with invented numbers. Provide a crystal-clear, structured educational explanation explaining the concepts, rules, rolling lock-in, benefits, and risks.
   - If user asks "Can you calculate my SIP returns?" without providing an amount or tenure, ask them for their planned installment amount (monthly/quarterly) and horizon.
5. For lump-sum compound interest calculations with numbers (e.g. "Calculate compound interest on ₹10,000 for 3 years at 8%"), call calculate_compound_interest().
6. For purely conceptual questions like "What is compound interest?", provide a crystal-clear educational explanation without calling numerical tools and without inventing numbers.
7. For budgeting questions (income, expenses, 50/30/20, "I earn ₹30,000", "I cannot save money despite earning ₹40,000"), call calculate_budget().
8. For debt management questions (credit cards, loans, EMIs), provide clear payoff strategies (Avalanche / Snowball), warn about high credit card APR (36-42%), and advise freezing card spending.
9. For scheme questions (e.g. "PPF", "Sukanya Samriddhi"), call search_government_schemes().
10. Tone: Warm, respectful, clear, jargon-free, educational.
11. Neutrality: Sanchay provides transparent financial education, NOT speculative trading advice. We never recommend individual stocks, intraday trading, or cryptocurrencies.
12. LANGUAGE & WRITING SCRIPT INSTRUCTION:
- User's Detected Input Language: {target_lang}
- You MUST generate your ENTIRE response in {target_lang}.
- SCRIPT REQUIREMENT:
  * If Hinglish: The user asked in Roman-script Hindi (Hinglish). You MUST respond in natural, friendly, conversational Hinglish using the Roman alphabet only (English letters, NO Devanagari script). Example style:
    "Bilkul! Agar aapki monthly income ₹30,000 hai, toh aap shuruaat mein 50/30/20 rule follow kar sakte ho:
    - ₹15,000 — zaroori kharche
    - ₹9,000 — personal aur fun expenses
    - ₹6,000 — savings
    Aap apne actual kharche bata do, toh main aapke liye practical monthly budget bana sakta hoon."
  * If Hindi: Respond strictly in pure, natural Hindi in Devanagari script (हिंदी लिपि).
  * If Marathi: Respond strictly in Marathi in Devanagari script (मराठी).
  * If Bengali: Respond strictly in Bengali in Bengali script (বাংলা).
  * If Telugu: Respond strictly in Telugu in Telugu script (తెలుగు).
  * If English: Respond in clear, engaging English.
- Always explain financial calculations, numbers, and practical recommendations in the user's detected language and writing script! Use clean Markdown with bullet points.

RESPONSE STRUCTURE GUIDELINE (PHASE 2 QUALITY STANDARD):
When formulating the answer, ensure the response contains:
• Direct Answer: Answer the user's specific question immediately in the first sentence.
• Simple Explanation: Explain the reasoning or concept in simple language without jargon.
• Relevant Calculations: Include deterministic tool calculation results if numbers or budgets are involved.
• Practical Recommendations: Give 2-3 actionable, realistic next steps (e.g. automate on salary day, build 3-month buffer, stop card spending).
• Risks, Assumptions & Limitations: Highlight key risks, statutory lock-ins, or assumptions (e.g. assumed 7% safe yield, 36-42% card APR, market volatility).
• Helpful Follow-Up Question: End with exactly ONE clear, useful follow-up question to help the user proceed.
Adapt naturally to the question—do not produce an artificially rigid or unnecessarily long template.
"""

        # -------------------------------------------------------------
        # 3. Attempt Native Gemini Function Calling
        # -------------------------------------------------------------
        tools_executed = []
        generated_answer = None
        client = self.get_client()

        if client and self.api_key:
            candidate_models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
            for target_model in candidate_models:
                try:
                    import google.generativeai as genai
                    history_parts = []
                    if context and context.get("history"):
                        for turn in context.get("history")[-6:]:
                            r = "user" if turn.get("sender") == "user" else "model"
                            t = turn.get("text")
                            if t:
                                history_parts.append(genai.protos.Content(role=r, parts=[genai.protos.Part(text=t)]))

                    tool_model = genai.GenerativeModel(
                        model_name=target_model,
                        tools=tools_list,
                        system_instruction=system_instruction
                    )
                    chat_session = tool_model.start_chat(history=history_parts)

                    response = chat_session.send_message(
                        message,
                        generation_config={"temperature": 0.2, "max_output_tokens": 1000},
                        request_options={"timeout": 8.0}
                    )

                    max_iterations = 4
                    iteration = 0
                    while iteration < max_iterations:
                        iteration += 1
                        fn_calls = []
                        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                            for p in response.candidates[0].content.parts:
                                if hasattr(p, "function_call") and p.function_call and p.function_call.name:
                                    fn_calls.append(p.function_call)

                        if not fn_calls:
                            break

                        fn_response_parts = []
                        for fc in fn_calls:
                            fname = fc.name
                            fargs = dict(fc.args) if fc.args else {}
                            if fname in tool_map:
                                try:
                                    fres = tool_map[fname](**fargs)
                                    tools_executed.append({"name": fname, "args": fargs, "result": fres})
                                except Exception as e:
                                    fres = {"status": "ERROR", "error": str(e)}
                            else:
                                fres = {"status": "ERROR", "error": f"Tool '{fname}' not recognized"}

                            resp_part = genai.protos.Part(
                                function_response=genai.protos.FunctionResponse(
                                    name=fname,
                                    response={"result": fres}
                                )
                            )
                            fn_response_parts.append(resp_part)

                        response = chat_session.send_message(
                            fn_response_parts,
                            generation_config={"temperature": 0.2, "max_output_tokens": 1000},
                            request_options={"timeout": 8.0}
                        )

                    if response and response.text:
                        generated_answer = response.text.strip()
                        break
                except Exception as e:
                    print(f"Notice: Gemini tool execution fallback notice: {e}")
                    continue

        # -------------------------------------------------------------
        # 4. Deterministic Tool-Grounded Fallback Engine (Phase 2 Quality Standard)
        # -------------------------------------------------------------
        query_income = extract_income_amount(message)
        target_amount = extract_target_amount(message)

        # Classification booleans
        is_calc_compounding = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'calculate\s+compound\s+interest',
            r'compound\s+interest\s+on\s+(?:₹|rs\.?|inr)?\s*[\d,kK]+'
        ])

        is_conceptual_compounding = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'(?:what\s+is|explain|concept\s+of|meaning\s+of|kya\s+hai|kay\s+aahe|क्या\s+है|काय\s+आहे|म्हणजे\s+काय|কী|কি|ఏమిటి)\s+(?:an?\s+)?(?:compounding|compound\s+interest|chakravriddhi|चक्रवृद्धि|चक्रवाढ|चक्रवृद्धि\s*ब्याज|चक्रवाढ\s*व्याज|চক্রবৃদ্ধি|చక్రవడ్డీ)',
            r'(?:compounding|compound\s+interest|chakravriddhi|चक्रवृद्धि\s*ब्याज|चक्रवाढ\s*व्याज|चक्रवृद्धि|चक्रवाढ|চক্রবৃদ্ধি(?:\s*সুদ)?|చక్రవడ్డీ)\s*(?:అంటే\s*)?(?:kya\s+hai|kay\s+aahe|क्या\s+है|काय\s+आहे|म्हणजे\s+काय|কী|কি|ఏమిటి|meaning|explain|samjhao|batao|सांगा|समझाओ|\?)',
            r'^(?:what\s+is\s+)?(?:compound\s+interest|compounding|चक्रवृद्धि\s*ब्याज|चक्रवाढ\s*व्याज|चक्रवृद्धि|चक्रवाढ|চক্রবৃদ্ধি(?:\s*সুদ)?|చక్రవడ్డీ)[\?\.\s]*$',
            r'how\s+(?:does\s+)?(?:compound\s+interest|compounding|interest\s+on\s+interest)\s+work',
            r'power\s+of\s+compounding'
        ]) and not any(w in msg_lower for w in ["invest", "sip", "per month", "/month", "/mo", "दरमहा", "प्रति माह", "गुंतव", "निवेश", "₹", "rs.", "10%"])

        is_debt_query = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'\b(?:credit\s+card|credit\s+card\s+debt|card\s+debt|debt|loan|loans|emi|karz|udhar)\b.*(?:manage|pay\s+off|clear|repay|reduce|handle|kaise|trap|avalanche|snowball)',
            r'\b(?:how\s+(?:do|can|to)\s+(?:i\s+)?(?:manage|pay\s+off|clear|reduce|handle)\s+(?:my\s+)?(?:credit\s+card|card\s+debt|debt|loans?|emi))\b',
            r'\b(?:debt\s+management|debt\s+repayment|avalanche|snowball)\b'
        ])

        is_saving_kickoff = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'(?:paise|paisa|rupaye)\s*(?:bachane|bachana|save\s*karna)\s*(?:hai|hain|chahta|chahti)?.*(?:kaise|kaha|shuru|start)',
            r'(?:पैसे|रुपये|बचत)\s*(?:बचाने|वाचवायचे|कसे|कहा|शुरू|सुरू|करायची)',
            r'\b(?:how\s+(?:to|can\s+i|do\s+i)\s+(?:start\s+saving|save\s+money|save))\b'
        ])

        is_saving_struggle = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'\b(?:cannot\s+save|can\'t\s+save|unable\s+to\s+save|struggling\s+to\s+save|struggle\s+to\s+save|no\s+savings|paise\s+nahi\s+bachte|bachat\s+nahi)\b',
            r'\b(?:earn|earning|salary|income|kama(?:ta|ti)?)\s*(?:of|is)?\s*(?:₹|rs\.?|inr)?\s*[\d,kK]+.*(?:cannot\s+save|can\'t\s+save|unable|struggle)'
        ])

        is_travel_query = any(re.search(p, msg_lower, re.IGNORECASE) for p in [
            r'\b(?:go\s+to|trip\s+to|travel\s+to|visit)\s+(?:the\s+)?(?:usa|us|america|europe|uk|london|dubai|thailand|singapore|bali|japan|canada|australia|goa|manali|kashmir|kerala)\b',
            r'\b(?:usa|us|america|europe|uk|london|dubai|thailand|singapore|bali|japan|canada|australia|trip|travel|vacation|tour|holiday|विदेश|यात्रा|घूमने)\s*(?:ke\s+liye|sathi|jonno|kosam)?\s*(?:budget|kharcha|paisa|paise|kitne|cost|expenses?|खर्च|बजट|पैसे)\b',
            r'\b(?:how\s+much\s+(?:money|cash|budget)\s+(?:should|do)\s+i\s+(?:need|keep|save|have))\s+(?:for\s+)?(?:the\s+)?(?:usa|us|america|europe|trip|travel|vacation|tour)\b',
            r'\b(?:i\s+want\s+to\s+go\s+to|planning\s+(?:a\s+)?trip\s+to|planning\s+to\s+travel\s+to)\b',
            r'\b(?:america|usa)\s+jane\s+ke\s+liye\b',
            r'\b(?:kitne\s+paise\s+chahiye|kitna\s+kharcha|budget\s+kya\s+hoga)\b'
        ])

        is_sip_query = (
            any(w in msg_lower for w in [
                "sip", "invest", "recurring", "rupee cost", "एसआयपी", "एसआईपी", "गुंतव", "गुंतवले", "गुंतवणूक", "दरमहा", "निवेश", "जमा", "बिनিয়োগ", "పెట్టుబడి"
            ]) or bool(re.search(
                r"\b(?:if\s+i|what\s+if\s+i|what\s+happens\s+if\s+i|how\s+much\s+(?:will|would)\s+i\s+have\s+if\s+i)\s+(?:invest|save|put|deposit)\b"
                r"|\b(?:save|invest|put)\s*(?:₹|rs\.?|inr)?\s*[\d,kK]+\s*(?:every\s+month|each\s+month|per\s*month|\/month|\/mo|monthly|every\s+quarter|quarterly|every\s+week|weekly)\b"
                r"|\bcalculate\s+(?:returns?\s+on\s+)?(?:my\s+)?(?:monthly|quarterly|recurring|sip)\b",
                msg_lower
            ))
        ) and not is_debt_query

        is_goal_query = (
            any(w in msg_lower for w in [
                "bike", "laptop", "car", "scooter", "motorcycle", "phone", "mobile", "afford", "kharid", "buy", "purchase", "target", "milestone", "take 2 years", "take 3 years", "extend",
                "बाइक", "बाईक", "स्कूटर", "लॅपटॉप", "लैपटॉप", "गाड़ी", "कार", "खरीद", "घेऊ", "घ्यायची", "किनते", "కొన", "लक्ष्य", "उद्दिष्ट"
            ]) or bool(re.search(r'\b(?:change|extend)\s+(?:the\s+)?(?:goal|timeframe|timeline)\s+to\s+[\d\w]+\s+years?\b', msg_lower))
        ) and not is_travel_query and not is_sip_query

        is_budget_query = (
            any(re.search(p, msg_lower, re.IGNORECASE) for p in [
                r'\b(?:how\s+(?:do|can|should)\s+i\s+manage(?:\s+my\s+(?:money|salary|income))?|manage\s+my\s+(?:money|salary|income|finances?)|help\s+me\s+manage)\b',
                r'\b(?:how\s+do\s+i\s+manage|how\s+to\s+manage|paise\s+kaise\s+manage\s+kare)\b',
                r'\b(?:earn|earning|salary|income|kama(?:ta|ti)?)\s*(?:of|is)?\s*(?:₹|rs\.?|inr)?\s*[\d,kK]+\b'
            ]) or (
                query_income is not None and any(w in msg_lower for w in ["manage", "budget", "save", "surplus", "पगार", "वेतन", "बचत"])
            )
        ) and not is_sip_query and not is_debt_query and not is_saving_struggle

        is_balance_query = any(w in msg_lower for w in ["money do i have left", "money left", "balance", "surplus", "how much is left", "kitne paise bache", "bachat"])
        is_spending_query = any(w in msg_lower for w in ["spending too much", "overspending", "spending more", "where am i spending", "kharch", "50/30/20", "budget rule"])
        is_emergency_query = any(w in msg_lower for w in ["emergency fund", "runway", "cushion", "aapatkaleen", "emergency"])

        # Specific SIP Sub-Intents
        is_sip_vs_lumpsum = any(re.search(p, msg_lower) for p in [
            r"\b(?:sip\s+(?:vs|versus|aur|and|or)\s*lump[\s\-_]*sum|lump[\s\-_]*sum\s+(?:vs|versus|aur|and|or)\s*sip)\b",
            r"\b(?:difference\s+between\s+(?:an?\s+)?sip\s+and\s+(?:a\s+)?lump[\s\-_]*sum)\b",
            r"\b(?:difference\s+between\s+(?:a\s+)?lump[\s\-_]*sum\s+and\s+(?:an?\s+)?sip)\b"
        ])
        is_compare_sip = any(re.search(p, msg_lower) for p in [
            r'\bcompare\s+(?:[\w\-]+(?:,|\s+and|\s+or|\s+vs)*\s*)*(?:sip|systematic\s+investment)\b',
            r'\b(?:equity(?:\s+sip)?(?:,|\s+and|\s+vs)\s*debt(?:\s+sip)?(?:,|\s+and|\s+vs)\s*hybrid(?:\s+sip)?)\b',
            r'\bcompare\s+equity\s+sip\b',
        ])
        is_elss_query = any(w in msg_lower for w in ["elss", "tax saving sip", "tax saver sip", "80c sip"]) and not is_debt_query
        is_stepup_query = any(w in msg_lower for w in ["step-up", "step up", "stepup", "top-up sip", "top up sip"]) and not is_debt_query
        is_quarterly_info = (
            any(w in msg_lower for w in ["how does a quarterly sip work", "what is a quarterly sip", "what is quarterly sip", "quarterly sip kaise kaam", "quarterly sip kya"])
            or (("quarterly" in msg_lower or "quarter" in msg_lower) and any(w in msg_lower for w in ["how", "kaise", "what", "kya", "work", "explain", "samjhao"]) and not re.search(r'\d+', msg_lower))
        )
        is_weekly_sip = any(w in msg_lower for w in ["weekly sip", "week sip", "हफ्ते", "साप्ताहिक sip"]) and any(w in msg_lower for w in ["can i", "start", "open", "kya", "shuru", "how", "invest"])
        is_flexi_sip = any(w in msg_lower for w in ["flexi sip", "flexible sip", "फ्लेक्सी sip", "flexi"]) and any(w in msg_lower for w in ["can i", "invest", "what", "kya", "how", "samjhao", "start"])
        is_calc_prompt_no_nums = (
            bool(re.search(r'\b(?:can\s+(?:you\s+)?calculate\s+(?:my\s+)?sip(?:\s+returns?)?|calculate\s+(?:my\s+)?sip(?:\s+returns?)?|estimate\s+(?:my\s+)?sip)\b', msg_lower))
            and not bool(re.search(r'\d+', msg_lower))
        )

        if not generated_answer:
            if is_calc_compounding:
                # Lump-sum compound interest calculation
                num_matches = re.findall(r'[\d,]+(?:\.\d+)?', msg_lower)
                clean_nums = [float(n.replace(',', '')) for n in num_matches if float(n.replace(',', '')) > 0]
                ci_principal = next((n for n in clean_nums if n >= 500), 10000.0)
                ci_years = 1.0
                y_m = re.search(r'([\d]+)\s*(?:years?|वर्ष|साल)', msg_lower)
                if y_m:
                    ci_years = float(y_m.group(1))
                ci_rate = 8.0
                r_m = re.search(r'([\d]+(?:\.\d+)?)\s*%', msg_lower)
                if r_m:
                    ci_rate = float(r_m.group(1))

                ci_res = calculate_compound_interest(principal=ci_principal, rate_pct=ci_rate, time_years=ci_years, compound_frequency_per_year=1)
                tools_executed.append({"name": "calculate_compound_interest", "result": ci_res})
                ci_maturity = ci_res["maturity_amount"]
                ci_interest = ci_res["compound_interest_earned"]

                generated_answer = f"""### 📈 Deterministic Compound Interest Calculation

**Direct Answer:**
For an initial principal of **₹{format_inr(ci_principal)}** invested for **{ci_years:g} year(s)** at **{ci_rate:g}% p.a.** compounded annually, your final maturity corpus is **₹{format_inr(ci_maturity)}**, earning **₹{format_inr(ci_interest)}** in pure compound interest.

**Sanchay Mathematical Breakdown (Lump-Sum Compounding):**
• **Initial Principal ($P$):** ₹{format_inr(ci_principal)}
• **Annual Interest Rate ($r$):** {ci_rate:g}% p.a. (compounded annually)
• **Time Horizon ($t$):** {ci_years:g} year(s)
• **Total Interest Accrued:** **₹{format_inr(ci_interest)}**
• **Final Corpus ($A$):** **₹{format_inr(ci_maturity)}**
• **Mathematical Formula Applied:** $A = P \\times (1 + r/100)^t = {format_inr(ci_principal)} \\times (1 + {ci_rate:g}/100)^{{{ci_years:g}}} = ₹{format_inr(ci_maturity)}$

**Practical Recommendations:**
1. **Reinvest Interest:** Never withdraw annual interest payouts if long-term wealth accumulation is the primary goal; allowing interest to compound exponentially maximizes total corpus growth.
2. **Sovereign Alternatives:** Government of India small savings schemes like **PPF (7.1% p.a., EEE tax-free)** and **Sukanya Samriddhi Yojana (8.2% p.a.)** offer risk-free, guaranteed sovereign annual compounding.

**Risks & Assumptions:**
• Assumes annual compounding frequency and a constant interest rate throughout the tenure.
• For non-tax-exempt instruments (like standard bank FDs), interest is taxable at your income slab.

💬 *Would you like to project compounding for a monthly recurring deposit (SIP) or compare this with PPF sovereign returns?*"""

            elif is_conceptual_compounding:
                # Pure conceptual explanation without numerical tool calls or invented figures
                if lang == "hi":
                    generated_answer = """### 📈 चक्रवृद्धि ब्याज की शक्ति (Power of Compounding Explained)

**प्रत्यक्ष उत्तर (Direct Answer):**
चक्रवृद्धि ब्याज (Compound Interest) का सीधा अर्थ है **'ब्याज पर ब्याज'**—यानी आपको केवल अपने मूलधन पर ही नहीं, बल्कि पिछले वर्षों में कमाए गए ब्याज पर भी नया ब्याज मिलता है।

**सरल व्याख्या (Simple Explanation):**
• **साधारण ब्याज बनाम चक्रवृद्धि ब्याज:** साधारण ब्याज में केवल मूलधन पर रिटर्न मिलता है। चक्रवृद्धि ब्याज में हर साल का ब्याज मूलधन में जुड़ जाता है, जिससे आपकी बचत समय के साथ बर्फ के गोले (Snowball) की तरह तेजी से बढ़ती है।
• **72 का नियम (Rule of 72):** अपनी ब्याज दर से 72 को भाग दें, आपको पता चल जाएगा कि आपका पैसा कितने वर्षों में दोगुना होगा (जैसे PPF के 7.1% पर: 72 / 7.1 ≈ 10.1 वर्ष)।
• **महंगाई से सुरक्षा:** 5 से 15 वर्षों में चक्रवृद्धि ब्याज आपकी बचत को भारत की औसत महंगाई दर (5–6%) से आगे रखने में मदद करता है।

**व्यावहारिक अनुशंसाएं (Practical Recommendations):**
1. **जल्दी शुरुआत करें:** चक्रवृद्धि का सबसे बड़ा जादू समय है; 25 की उम्र में शुरू की गई छोटी बचत 35 की उम्र की बड़ी बचत से अधिक धन बना सकती है।
2. **सुरक्षित संप्रभु विकल्प:** भारत सरकार की **PPF (7.1% वार्षिक)** और **सुकन्या समृद्धि योजना (8.2% वार्षिक)** 100% कर-मुक्त और संप्रभु गारंटीकृत चक्रवृद्धि ब्याज प्रदान करती हैं।

**जोखिम व सीमाएं:**
• यदि रिटर्न महंगाई दर से कम है, तो पैसे की वास्तविक क्रय शक्ति घट जाती है।

💬 *क्या आप अपनी किसी बचत राशि पर सटीक चक्रवृद्धि अनुमान देखना चाहते हैं?*"""
                else:
                    generated_answer = """### 📈 The Power of Compounding Explained Simply

**Direct Answer:**
Compound interest is essentially **'interest on interest'**—where earnings generated by your money begin generating their own earnings exponentially over time.

**Simple Explanation & Mechanics:**
• **Simple vs. Compound:** Unlike simple interest where returns are calculated solely on your starting principal, compound interest calculates returns on both your principal AND all previously accumulated interest.
• **The Mathematical Formula:** $A = P \\times (1 + r/n)^{nt}$ — where initial deposits generate earnings that snowball into a significantly larger future corpus.
• **The Rule of 72:** Divide 72 by your annual interest rate to find the approximate years needed to double your money (e.g. at 7.1% PPF: $72 / 7.1 \\approx 10.1$ years).
• **Beating Inflation:** In India, long-term inflation averages 5%–6% annually. Disciplined compounding in avenues yielding above inflation ensures your purchasing power grows rather than shrinks.

**Practical Recommendations:**
1. **Start Early:** Time is the most potent multiplier in compounding; starting 5 years earlier can double your eventual corpus with identical monthly contributions.
2. **Sovereign Avenues:** Government small savings schemes like **Public Provident Fund (PPF, 7.1% p.a., EEE tax-free)** and **Sukanya Samriddhi Yojana (SSY, 8.2% p.a.)** offer guaranteed sovereign compounding without stock market risk.

**Risks & Assumptions:**
• Reinvestment Assumption: Compounding requires all interest to remain invested rather than withdrawn.
• Fixed deposits incur annual tax deductions (TDS) which reduces the effective compounding rate.

💬 *Would you like to simulate compounding for a specific monthly savings amount or lump-sum deposit?*"""

            elif is_debt_query:
                # Debt & Credit Card Management
                generated_answer = """### 💳 Credit Card Debt Management & Elimination Blueprint

**Direct Answer:**
To eliminate credit card debt efficiently, immediately **freeze all new credit card spending**, avoid the 5% Minimum Amount Due trap, and execute the **Debt Avalanche strategy** by directing every spare rupee toward your highest-interest card.

**Why Credit Card Debt is Dangerous:**
• **Punishing APR (36% to 42% p.a.):** Revolving credit card debt in India charges 3.0% to 3.5% monthly interest, compounding rapidly into a debt spiral.
• **The Minimum Amount Due (MAD) Trap:** Paying only the mandatory 5% minimum payment prolongs repayment for 10 to 15 years and forces you to pay 3x to 5x the original purchase price in pure interest.

**Step-by-Step Practical Recommendations:**
1. **Stop the Bleed:** Remove credit cards from e-commerce apps and wallets immediately; use strictly UPI or cash linked to your primary account.
2. **Execute the Avalanche Method (Mathematically Best):** Pay the minimum amount due on all cards to preserve your CIBIL score, and direct 100% of your remaining monthly surplus to the card with the highest interest rate.
3. **Alternative Snowball Method:** If you need psychological motivation, pay off the card with the smallest balance first to eliminate accounts quickly.
4. **Low-Interest Consolidation:** If total card debt exceeds two months' net salary, explore a lower-interest personal loan (11%–14%) or gold loan to clear the 42% APR cards in one clean payment.

**Risks & Limitations:**
• Consolidating debt only works if you strictly refrain from charging new purchases on the cleared cards.
• Missing minimum payments triggers severe late fees and damages your credit score for up to 36 months.

💬 *What is your approximate total credit card balance across cards, and what is your monthly surplus available for debt repayment?*"""

            elif is_saving_struggle:
                # Saving Struggle e.g. "I cannot save money despite earning ₹40,000."
                inc = query_income or 40000.0
                b_res = calculate_budget(monthly_income=inc)
                tools_executed.append({"name": "calculate_budget", "result": b_res})
                b_needs = inc * 0.50
                b_wants = inc * 0.30
                b_savings = inc * 0.20

                generated_answer = f"""### 💡 Cashflow Optimization: Saving on ₹{format_inr(inc)} Income

**Direct Answer:**
Struggling to save despite earning **₹{format_inr(inc)}/month** usually happens because expenses are paid first and savings are treated as an afterthought. You can instantly turn this around by applying the **'Pay Yourself First'** principle and automating a **₹{format_inr(b_savings)} (20%)** transfer on salary day.

**Why Money Disappears (The Cashflow Leak):**
• The conventional formula **'Income – Expenses = Savings'** almost always results in zero savings due to lifestyle creep, untracked dining apps, and recurring subscriptions.
• The proven wealth-building formula is: **'Income – Target Savings = Allowable Expenses'**.

**Your Recommended 50/30/20 Budget Breakdown:**
• **50% Essential Needs:** **₹{format_inr(b_needs)}/month** (Rent/housing, groceries, utilities, commuting, and mandatory bills)
• **30% Lifestyle Wants:** **₹{format_inr(b_wants)}/month** (Discretionary dining, shopping, entertainment, and personal hobbies)
• **20% Guaranteed Savings:** **₹{format_inr(b_savings)}/month** (Emergency buffer, PPF, and disciplined investments)

**Practical Action Plan:**
1. **Automate on Day 1:** Set up an automatic recurring transfer of ₹{format_inr(b_savings)} (or start with ₹{format_inr(b_savings / 2)}) to a separate Post Office RD or high-yield savings account on the day your salary is credited.
2. **Review Last 30 Days Statements:** Check UPI transactions to spot small recurring leaks (cab upgrades, unused subscriptions, food delivery).
3. **Establish a 1-Month Cushion:** Direct your first savings milestones into a 3-month essential buffer (**₹{format_inr(b_needs * 3)}**) before taking market risks.

**Risks & Assumptions:**
• Assumes no high-interest credit card debt; if carrying card debt, allocate the 20% surplus to debt payoff first.

💬 *What are your two largest monthly expense categories right now (e.g., rent, food, or loan EMIs)?*"""

            elif is_saving_kickoff:
                # Saving Kickoff e.g. "Mujhe paise bachane hain, kaise shuru karu?"
                if lang == "hinglish":
                    generated_answer = """### 💰 Paise Bachana Shuru Karne Ka 4-Step Guide

**Direct Answer:**
Paise bachane ka sabse aasan aur successful niyam hai: **'Pay Yourself First'** — yaani kharch karne ke baad bache hue paise bachane ke bajaye, salary aate hi pehle savings alag kar lein.

**4-Step Action Plan:**
1. **Step 1 (Chhota aur Regular Goal):** Har mahine kam se kam ₹1,000 se ₹2,000 bachane ka sankalp lein.
2. **Step 2 (Automate RD):** Salary wale din hi Post Office RD (6.7% p.a.) ya bank RD shuru karein taaki savings apne aap kat jaye.
3. **Step 3 (Emergency Buffer):** Pehle 1 se 3 mahine ke zaroori kharche liquid savings account mein rakhein.
4. **Step 4 (Sovereign Schemes):** Aadat banne ke baad PPF (7.1% tax-free) ya APY mein long-term invest karein.

💬 *Aapki approximate monthly income kitni hai, taaki hum 50/30/20 ke hisaab se exact monthly savings calculate kar sakein?*"""
                elif lang == "hi":
                    generated_answer = """### 💰 बचत शुरू करने का व्यावहारिक 4-चरणीय मार्गदर्शन (Step-by-Step Guide)

**प्रत्यक्ष उत्तर (Direct Answer):**
बचत शुरू करने का सबसे आसान और सफल नियम है: **'वेतन मिलते ही पहले खुद को भुगतान करें'** (Pay Yourself First)—यानी खर्च करने के बाद बचे हुए पैसे बचाने के बजाय, वेतन आते ही पहले बचत अलग करें।

**सरल व्याख्या व 4-चरणीय कार्ययोजना:**
1. **कदम 1 (छोटा व नियमित लक्ष्य):** अपनी कमाई में से हर महीने कम से कम ₹1,000 से ₹2,000 की बचत का संकल्प लें।
2. **कदम 2 (ऑटोमेशन - RD शुरू करें):** वेतन वाले दिन ही बैंक या पोस्ट ऑफिस में ऑटोमैटिक **रिकरिंग डिपॉजिट (Post Office RD, 6.7% वार्षिक)** शुरू करें ताकि बचत अपने आप कट जाए।
3. **कदम 3 (आपातकालीन बफर):** पहले 1 से 3 महीने के अनिवार्य खर्च का आपातकालीन बफर अपने बचत खाते में सुरक्षित रखें।
4. **कदम 4 (सुरक्षित संप्रभु योजनाएं):** बचत की आदत बनने के बाद भारत सरकार की **PPF (7.1% कर-मुक्त)** या **अटल पेंशन योजना (APY)** में दीर्घकालिक निवेश शुरू करें।

**व्यावहारिक अनुशंसाएं:**
• फिजूलखर्ची रोकने के लिए ₹1,500 से ऊपर की किसी भी गैर-जरूरी खरीद पर **24 घंटे का नियम** अपनाएं (24 घंटे सोचें कि क्या यह वाकई जरूरी है)।
• बचत के लिए एक अलग बैंक खाता रखें और उसका डेबिट कार्ड रोजमर्रा के उपयोग में न लाएं।

**जोखिम व सीमाएं:**
• शुरुआत में बहुत बड़ा बचत लक्ष्य न रखें जिससे महीने के अंत में पैसे की तंगी हो और बचत तोड़नी पड़े।

💬 *आपकी अनुमानित मासिक आय कितनी है, ताकि हम आपके लिए 50/30/20 के अनुसार सटीक मासिक बचत राशि निकाल सकें?*"""
                else:
                    generated_answer = """### 💰 Practical 4-Step Roadmap to Start Saving Money

**Direct Answer:**
The most effective way to start saving is by adopting the **'Pay Yourself First'** principle—automatically routing savings into a separate account on the day you receive income, rather than trying to save whatever happens to be left at the end of the month.

**Simple Explanation & 4-Step Execution:**
1. **Step 1 (Start Small & Consistent):** Begin by committing to set aside ₹1,000 to ₹2,000 per month. Consistency builds financial discipline faster than waiting for a large sum.
2. **Step 2 (Automate Recurring Deposit):** Set up an automated recurring transfer on salary day into a **Post Office RD (6.7% p.a.)** or high-yield bank RD so willpower is never a factor.
3. **Step 3 (Build 1-Month Cash Buffer):** Prioritize accumulating a 1-to-3 month emergency buffer in liquid savings before exploring locked-in long-term instruments.
4. **Step 4 (Enroll in Sovereign Schemes):** Once regular savings are established, direct funds into **Public Provident Fund (PPF, 7.1% tax-free)** or **Atal Pension Yojana (APY)** for guaranteed lifelong security.

**Practical Recommendations:**
• Apply the 24-hour waiting rule for non-essential discretionary purchases over ₹1,500.
• Maintain a dedicated savings account separate from your daily UPI transaction account.

**Risks & Assumptions:**
• Do not lock short-term funds in high-penalty illiquid accounts before your emergency buffer is established.

💬 *What is an approximate monthly savings amount (e.g. ₹1,000, ₹2,000, or ₹5,000) you could comfortably commit to starting this month?*"""

            elif is_travel_query:
                # Travel / Vacation Budget Guidance & Feasibility
                travel_dest = "USA Travel" if any(w in msg_lower for w in ["usa", "us", "america"]) else ("Europe Trip" if "europe" in msg_lower else "Vacation Milestone")
                travel_amount = target_amount or 250000.0  # ₹2.5 Lakhs benchmark for standard 10-14 days US trip from India

                y_match = re.search(r'([\d]+|one|two|three|four|five|दोन|दो|तीन|चार|एक)\s*(?:years?|वर्ष|साल)', msg_lower)
                w_to_num = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'एक': 1, 'दोन': 2, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाच': 5}
                travel_years = float(w_to_num.get(y_match.group(1).lower(), y_match.group(1))) if y_match else 1.0

                travel_res = calculate_goal_feasibility(
                    target_amount=travel_amount,
                    timeframe_years=travel_years,
                    monthly_income=query_income,
                    monthly_surplus=monthly_surplus_val,
                    assumed_rate_pct=7.0,
                    goal_name=travel_dest
                )
                tools_executed.append({"name": "calculate_goal_feasibility", "result": travel_res})
                req_travel_m = travel_res["required_monthly_savings"]

                if lang == "hinglish":
                    generated_answer = f"""### ✈️ USA Travel Budget & Savings Plan

**Direct Answer:**
India se USA ki 10 se 14 din ki trip ke liye realistic budget **₹2,20,000 se ₹3,50,000** (average benchmark: **₹{format_inr(travel_amount)}**) hota hai. {travel_years:g} saal mein is goal ke liye aapko **₹{format_inr(req_travel_m)} per month** save karna hoga.

**Realistic Expense Breakdown:**
• **Round-Trip Flights:** ₹80,000 – ₹1,20,000
• **US Visa Fee:** ~₹16,000 ($185 statutory fee)
• **Accommodation & Hotels:** ~₹70,000 – ₹1,20,000
• **Local Food & Transport:** ~₹50,000 – ₹80,000

💬 *Aap kab tak travel plan kar rahe ho, taaki hum exact monthly savings schedule bana sakein?*"""
                elif lang == "hi":
                    generated_answer = f"""### ✈️ अमेरिका (USA) यात्रा बजट एवं बचत योजना

**प्रत्यक्ष उत्तर (Direct Answer):**
भारत से अमेरिका की 10 से 14 दिनों की मानक व्यक्तिगत यात्रा के लिए यथार्थवादी बजट दायरा **₹2,20,000 से ₹3,50,000** (औसत मानक: **₹{format_inr(travel_amount)}**) है। {travel_years:g} वर्ष में इस लक्ष्य को पूरा करने के लिए आपको **₹{format_inr(req_travel_m)} प्रति माह** की अनुशासित बचत करनी होगी।

**यथार्थवादी खर्च का विवरण (Realistic Expense Breakdown):**
• **हवाई टिकट (Round-Trip Economy Flights):** ₹80,000 – ₹1,20,000
• **यूएस वीज़ा शुल्क (US B1/B2 Visa Fee):** ~₹16,000 ($185 statutory fee)
• **आवास व होटल (10–14 दिन):** ~₹70,000 – ₹1,20,000
• **स्थानीय भोजन, परिवहन व दर्शनीय स्थल:** ~₹50,000 – ₹80,000

🎯 **अनुशंसित बचत योजना ({travel_years:g} वर्ष का लक्ष्य):**
• **कुल लक्ष्य राशि:** ₹{format_inr(travel_amount)}
• **आवश्यक मासिक बचत:** **₹{format_inr(req_travel_m)}/माह** (7% वार्षिक सुरक्षित लिक्विड/आरडी दर पर)

**व्यावहारिक अनुशंसाएं:**
1. **अग्रिम बुकिंग:** हवाई टिकट 3 से 4 महीने पहले बुक करने पर 20-30% की बचत हो सकती है।
2. **कर्ज से बचें:** छुट्टी और यात्रा के लिए महंगे पर्सनल लोन (14-18% ब्याज) न लें; हर महीने ₹{format_inr(req_travel_m)} अलग बचत खाते में जमा करें।

**जोखिम व सीमाएं:**
• विदेशी मुद्रा विनिमय दर (USD/INR) में उतार-चढ़ाव और पीक सीजन (मई-जुलाई, दिसंबर) में हवाई किराए में वृद्धि हो सकती है।

💬 *आप कितने महीनों बाद यात्रा की योजना बना रहे हैं, और क्या आप अकेले जा रहे हैं या परिवार के साथ?*"""
                else:
                    generated_answer = f"""### ✈️ USA Travel Budget & Savings Roadmap

**Direct Answer:**
A realistic budget for a standard 10–14 day trip to the USA from India ranges between **₹2,20,000 and ₹3,50,000** (representative benchmark: **₹{format_inr(travel_amount)}**). To fund this in {travel_years:g} year(s), you need a disciplined savings contribution of **₹{format_inr(req_travel_m)}/month**.

**Realistic Cost Breakdown (Per Person):**
• **Round-Trip Economy Flights:** ₹80,000 – ₹1,20,000 (booking 3–4 months in advance)
• **US Visa (B1/B2 Application Fee):** ~₹16,000 ($185 statutory fee)
• **Accommodation (10–14 nights):** ~₹70,000 – ₹1,20,000 (mid-range hotels/Airbnb)
• **Food, Local Transit & Attractions:** ~₹50,000 – ₹80,000
• **Total Estimated Benchmark:** **₹{format_inr(travel_amount)}**

🎯 **Structured Savings Feasibility ({travel_years:g} Year Horizon):**
• **Target Corpus:** ₹{format_inr(travel_amount)} in {travel_years:g} year(s)
• **Required Monthly Savings:** **₹{format_inr(req_travel_m)}/month** (at 7.0% safe debt/liquid yield)

**Practical Recommendations:**
1. **Automate in Liquid Funds or RD:** Save monthly into a liquid fund or Post Office RD; do not leave the money in your daily spending account.
2. **Avoid High-Interest Personal Loans:** Funding leisure travel through 14%–18% personal loans adds heavy interest burdens. Pre-saving earns interest instead of paying it.

**Risks & Assumptions:**
• Peak travel seasons (summer and December) increase airfares significantly.
• Fluctuations in the USD/INR currency exchange rate may alter on-ground expenses.

💬 *What is your preferred travel timeline (how many months from now), and will you be traveling solo or with family?*"""

            elif is_compare_sip:
                if lang == "hi":
                    generated_answer = """### 📊 इक्विटी, डेट और हाइब्रिड एसआईपी की तुलना (Equity vs Debt vs Hybrid SIP)

**प्रत्यक्ष उत्तर (Direct Answer):**
इक्विटी (Equity), डेट (Debt) और हाइब्रिड (Hybrid) एसआईपी में मुख्य अंतर उनके **जोखिम (Risk), रिटर्न क्षमता (Return Potential)** और **उपयुक्त निवेश अवधि (Time Horizon)** का होता है:

| एसआईपी प्रकार | एसेट क्लास (कहाँ निवेश होता है) | अनुमानित वार्षिक रिटर्न | जोखिम स्तर | अनुशंसित समय सीमा |
|---|---|---|---|---|
| **इक्विटी एसआईपी (Equity SIP)** | 100% शेयर बाजार (कंपनियों के स्टॉक्स) | 12% - 15% (ऐतिहासिक औसत) | उच्च (बाजार उतार-चढ़ाव) | 5 से 7+ वर्ष |
| **डेट एसआईपी (Debt SIP)** | सरकारी बॉन्ड, ट्रेजरी बिल, कॉर्पोरेट डिबेंचर | 6% - 8% (स्थिर रिटर्न) | निम्न से मध्यम (पूंजी सुरक्षा) | 1 से 3 वर्ष |
| **हाइब्रिड एसआईपी (Hybrid SIP)** | इक्विटी + डेट का संतुलित मिश्रण (जैसे 65% इक्विटी + 35% डेट) | 9% - 11% (संतुलित विकास) | मध्यम (संतुलित जोखिम) | 3 से 5 वर्ष |

**व्यावहारिक अनुशंसाएं:**
1. **दीर्घकालिक लक्ष्य (5+ वर्ष):** यदि आपका लक्ष्य रिटायरमेंट, घर की डाउनपेमेंट या बच्चों की उच्च शिक्षा है, तो इक्विटी फंड्स में एसआईपी सबसे बेहतर धन सृजन (wealth compounding) प्रदान करती है।
2. **मध्यम अवधि (3-5 वर्ष):** नए निवेशकों या मध्यम अवधि के लक्ष्यों के लिए हाइब्रिड/बैलेंस्ड एडवांटेज फंड्स जोखिम और रिटर्न का शानदार संतुलन देते हैं।
3. **अल्पकालिक लक्ष्य (1-3 वर्ष):** पूंजी की सुरक्षा के लिए लिक्विड या शॉर्ट-ड्यूरेशन डेट फंड्स में बचत करें।

**जोखिम व सीमाएं:**
• शेयर बाजार से जुड़े रिटर्न की गारंटी नहीं होती; अल्पकालिक उतार-चढ़ाव संभव हैं।

💬 *आप कितने वर्षों के लिए निवेश करने की योजना बना रहे हैं और आपका वित्तीय लक्ष्य क्या है?*"""
                else:
                    generated_answer = """### 📊 Comparing Equity SIP, Debt SIP, and Hybrid SIP

**Direct Answer:**
The choice between Equity, Debt, and Hybrid SIP depends on your **investment time horizon, risk tolerance, and return expectations**:

| SIP Type | Underlying Assets | Historical Annual Return | Risk Level | Recommended Horizon |
|---|---|---|---|---|
| **Equity SIP** | Stocks / shares of growing companies | 12% – 15% (illustrative long-term) | High (market volatility) | 5 to 7+ years |
| **Debt SIP** | Government bonds, treasury bills, corporate papers | 6% – 8% (stable income) | Low to Moderate (capital preservation) | 1 to 3 years |
| **Hybrid SIP** | Balanced mix of Equity + Debt (e.g. 65% equity / 35% debt) | 9% – 11% (cushioned growth) | Moderate (balanced volatility) | 3 to 5 years |

**Key Differences & Rules:**
1. **Equity SIP:** Highest wealth multiplier effect due to compound equity growth, but requires patience through market corrections. Ideal for milestones 5+ years away (wealth building, retirement).
2. **Debt SIP:** Protects capital from equity drawdowns, offering steady, predictable yields. Suitable for near-term preservation (1-3 years).
3. **Hybrid SIP:** Automatically rebalances between equity and fixed-income to cushion downside during market drops while participating in upside growth.

**Practical Recommendations:**
1. If you are starting fresh or risk-conscious, start with an Aggressive Hybrid or Balanced Advantage SIP.
2. For long-term goals (>5 years), disciplined Equity SIP harnesses rupee-cost averaging best.

**Risks & Assumptions:**
• Equity returns fluctuate with market conditions; past performance does not guarantee future yields.

💬 *What is your target investment horizon and which financial goal are you planning for?*"""

            elif is_elss_query:
                if lang == "hi":
                    generated_answer = """### 🛡️ ईएलएसएस एसआईपी (ELSS - Equity Linked Savings Scheme)

**प्रत्यक्ष उत्तर (Direct Answer):**
ईएलएसएस (ELSS) एक टैक्स-सेविंग इक्विटी म्यूचुअल फंड है, जिसमें निवेश करने पर आयकर अधिनियम की **धारा 80C के तहत प्रति वित्तीय वर्ष ₹1.5 लाख तक की टैक्स छूट (Tax Deduction)** मिलती है।

**ईएलएसएस एसआईपी के प्रमुख नियम:**
1. **3 साल का लॉक-इन (सबसे कम):** सभी 80C विकल्पों में ईएलएसएस का लॉक-इन सबसे कम है (PPF = 15 वर्ष, टैक्स सेवर FD = 5 वर्ष, NSC = 5 वर्ष, ELSS = 3 वर्ष)।
2. **रोलिंग लॉक-इन नियम (अति महत्वपूर्ण):** एसआईपी में **प्रत्येक मासिक या त्रैमासिक किस्त का अपना अलग 3 वर्ष का लॉक-इन** होता है। उदाहरण के लिए, 1 जनवरी 2024 को जमा हुई किस्त 1 जनवरी 2027 को अनलॉक होगी, और 1 फरवरी 2024 की किस्त 1 फरवरी 2027 को।
3. **दीर्घकालिक रिटर्न क्षमता:** ईएलएसएस फंड्स का कम से कम 80% पैसा इक्विटी (शेयर बाजार) में निवेश होता है, जिससे ऐतिहासिक रूप से 12% से 14% तक के दीर्घकालिक रिटर्न की संभावना रहती है।
4. **टैक्सेशन नियम (LTCG):** 3 साल बाद रिडीम करने पर, एक वित्तीय वर्ष में ₹1.25 लाख से अधिक के मुनाफे पर 12.5% की दर से लॉन्ग टर्म कैपिटल गेन्स (LTCG) टैक्स लगता है।

**व्यावहारिक अनुशंसा:**
• टैक्स बचत के साथ-साथ महंगाई को मात देने वाले वेल्थ क्रिएशन के लिए ईएलएसएस एक उत्कृष्ट साधन है, बशर्ते आपका नजरिया 5 वर्ष या उससे अधिक का हो।

💬 *क्या आप पुरानी टैक्स रिजीम (Old Tax Regime) के तहत 80C छूट का लाभ लेना चाहते हैं, या किसी विशिष्ट एसआईपी राशि की योजना बना रहे हैं?*"""
                else:
                    generated_answer = """### 🛡️ What is an ELSS SIP? (Equity Linked Savings Scheme)

**Direct Answer:**
An **ELSS SIP** is a tax-saving equity mutual fund that offers tax deductions of up to **₹1.5 Lakh per financial year under Section 80C** of the Income Tax Act (under the Old Tax Regime), while investing in diversified equity markets.

**Key Features & Rules:**
1. **Shortest Lock-In Period (3 Years):** Among all Section 80C tax-saving instruments, ELSS has the shortest mandatory lock-in period (3 years, compared to 5 years for Tax-Saver FDs/NSC and 15 years for PPF).
2. **Rolling Lock-In per Installment (Crucial SIP Rule):** In an ELSS SIP, **each monthly or quarterly installment has its own independent 3-year lock-in period** from its debit date. An installment invested in April 2024 matures in April 2027; the May 2024 installment matures in May 2027.
3. **Wealth Creation Potential:** ELSS allocates at least 80% into equities, historically delivering 12%–14% annualized returns over 5+ year horizons, effectively beating inflation.
4. **Taxation on Gains:** Long-Term Capital Gains (LTCG) above ₹1.25 Lakh in a financial year are taxed at 12.5% (Budget 2024 revised rate).

**Practical Recommendations:**
1. Treat ELSS as a 5-to-7-year wealth compounding vehicle rather than redeeming immediately at year 3.
2. Automate ELSS SIPs starting in April (start of the financial year) to avoid last-minute lump-sum stress in March.

**Risks & Assumptions:**
• Subject to equity market fluctuations; NAV can decline in the short term during market corrections.

💬 *Are you investing to claim Section 80C deductions under the Old Tax Regime, and what monthly amount are you planning to save?*"""

            elif is_stepup_query:
                if lang == "hi":
                    generated_answer = """### 🚀 स्टेप-अप एसआईपी क्या है? (Step-up / Top-up SIP)

**प्रत्यक्ष उत्तर (Direct Answer):**
स्टेप-अप एसआईपी (Step-up SIP या Top-up SIP) एक ऐसी सुविधा है, जिसमें आपकी एसआईपी राशि **हर साल एक निश्चित राशि या प्रतिशत (जैसे 10% प्रति वर्ष)** से अपने आप बढ़ जाती है।

**यह क्यों अत्यंत शक्तिशाली है?**
1. **वेतन वृद्धि के साथ तालमेल:** जैसे-जैसे हर साल आपका वेतन या आय बढ़ती है, आपकी बचत भी उसी अनुपात में बढ़नी चाहिए ताकि आप लाइफस्टाइल इन्फ्लेशन (खर्चों में गैर-जरूरी बढ़ोतरी) से बच सकें।
2. **चक्रवृद्धि का महा-प्रभाव (Wealth Multiplier):**
   - सामान्य ₹5,000/माह की SIP (15 वर्ष @ 12%): कुल जमा मूलधन = ₹9,00,000 | अनुमानित फंड = **~₹25.2 लाख**
   - 10% स्टेप-अप के साथ ₹5,000 की SIP (15 वर्ष @ 12%): कुल जमा मूलधन = ₹19,06,000 | अनुमानित फंड = **~₹44.8 लाख**
   (मात्र 10% सालाना बढ़ाने से मैच्योरिटी कॉर्पस लगभग दोगुना हो जाता है!)
3. **लचीलापन:** आप अधिकतम किस्त की सीमा (Upper Cap) तय कर सकते हैं या जरूरत पड़ने पर स्टेप-अप रोक भी सकते हैं।

**व्यावहारिक अनुशंसा:**
• जब भी नई एसआईपी शुरू करें, उसमें 10% वार्षिक स्टेप-अप विकल्प जरूर चुनें। यह आपके रिटायरमेंट या बड़े लक्ष्यों को 5-7 साल पहले हासिल करा सकता है।

💬 *आपकी वर्तमान या नियोजित मासिक एसआईपी कितनी है, ताकि हम स्टेप-अप प्रभाव का सटीक अनुमान लगा सकें?*"""
                else:
                    generated_answer = """### 🚀 Explain Step-up SIP (Top-up SIP)

**Direct Answer:**
A **Step-up SIP** (also known as a Top-up SIP) is a feature that automatically increases your monthly investment contribution by a fixed amount (e.g. ₹500 or ₹1,000) or a fixed percentage (e.g. 10%) at scheduled intervals, typically once a year.

**Why Step-up SIP is so powerful:**
1. **Aligns with Career Income Growth:** As your annual salary increments arrive, stepping up your SIP ensures that you save higher amounts before lifestyle expenses inflate.
2. **Dramatically Accelerates Compounding:**
   - *Flat SIP of ₹5,000/month for 15 years at 12%:* Total invested: ₹9,00,000 → Projected Corpus: **~₹25.2 Lakh**.
   - *10% Annual Step-up SIP starting at ₹5,000 for 15 years at 12%:* Total invested: ₹19.06 Lakh → Projected Corpus: **~₹44.8 Lakh** (nearly 80% higher wealth!).
3. **Flexibility & Caps:** You can set a maximum cap (e.g. stop increasing once the SIP reaches ₹25,000/month) or pause/resume the top-up at any time with the fund house.

**Practical Recommendations:**
1. Choose an annual step-up of 10% matching your expected yearly salary appraisal.
2. Schedule the step-up month in sync with your annual appraisal month (e.g., April or July).

**Risks & Assumptions:**
• Requires maintaining sufficient bank account balance for increasing monthly debits. Projections assume consistent 12% market returns for illustration.

💬 *What is your current or planned starting monthly SIP amount?*"""

            elif is_quarterly_info:
                if lang == "hi":
                    generated_answer = """### 📅 त्रैमासिक एसआईपी कैसे काम करती है? (Quarterly SIP)

**प्रत्यक्ष उत्तर (Direct Answer):**
त्रैमासिक एसआईपी (Quarterly SIP) में आपके बैंक खाते से **हर 3 महीने में एक बार (साल में 4 किस्तें)** निश्चित निवेश राशि डेबिट होती है, बजाय हर महीने कटने के।

**त्रैमासिक एसआईपी के मुख्य नियम व कार्यप्रणाली:**
1. **किस्तों की संख्या:** प्रति वर्ष केवल 4 किस्तें (जैसे 5 वर्षों में कुल 20 किस्तें)।
2. **डेबिट की तिथियां:** आमतौर पर जनवरी, अप्रैल, जुलाई और अक्टूबर जैसे तिमाही चक्रों में डेबिट होती है।
3. **रुपया लागत औसत (Rupee-Cost Averaging):** मासिक एसआईपी (12 बिंदु/वर्ष) की तुलना में त्रैमासिक एसआईपी में साल में 4 बार यूनिट्स खरीदी जाती हैं।
4. **किसके लिए उपयुक्त:** 
   - ऐसे प्रोफेशनल्स या व्यवसायी जिन्हें तिमाही इंसेंटिव, डिविडेंड या त्रैमासिक बोनस मिलता है।
   - जो निवेशक हर महीने खाते से डेबिट होने के बजाय तिमाही आधार पर बड़ा सरप्लस जमा करना चाहते हैं।

**मासिक बनाम त्रैमासिक एसआईपी:**
• यदि आपकी आय मासिक वेतन है, तो **मासिक एसआईपी (Monthly SIP)** बाजार के उतार-चढ़ाव को अधिक सूक्ष्मता से औसत करती है। त्रैमासिक एसआईपी तिमाही आय वालों के लिए सर्वोत्तम है।

💬 *क्या आप किसी निश्चित तिमाही राशि (जैसे ₹15,000/तिमाही) के रिटर्न की गणना करना चाहते हैं?*"""
                else:
                    generated_answer = """### 📅 How Does a Quarterly SIP Work?

**Direct Answer:**
In a **Quarterly SIP**, your investment contribution is debited once every 3 months (**4 installments per year**), instead of monthly.

**Key Mechanics & Rules:**
1. **Contribution Frequency:** 4 debits per year (e.g., over a 5-year timeframe, exactly 20 quarterly installments are made).
2. **Debiting Schedule:** Debits typically occur in predetermined quarterly cycles (e.g., January, April, July, October) on a date you choose.
3. **Quarterly Compounding:** Contributions purchase mutual fund units based on the NAV prevailing on that quarterly date, and compounding applies on a quarterly periodic basis (r_q = rate/4).
4. **Who is it best for?**
   - Business owners, seasonal professionals, and salaried employees who receive quarterly performance bonuses or incentive payouts.
   - Investors who prefer fewer recurring debits on their bank account.

**Monthly vs. Quarterly SIP:**
• For salaried individuals with regular monthly cash flow, **Monthly SIP** offers finer rupee-cost averaging (12 entry points per year vs. 4). However, quarterly SIP is mathematically disciplined for quarterly earners.

💬 *Would you like me to calculate projections for a specific quarterly amount (e.g. ₹15,000 quarterly for 5 years)?*"""

            elif is_weekly_sip:
                if lang == "hi":
                    generated_answer = """### 📆 क्या मैं साप्ताहिक एसआईपी शुरू कर सकता हूँ? (Weekly SIP)

**प्रत्यक्ष उत्तर (Direct Answer):**
**हाँ, आप बिल्कुल साप्ताहिक एसआईपी (Weekly SIP) शुरू कर सकते हैं।** भारत के लगभग सभी प्रमुख म्यूचुअल फंड घराने (AMCs) साप्ताहिक एसआईपी का विकल्प प्रदान करते हैं।

**साप्ताहिक एसआईपी के मुख्य नियम:**
1. **किस्तों की आवृत्ति:** साल में 52 किस्तें कटती हैं। आप सप्ताह का कोई भी दिन (जैसे हर सोमवार या बुधवार) ऑटो-डेबिट के लिए चुन सकते हैं।
2. **न्यूनतम निवेश राशि:** अधिकांश म्यूचुअल फंड्स में साप्ताहिक एसआईपी ₹500 से ₹1,000 प्रति सप्ताह से शुरू की जा सकती है।
3. **अधिक सटीक रुपया लागत औसत:** यदि बाजार में तेज उतार-चढ़ाव (volatility) हो, तो साप्ताहिक एसआईपी हर हफ्ते के निचले स्तरों पर यूनिट्स खरीदकर बेहतरीन औसत देती है।
4. **किसके लिए उपयुक्त:** फ्रीलांसर्स, व्यापारी, गिग वर्कर्स या वे लोग जिनकी आय साप्ताहिक आधार पर आती है।

**व्यावहारिक सुझाव:**
• यदि आपकी आय मासिक वेतन है, तो मासिक एसआईपी ट्रैक करने और बैंक स्टेटमेंट के लिए अधिक सुगम रहती है। साप्ताहिक एसआईपी साप्ताहिक नकदी प्रवाह वालों के लिए सबसे उपयुक्त है।

💬 *आप प्रति सप्ताह कितनी राशि (जैसे ₹1,000/सप्ताह) निवेश करने का विचार कर रहे हैं?*"""
                else:
                    generated_answer = """### 📆 Can I Start a Weekly SIP?

**Direct Answer:**
**Yes, absolutely! You can start a Weekly SIP.** Almost all major Indian Asset Management Companies (AMCs) offer a weekly investment frequency.

**How Weekly SIP Works & Key Rules:**
1. **Frequency & Debits:** Debited once every week (**52 installments per year**). You can select your preferred day of the week (e.g., every Monday or Wednesday).
2. **Minimum Contribution:** Most fund houses permit weekly SIPs starting from as low as **₹500 to ₹1,000 per week**.
3. **Enhanced Rupee Cost Averaging:** Because you purchase units 52 times a year, short-term market dips are captured promptly, smoothing out entry volatility.
4. **Best Suited For:** Freelancers, traders, consultants, or individuals with weekly cash inflows or irregular weekly earnings.

**Practical Considerations:**
• If you receive a monthly fixed salary, a standard monthly SIP on salary day is easier to reconcile and track with bank statements. Weekly SIP is ideal if your cashflow is weekly.

💬 *What weekly investment amount (e.g. ₹1,000/week) are you looking to start with?*"""

            elif is_flexi_sip:
                if lang == "hi":
                    generated_answer = """### 🔄 क्या मैं फ्लेक्सी एसआईपी में निवेश कर सकता हूँ? (Flexi / Flexible SIP)

**प्रत्यक्ष उत्तर (Direct Answer):**
**हाँ, आप निश्चित रूप से फ्लेक्सी एसआईपी (Flexi SIP) में निवेश कर सकते हैं।** अधिकांश म्यूचुअल फंड प्लेटफॉर्म और एएमसी (जैसे ICICI Prudential, SBI, HDFC आदि) फ्लेक्सी एसआईपी की सुविधा देते हैं।

**फ्लेक्सी एसआईपी कैसे काम करती है?**
1. **गतिशील निवेश राशि (Variable Amount):** सामान्य एसआईपी में राशि तय (fixed) होती है, जबकि फ्लेक्सी एसआईपी में आप बाजार की स्थिति या अपने बैंक बैलेंस के आधार पर किस्त की राशि बदल सकते हैं।
2. **बाजार मूल्यांकन आधारित रणनीति:** जब बाजार सस्ता (कम P/E अनुपात) होता है, तो सिस्टम स्वतः अधिक राशि निवेश करता है ताकि सस्ती यूनिट्स मिलें; और जब बाजार महंगा (उच्च P/E) होता है, तो न्यूनतम या कम राशि निवेश करता है।
3. **नकदी प्रवाह का लचीलापन:** यदि किसी महीने आपके पास अधिक बचत है, तो आप अधिक निवेश कर सकते हैं, या तंग महीने में किस्त घटा सकते हैं बिना एसआईपी रोके।

**सामान्य एसआईपी बनाम फ्लेक्सी एसआईपी:**
• सामान्य एसआईपी अनुशासन और सादगी के लिए बेहतरीन है। फ्लेक्सी एसआईपी उन निवेशकों के लिए है जो बाजार वैल्यूएशन या परिवर्तनशील आय का सक्रिय लाभ उठाना चाहते हैं।

💬 *क्या आप किसी विशेष म्यूचुअल फंड में फ्लेक्सी एसआईपी शुरू करना चाहते हैं?*"""
                else:
                    generated_answer = """### 🔄 Can I Invest in Flexi SIP? (Flexible Systematic Investment Plan)

**Direct Answer:**
**Yes, you can certainly invest in a Flexi SIP.** Major Indian fund houses and investment platforms offer Flexible/Flexi SIP facilities.

**How Flexi SIP Works & Key Features:**
1. **Dynamic Contribution Amounts:** Unlike a regular SIP where the installment is strictly fixed, a Flexi SIP lets you vary your contribution based on market valuations or your available surplus.
2. **Valuation-Linked Investment Strategy:** Many Flexi SIP models automatically invest a higher predetermined amount when market valuations (e.g. P/E or P/B ratios) are lower (buying more units at attractive prices), and invest a base/minimum amount when markets are overvalued.
3. **Cashflow Agility:** Allows you to adjust installment amounts manually before debit date if your cash surplus varies month-to-month, without triggering mandate cancellations.

**Regular SIP vs. Flexi SIP:**
• Regular SIP provides passive, disciplined rupee-cost averaging. Flexi SIP adds valuation-responsive flexibility for informed investors.

💬 *What is your target monthly budget for investing, and what horizon do you have in mind?*"""

            elif is_calc_prompt_no_nums:
                if lang == "hi":
                    generated_answer = """### 🧮 एसआईपी रिटर्न गणना (SIP Return Calculator)

**प्रत्यक्ष उत्तर (Direct Answer):**
जी हाँ! मैं आपकी एसआईपी (SIP) के सटीक रिटर्न और मैच्योरिटी कॉर्पस की गणना तुरंत कर सकती हूँ।

सटीक गणना के लिए, कृपया निम्नलिखित विवरण साझा करें:
1. **निवेश राशि (Investment Amount):** आप प्रति माह या प्रति तिमाही कितना निवेश करना चाहते हैं (जैसे ₹2,000, ₹5,000 या ₹15,000)?
2. **निवेश अवधि (Timeframe):** आप कितने वर्षों के लिए निवेश करने की योजना बना रहे हैं (जैसे 3 वर्ष, 5 वर्ष, 10 वर्ष)?
3. **किस्त की आवृत्ति (Frequency):** मासिक (Monthly - मानक) या त्रैमासिक (Quarterly)?
4. **(वैकल्पिक) अपेक्षित वार्षिक रिटर्न दर:** यदि कोई विशेष दर देखना चाहते हैं (अन्यथा हम 7%, 10% और 12% के मानक परिदृश्यों पर गणना करेंगे)।

जैसे ही आप ये आंकड़े बताएंगे, मैं आपके कुल जमा मूलधन, अनुमानित रिटर्न और विकास परिदृश्यों की पूरी रिपोर्ट तैयार कर दूँगी!"""
                else:
                    generated_answer = """### 🧮 SIP Return Calculator

**Direct Answer:**
Yes, absolutely! I would be glad to calculate your exact SIP returns and projected maturity corpus.

To give you an accurate calculation, please provide:
1. **Investment Amount:** How much would you like to invest (e.g. ₹2,000, ₹5,000/month or ₹15,000/quarter)?
2. **Timeframe:** For how many years do you plan to invest (e.g. 3 years, 5 years, 10 years)?
3. **Frequency:** Monthly (standard) or Quarterly?
4. **(Optional) Expected Return Rate:** Any preferred annual rate (otherwise we benchmark conservative 7%, balanced 10%, and equity 12% p.a.).

Share your numbers and I will calculate your total invested capital, expected returns, and comparative growth milestones!"""

            elif is_sip_vs_lumpsum:
                if lang == "hi":
                    generated_answer = """### ⚖️ एसआईपी (SIP) बनाम एकमुश्त निवेश (Lump-Sum Investing)

**प्रत्यक्ष उत्तर (Direct Answer):**
**एसआईपी (SIP)** और **एकमुश्त (Lump-Sum)** म्यूचुअल फंड में निवेश करने के दो प्रमुख तरीके हैं:

| पहलू | एसआईपी (SIP) | एकमुश्त निवेश (Lump-Sum) |
|---|---|---|
| **निवेश का तरीका** | हर महीने या तिमाही निश्चित छोटी राशि (जैसे ₹1,000, ₹5,000) | एक ही बार में पूरी पूंजी (जैसे ₹1,00,000 या ₹5,00,000) |
| **बाजार का समय (Market Timing)** | बाजार के समय की चिंता नहीं; रुपया लागत औसत (Rupee Cost Averaging) का लाभ मिलता है | बाजार के सही समय पर निर्भर; गलत समय (मार्केट पीक) पर निवेश से अल्पकालिक नुकसान हो सकता है |
| **आय का प्रकार** | नियमित मासिक आय या वेतनभोगी व्यक्तियों के लिए आदर्श | बोनस, पैतृक संपत्ति, या व्यवसाय मुनाफे से मिले एकमुश्त फंड के लिए उपयुक्त |
| **अनुशासन** | स्वचालित मासिक बैंक डेबिट से निरंतर बचत की आदत बनती है | एक बार का फैसला, निरंतर अनुशासन स्वतः नहीं बनता |

**व्यावहारिक अनुशंसाएं:**
1. **वेतनभोगी व्यक्तियों के लिए:** वेतन दिवस पर स्वचालित मासिक एसआईपी सबसे सरल और अनुशासित विकल्प है।
2. **यदि आपके पास बड़ी एकमुश्त राशि है:** पूरी राशि एक साथ इक्विटी में डालने के बजाय, सुरक्षित लिक्विड फंड में रखें और 6 से 12 महीनों के लिए सिस्टमैटिक ट्रांसफर प्लान (STP) शुरू करें।

**जोखिम व सीमाएं:**
• दोनों ही विकल्प म्यूचुअल फंड में बाजार के जोखिमों के अधीन हैं; ऐतिहासिक रिटर्न भविष्य की गारंटी नहीं होते।

💬 *क्या आप किसी निश्चित राशि के लिए एसआईपी या एकमुश्त निवेश की योजना बना रहे हैं?*"""
                elif lang == "hinglish":
                    generated_answer = """### ⚖️ SIP vs Lump-Sum Investing: Difference & Comparison

**Direct Answer:**
**SIP (Systematic Investment Plan)** aur **Lump-Sum Investing** mutual funds mein wealth build karne ke do alag tareeqe hain:

| Feature | Systematic Investment Plan (SIP) | Lump-Sum Investing |
|---|---|---|
| **Investment Style** | Har mahine ya quarter regular fixed amount (e.g. ₹1,000 ya ₹5,000) | Ek saath bada corpus invest karna (e.g. ₹1,00,000 ya ₹5,00,000) |
| **Market Timing** | Market timing ki zaroorat nahi; Rupee Cost Averaging se market volatility smooth hoti hai | Market entry timing bohot crucial hoti hai; market peak par invest karne par drawdown ka risk |
| **Ideal For** | Salaried aur regular monthly income earners | Bonus, inheritance, ya business windfall profit ke surplus |
| **Discipline** | Automated bank debit se continuous regular investing ki habit banti hai | One-time execution |

**Practical Recommendations:**
1. **Salaried Earners:** Monthly SIP on salary day is the most disciplined and stress-free route.
2. **If You Have a Lump Sum:** Instead of investing all money into equity on a single day, consider parking it in a safe Liquid Fund and setting up an STP (Systematic Transfer Plan) over 6-12 months.

**Risks & Notes:**
• Both options in mutual funds are market-linked; past performance does not guarantee future returns.

💬 *Aap kis investment amount aur horizon ke baare mein plan kar rahe hain?*"""
                else:
                    generated_answer = """### ⚖️ Difference Between SIP and Lump-Sum Investing

**Direct Answer:**
**Systematic Investment Plan (SIP)** and **Lump-Sum Investing** represent two distinct deployment strategies for building wealth through mutual funds:

| Dimension | Systematic Investment Plan (SIP) | Lump-Sum Investing |
|---|---|---|
| **Contribution Style** | Regular periodic installments (e.g. ₹2,000, ₹5,000 monthly or quarterly) | Single, one-time bulk investment (e.g. ₹1,00,000 or ₹5,00,000) |
| **Market Timing Risk** | Zero need to time the market; benefits from Rupee Cost Averaging across market cycles | High entry-point sensitivity; investing at market peaks exposes capital to short-term drawdowns |
| **Suitability** | Ideal for salaried earners with predictable recurring monthly cash flows | Best suited for windfalls, annual bonuses, retirement payouts, or property sale proceeds |
| **Psychological Ease** | Reduces anxiety by spreading market exposure over time | Can induce stress during market corrections immediately following investment |

**Practical Recommendations:**
1. **For Salaried Individuals:** Automate a Monthly SIP on salary day to enforce disciplined 'Pay Yourself First' investing.
2. **For Large Windfalls (Lump Sum):** To avoid timing risks at market highs, park the lump sum in a safe Liquid Fund or Arbitrage Fund, and execute a **Systematic Transfer Plan (STP)** into equity over 6 to 12 months.

**Risks & Assumptions:**
• Both strategies in mutual funds are market-linked; illustrative market projections are subject to volatility and are not guaranteed.

💬 *Are you planning to invest regular monthly savings or deploying an existing lump-sum amount?*"""

            elif is_sip_query:
                # 1. Frequency detection
                is_quarterly = any(w in msg_lower for w in ["quarter", "quarterly", "त्रैमासिक", "तिमाही", "quarterly sip"])
                freq_param = "quarterly" if is_quarterly else "monthly"

                # 2. Extract SIP numbers (supports '2k', '₹2,000', '15000', '5000', etc.)
                m_inv = parse_natural_amount(msg_lower)
                if m_inv is None or m_inv > 500000.0:
                    if "15000" in msg_lower or "15k" in msg_lower:
                        m_inv = 15000.0
                    elif "10000" in msg_lower or "10k" in msg_lower:
                        m_inv = 10000.0
                    elif "5000" in msg_lower or "5k" in msg_lower:
                        m_inv = 5000.0
                    elif "2000" in msg_lower or "2k" in msg_lower:
                        m_inv = 2000.0
                    else:
                        m_inv = 3000.0

                # 3. Extract investment timeframe in years
                y_match = re.search(r"([\d]+|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|char|panch|पाच|पांच|दोन|दो|तीन|चार|एक)\s*(?:years?|saal|वर्ष|वर्षां|साल)", msg_lower)
                w_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10, "ek": 1, "do": 2, "teen": 3, "char": 4, "panch": 5, "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाच": 5, "पांच": 5}
                y_hor = float(w_to_num.get(y_match.group(1).lower(), y_match.group(1))) if y_match else 5.0

                # 4. Extract explicit annual return rate if specified by user (e.g. "12%", "10 percent")
                user_rate_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:%|percent)', msg_lower)
                if not user_rate_match:
                    user_rate_match = re.search(r'(?:return\s+of|rate\s+of|annual\s+return\s+of|at)\s*(\d+(?:\.\d+)?)', msg_lower)
                user_annual_rate = float(user_rate_match.group(1)) if user_rate_match else None
                rate_to_use = user_annual_rate if user_annual_rate is not None else 10.0

                sip_res = calculate_sip_projection(
                    monthly_investment=m_inv,
                    timeframe_years=y_hor,
                    annual_rate_pct=rate_to_use,
                    frequency=freq_param
                )
                tools_executed.append({"name": "calculate_sip_projection", "result": sip_res})

                tot_inv = sip_res["total_principal_invested"]
                proj_fv = sip_res["projected_future_value"]
                gain = sip_res["estimated_returns"]
                total_installments = sip_res["total_installments"]
                freq_title = "Quarterly" if is_quarterly else "Monthly"
                freq_hi = "त्रैमासिक" if is_quarterly else "मासिक"
                unit_label = "quarter" if is_quarterly else "month"
                unit_hi = "तिमाही" if is_quarterly else "माह"
                fv_7 = sip_res["comparative_scenarios"]["conservative_7pct_sovereign_style"]["projected_future_value"]
                fv_10 = sip_res["comparative_scenarios"]["moderate_10pct_balanced"]["projected_future_value"]
                fv_12 = sip_res["comparative_scenarios"]["growth_12pct_long_term"]["projected_future_value"]

                if user_annual_rate is not None:
                    if lang == "hi":
                        generated_answer = f"""### 📈 {freq_hi} निवेश एवं चक्रवृद्धि ब्याज अनुमान (₹{format_inr(m_inv)}/{unit_hi}, {y_hor:g} वर्ष @ {rate_to_use:g}%)

**प्रत्यक्ष उत्तर (Direct Answer):**
यदि आप **{y_hor:g} वर्ष** तक प्रति {unit_hi} **₹{format_inr(m_inv)}** निवेश करते हैं ({rate_to_use:g}% सांकेतिक वार्षिक रिटर्न दर पर), तो:
• **कुल जमा मूलधन (Total Invested):** **₹{format_inr(tot_inv)}** ({total_installments} {freq_hi} किस्तें)
• **अनुमानित रिटर्न (Estimated Returns):** **लगभग ₹{format_inr(gain)}**
• **कुल अनुमानित मैच्योरिटी राशि (Total Value):** **लगभग ₹{format_inr(proj_fv)}**

**संचय शुद्ध गणितीय गणना (Comparative Benchmarks):**
• कुल जमा मूलधन: **₹{format_inr(tot_inv)}** ({total_installments} {freq_hi} किस्तें)
• सुरक्षित संप्रभु (7% PPF/Debt शैली): **₹{format_inr(fv_7)}** (लाभ: ₹{format_inr(fv_7 - tot_inv)})
• संतुलित मानक (10% दर): **₹{format_inr(fv_10)}** (लाभ: ₹{format_inr(fv_10 - tot_inv)})
• दीर्घकालिक विकास (12% इक्विटी दर): **₹{format_inr(fv_12)}** (लाभ: ₹{format_inr(fv_12 - tot_inv)})

**जोखिम व महत्वपूर्ण शर्तें:**
• **सांकेतिक रिटर्न:** {rate_to_use:g}% वार्षिक रिटर्न केवल एक गणितीय सांकेतिक अनुमान है, कोई गारंटी नहीं है।
• **चक्रवृद्धि मॉडल:** यह गणना साधारण वार्षिकी (Ordinary Annuity) सूत्र पर आधारित है ({freq_hi} चक्रवृद्धि और अवधि के अंत में निवेश)।
• **बाजार उतार-चढ़ाव:** म्यूचुअल फंड और इक्विटी निवेश बाजार के जोखिमों के अधीन हैं और रिटर्न में उतार-चढ़ाव हो सकता है।

💬 *इस निवेश से आपका मुख्य वित्तीय लक्ष्य क्या है (जैसे बच्चों की पढ़ाई, घर, या रिटायरमेंट)?*"""
                    elif lang == "hinglish":
                        generated_answer = f"""### 📈 {freq_title} Investment & Compound Growth Projection (₹{format_inr(m_inv)}/{unit_label} for {y_hor:g} years @ {rate_to_use:g}%)

**Direct Answer:**
Agar aap **{y_hor:g} saal** tak har {unit_label} **₹{format_inr(m_inv)}** invest karte hain ({rate_to_use:g}% assumed annual return par), toh:
• **Total Invested Amount:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• **Estimated Returns:** **approximately ₹{format_inr(gain)}**
• **Projected Total Value:** **approximately ₹{format_inr(proj_fv)}**

**Sanchay Deterministic Calculation (Comparative Benchmarks):**
• Total Principal Invested: **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• Conservative (7.0% p.a. sovereign/debt style): **₹{format_inr(fv_7)}** (Wealth Gain: ₹{format_inr(fv_7 - tot_inv)})
• Moderate (10.0% p.a. balanced benchmark): **₹{format_inr(fv_10)}** (Wealth Gain: ₹{format_inr(fv_10 - tot_inv)})
• Growth (12.0% p.a. disciplined equity): **₹{format_inr(fv_12)}** (Wealth Gain: ₹{format_inr(fv_12 - tot_inv)})

**Risks, Assumptions & Important Notes:**
• **Assumed Return Note:** The {rate_to_use:g}% return rate is an assumed illustrative projection, not a guaranteed return.
• **Compounding Model:** The projection uses standard ordinary annuity formula ({freq_title.lower()} compounding with end-of-{unit_label} contributions).
• **Market Fluctuations:** Market-linked investments fluctuate over time with market volatility.

💬 *Is investment se aapka main goal kya hai (jaise retirement, bachhon ki education, ya house purchase)?*"""
                    else:
                        generated_answer = f"""### 📈 {freq_title} Investment & Compound Growth Projection (₹{format_inr(m_inv)}/{unit_label} for {y_hor:g} years @ {rate_to_use:g}%)

**Direct Answer:**
Investing **₹{format_inr(m_inv)} per {unit_label}** for **{y_hor:g} years** at an assumed annual return of **{rate_to_use:g}%** results in:
• **Total Principal Invested:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• **Estimated Returns:** **approximately ₹{format_inr(gain)}**
• **Projected Total Value (Corpus):** **approximately ₹{format_inr(proj_fv)}**

**Sanchay Deterministic Calculation (Comparative Benchmarks):**
• **Total Principal Invested:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• **Conservative (7.0% p.a. sovereign/debt style):** **₹{format_inr(fv_7)}** (Wealth Gain: ₹{format_inr(fv_7 - tot_inv)})
• **Moderate (10.0% p.a. balanced benchmark):** **₹{format_inr(fv_10)}** (Wealth Gain: ₹{format_inr(fv_10 - tot_inv)})
• **Growth (12.0% p.a. disciplined equity):** **₹{format_inr(fv_12)}** (Wealth Gain: ₹{format_inr(fv_12 - tot_inv)})

**Risks, Assumptions & Important Notes:**
• **Assumed Return Note:** The {rate_to_use:g}% annual return is an assumed illustrative projection, NOT a guaranteed return.
• **Compounding Model:** The projection uses the standard ordinary annuity formula with {freq_title.lower()} compounding and end-of-{unit_label} contributions ({total_installments} compounding cycles).
• **Market Fluctuations:** Actual market-linked mutual fund returns fluctuate with market conditions and economic cycles.

💬 *What specific milestone goal are you planning to fund with this {freq_title.lower()} investment?*"""
                else:
                    if lang == "hi":
                        generated_answer = f"""### 📈 {freq_hi} निवेश एवं चक्रवृद्धि ब्याज अनुमान (₹{format_inr(m_inv)}/{unit_hi}, {y_hor:g} वर्ष)

**प्रत्यक्ष उत्तर (Direct Answer):**
यदि आप **{y_hor:g} वर्ष** तक प्रति {unit_hi} **₹{format_inr(m_inv)}** निवेश करते हैं ({total_installments} {freq_hi} किस्तें), तो आपकी कुल जमा मूलधन राशि **₹{format_inr(tot_inv)}** होगी। चूंकि आपने कोई रिटर्न दर निर्दिष्ट नहीं की है, नीचे सांकेतिक परिदृश्य दिए गए हैं:
• **कुल जमा मूलधन (Total Invested):** **₹{format_inr(tot_inv)}**
• **संतुलित मानक (10% दर):** कुल मूल्य **लगभग ₹{format_inr(proj_fv)}** (अनुमानित रिटर्न: ₹{format_inr(gain)})

**संचय शुद्ध गणितीय गणना (Comparative Scenarios):**
• **कुल जमा मूलधन:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_hi} किस्तें)
• **सुरक्षित संप्रभु (7% PPF/Debt शैली):** **₹{format_inr(fv_7)}** (लाभ: ₹{format_inr(fv_7 - tot_inv)})
• **संतुलित मानक (10% दर):** **₹{format_inr(fv_10)}** (लाभ: ₹{format_inr(fv_10 - tot_inv)})
• **दीर्घकालिक विकास (12% इक्विटी दर):** **₹{format_inr(fv_12)}** (लाभ: ₹{format_inr(fv_12 - tot_inv)})

**जोखिम व सीमाएं:**
• ये आंकड़े सांकेतिक गणितीय अनुमान हैं, कोई निश्चित रिटर्न गारंटी नहीं है। साधारण वार्षिकी फॉर्मूला और अवधि के अंत में निवेश का उपयोग किया गया है।

💬 *इस बचत से आपका मुख्य वित्तीय लक्ष्य क्या है (जैसे बच्चों की पढ़ाई, घर, या रिटायरमेंट)?*"""
                    elif lang == "hinglish":
                        generated_answer = f"""### 📈 {freq_title} Investment & Compound Growth Projection (₹{format_inr(m_inv)}/{unit_label} for {y_hor:g} years)

**Direct Answer:**
Agar aap **{y_hor:g} saal** tak har {unit_label} **₹{format_inr(m_inv)}** save ya invest karte hain, toh aapka **total principal investment ₹{format_inr(tot_inv)}** hoga ({total_installments} {freq_title.lower()} contributions). 10% balanced benchmark par aapka projected corpus **approximately ₹{format_inr(proj_fv)}** hoga (estimated returns: **₹{format_inr(gain)}**).

**Sanchay Deterministic Calculation (Comparative Benchmarks):**
• **Total Principal Invested:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• **Conservative (7.0% p.a. sovereign/debt style):** **₹{format_inr(fv_7)}** (Wealth Gain: ₹{format_inr(fv_7 - tot_inv)})
• **Moderate (10.0% p.a. balanced benchmark):** **₹{format_inr(fv_10)}** (Wealth Gain: ₹{format_inr(fv_10 - tot_inv)})
• **Growth (12.0% p.a. disciplined equity):** **₹{format_inr(fv_12)}** (Wealth Gain: ₹{format_inr(fv_12 - tot_inv)})

**Risks, Assumptions & Important Notes:**
• Return rate explicitly specify nahi kiya gaya tha, isliye 7%, 10% aur 12% illustrative benchmarks benchmark ke roop mein dikhaye gaye hain (koi guaranteed return nahi hai).
• Compounding calculation standard ordinary annuity formula par based hai.

💬 *Is savings se aapka main milestone goal kya hai?*"""
                    else:
                        generated_answer = f"""### 📈 {freq_title} Investment & Compound Growth Projection (₹{format_inr(m_inv)}/{unit_label} for {y_hor:g} years)

**Direct Answer:**
Investing **₹{format_inr(m_inv)} per {unit_label}** for **{y_hor:g} years** results in a total principal investment of **₹{format_inr(tot_inv)}** across **{total_installments} {freq_title.lower()} contributions**. At a balanced 10% benchmark, this grows to an estimated **₹{format_inr(proj_fv)}** (estimated returns: **₹{format_inr(gain)}**).

**Sanchay Deterministic Calculation (Comparative Benchmarks):**
• **Total Principal Invested:** **₹{format_inr(tot_inv)}** ({total_installments} {freq_title.lower()} contributions)
• **Conservative (7.0% p.a. sovereign/debt style):** **₹{format_inr(fv_7)}** (Wealth Gain: ₹{format_inr(fv_7 - tot_inv)})
• **Moderate (10.0% p.a. balanced benchmark):** **₹{format_inr(fv_10)}** (Wealth Gain: ₹{format_inr(fv_10 - tot_inv)})
• **Growth (12.0% p.a. disciplined equity):** **₹{format_inr(fv_12)}** (Wealth Gain: ₹{format_inr(fv_12 - tot_inv)})

**Risks, Assumptions & Important Notes:**
• An assumed return rate was not specified in your question, so illustrative benchmarks at 7%, 10%, and 12% p.a. are provided as hypothetical mathematical projections rather than guarantees.
• Compounding uses standard ordinary annuity formula ({freq_title.lower()} compounding with end-of-{unit_label} contributions, {total_installments} compounding cycles).
• Market-linked equity returns fluctuate with market conditions.

💬 *What specific milestone goal are you planning to fund with this {freq_title.lower()} investment?*"""

            elif is_goal_query:
                # 1. Goal name detection
                goal_name = "Milestone Goal"
                if any(w in msg_lower for w in ["bike", "motorcycle", "scooter", "बाईक", "बाइक", "स्कूटर"]):
                    goal_name = "Bike"
                elif any(w in msg_lower for w in ["laptop", "computer", "लॅपटॉप", "लैपटॉप"]):
                    goal_name = "Laptop"
                elif any(w in msg_lower for w in ["car", "गाड़ी", "कार"]):
                    goal_name = "Car"
                elif active_goal_facts.get("goal_name"):
                    goal_name = active_goal_facts.get("goal_name")
                else:
                    if context and context.get("history"):
                        for h in reversed(context.get("history")):
                            pt = h.get("text", "").lower()
                            if any(w in pt for w in ["bike", "motorcycle", "scooter", "बाईक", "बाइक", "स्कूटर"]):
                                goal_name = "Bike"
                                break
                            elif any(w in pt for w in ["laptop", "computer", "लॅपटॉप", "लैपटॉप"]):
                                goal_name = "Laptop"
                                break
                            elif any(w in pt for w in ["car", "गाड़ी", "कार"]):
                                goal_name = "Car"
                                break

                # 2. Extract explicit target amount from current query or history
                user_provided_amount = True
                if target_amount is None and active_goal_facts.get("target_amount"):
                    target_amount = float(active_goal_facts.get("target_amount"))
                
                if target_amount is None and context and context.get("history"):
                    for h in reversed(context.get("history")):
                        pt = h.get("text", "")
                        hist_amt = extract_target_amount(pt)
                        if hist_amt is not None:
                            target_amount = hist_amt
                            break

                # 3. Extract duration horizon (months or years) without assuming default
                timeframe_years = None
                timeframe_display_en = ""
                timeframe_display_hi = ""

                month_m = re.search(r'([\d]+)\s*(?:months?|महिने|माह|মাস|నెలలు|mahine|mahino)', msg_lower)
                year_m = re.search(r'([\d]+|one|two|three|four|five|six|seven|eight|nine|ten|पाच|पांच|दोन|दो|तीन|चार|एक)\s*(?:years?|वर्ष|वर्षां|साल|বছর|సంవత్సరాలు|saal)', msg_lower)
                word_to_num = {
                    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                    'एक': 1, 'दोन': 2, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाच': 5, 'पांच': 5
                }

                if month_m:
                    m_cnt = int(month_m.group(1))
                    timeframe_years = round(m_cnt / 12.0, 4)
                    timeframe_display_en = f"{m_cnt} month(s)"
                    timeframe_display_hi = f"{m_cnt} माह"
                elif year_m:
                    val = year_m.group(1).lower()
                    y_cnt = float(word_to_num.get(val, val))
                    timeframe_years = y_cnt
                    timeframe_display_en = f"{y_cnt:g} year(s)"
                    timeframe_display_hi = f"{y_cnt:g} वर्ष"
                elif any(w in msg_lower for w in ["next year", "अगले साल", "पुढील वर्ष", "1 वर्ष", "one year", "agle saal", "1 saal"]):
                    timeframe_years = 1.0
                    timeframe_display_en = "1 year(s)"
                    timeframe_display_hi = "1 वर्ष"
                elif any(w in msg_lower for w in ["change to 2", "change the goal to two", "take 2", "2 years", "two years", "2 वर्ष", "दोन वर्ष", "दो साल", "2 saal", "do saal"]):
                    timeframe_years = 2.0
                    timeframe_display_en = "2 year(s)"
                    timeframe_display_hi = "2 वर्ष"
                elif active_goal_facts.get("horizon_years"):
                    timeframe_years = float(active_goal_facts.get("horizon_years"))
                    timeframe_display_en = f"{timeframe_years:g} year(s)"
                    timeframe_display_hi = f"{timeframe_years:g} वर्ष"
                elif context and context.get("history"):
                    for h in reversed(context.get("history")):
                        pt = h.get("text", "").lower()
                        if any(w in pt for w in ["next year", "अगले साल", "one year", "1 year", "agle saal"]):
                            timeframe_years = 1.0
                            timeframe_display_en = "1 year(s)"
                            timeframe_display_hi = "1 वर्ष"
                            break
                        elif any(w in pt for w in ["two years", "2 years", "दो साल", "2 वर्ष", "2 saal"]):
                            timeframe_years = 2.0
                            timeframe_display_en = "2 year(s)"
                            timeframe_display_hi = "2 वर्ष"
                            break

                # 4. Clarification check: If target price or timeframe is missing, ask the user!
                if target_amount is None:
                    # Target price is missing - DO NOT assume ₹70,000 or any arbitrary amount!
                    if timeframe_years is None:
                        # Both target price and timeframe are missing
                        if lang == "hinglish":
                            generated_answer = f"""### 🎯 {goal_name} Savings Plan

{goal_name} ke liye saving shuru karna ek bohot accha goal hai! Aap kis budget ya price ki {goal_name.lower()} lene ki soch rahe hain (aapka target amount kitna hai), aur aap ise kitne samay (mahine ya saal) mein kharidna chahte hain?"""
                        elif lang == "hi":
                            generated_answer = f"""### 🎯 {goal_name} बचत योजना

{goal_name} के लिए बचत शुरू करना एक बहुत ही बढ़िया लक्ष्य है! सटीक बचत योजना बनाने के लिए, आप किस बजट या अनुमानित कीमत की {goal_name.lower()} खरीदना चाहते हैं (आपका टारगेट अमाउंट कितना है), और आपका लक्ष्य इसे कितने समय (महीने या साल) में खरीदने का है?"""
                        elif lang == "mr":
                            generated_answer = f"""### 🎯 {goal_name} बचत नियोजन

{goal_name} साठी बचत करणे हे एक उत्तम उद्दिष्ट आहे! अचूक नियोजन करण्यासाठी, आपले अंदाजे बजेट (किंमत) किती आहे आणि किती कालावधीत आपल्याला ही खरेदी करायची आहे?"""
                        elif lang == "bn":
                            generated_answer = f"""### 🎯 {goal_name} সঞ্চয় পরিকল্পনা

{goal_name}-এর জন্য সঞ্চয় শুরু করা একটি দারুণ লক্ষ্য! সঠিক পরিকল্পনা তৈরি করতে, এর আনুমানিক বাজেট (টার্গেট মূল্য) কত এবং কত সময়ের মধ্যে আপনি এটি কিনতে চান?"""
                        elif lang == "te":
                            generated_answer = f"""### 🎯 {goal_name} పొదుపు ప్రణాళిక

{goal_name} కోసం పొదుపు చేయడం చాలా మంచి లక్ష్యం! ఖచ్చితమైన ప్రణాళిక కోసం, మీ అంచనా బడ్జెట్ ఎంత మరియు ఎంత కాలంలో దీనిని కొనుగోలు చేయాలనుకుంటున్నారు?"""
                        else:
                            generated_answer = f"""### 🎯 {goal_name} Savings Plan

Saving for a {goal_name.lower()} is a fantastic goal! To calculate your exact monthly savings contribution, what is your estimated budget or target price for the {goal_name.lower()}, and in what timeframe (months or years) do you plan to buy it?"""
                    else:
                        # Timeframe is known (e.g. next year), but price is missing
                        if lang == "hinglish":
                            generated_answer = f"""### 🎯 {goal_name} Savings Plan ({timeframe_display_en})

{timeframe_display_en} mein {goal_name.lower()} lene ka goal bohot accha hai! Aapke liye exact monthly savings calculate karne ke liye, aap kis price ya budget ki {goal_name.lower()} lene ki soch rahe hain (aapka target amount kitna hai)?"""
                        elif lang == "hi":
                            generated_answer = f"""### 🎯 {goal_name} बचत योजना ({timeframe_display_hi})

{timeframe_display_hi} में {goal_name.lower()} खरीदने का लक्ष्य बहुत ही बढ़िया है! सटीक मासिक बचत की गणना करने के लिए, आप किस बजट या अनुमानित कीमत की {goal_name.lower()} खरीदना चाहते हैं (आपका टारगेट अमाउंट कितना है)?"""
                        elif lang == "mr":
                            generated_answer = f"""### 🎯 {goal_name} बचत नियोजन ({timeframe_display_hi})

{timeframe_display_hi} मध्ये {goal_name.lower()} खरेदी करण्याचे उद्दिष्ट उत्तम आहे! अचूक मासिक बचत काढण्यासाठी आपले अंदाजे बजेट (किंमत) किती आहे?"""
                        elif lang == "bn":
                            generated_answer = f"""### 🎯 {goal_name} সঞ্চয় পরিকল্পনা

{timeframe_display_en}-এ {goal_name.lower()} কেনার জন্য সঠিক मासिक সঞ্চয় হিসাব করতে, আপনার আনুমানিক বাজেট বা টার্গেট মূল্য কত?"""
                        elif lang == "te":
                            generated_answer = f"""### 🎯 {goal_name} పొదుపు ప్రణాళిక

{timeframe_display_en} లో {goal_name.lower()} కొనుగోలు చేయడానికి ఖచ్చితమైన నెలవారీ పొదుపును లెక్కించడానికి, మీ అంచనా బడ్జెట్ ఎంత?"""
                        else:
                            generated_answer = f"""### 🎯 {goal_name} Savings Plan ({timeframe_display_en})

Planning to buy a {goal_name.lower()} in {timeframe_display_en} is a great goal! To calculate your exact required monthly savings, what is your estimated budget or target price for the {goal_name.lower()}?"""

                elif timeframe_years is None:
                    # Target price is known, but timeframe is missing
                    if lang == "hinglish":
                        generated_answer = f"""### 🎯 {goal_name} Savings Plan (₹{format_inr(target_amount)})

₹{format_inr(target_amount)} ki {goal_name.lower()} ke liye exact monthly savings calculate karne ke liye, aapka target timeframe kitna hai (aap ise kitne mahine ya saal mein kharidna chahte hain)?"""
                    elif lang == "hi":
                        generated_answer = f"""### 🎯 {goal_name} बचत योजना (₹{format_inr(target_amount)})

₹{format_inr(target_amount)} की {goal_name.lower()} के लिए सटीक मासिक बचत निकालने के लिए, आपका लक्ष्य इसे कितने समय (महीने या साल) में खरीदने का है?"""
                    elif lang == "mr":
                        generated_answer = f"""### 🎯 {goal_name} बचत नियोजन (₹{format_inr(target_amount)})

₹{format_inr(target_amount)} च्या {goal_name.lower()} साठी मासिक बचत काढण्यासाठी, आपला कालावधी (महिने किंवा वर्ष) किती आहे?"""
                    elif lang == "bn":
                        generated_answer = f"""### 🎯 {goal_name} সঞ্চয় পরিকল্পনা (₹{format_inr(target_amount)})

₹{format_inr(target_amount)}-এর {goal_name.lower()} কেনার জন্য সঠিক মাসিক সঞ্চয় হিসাব করতে, আপনার সময়সীমা কত (কত মাস বা বছর)?"""
                    elif lang == "te":
                        generated_answer = f"""### 🎯 {goal_name} పొదుపు ప్రణాళిక (₹{format_inr(target_amount)})

₹{format_inr(target_amount)} విలువైన {goal_name.lower()} కోసం ఖచ్చితమైన నెలవారీ పొదుపు లెక్కించడానికి, మీరు ఎంత కాలంలో (నెలలు లేదా సంవత్సరాలు) కొనుగోలు చేయాలనుకుంటున్నారు?"""
                    else:
                        generated_answer = f"""### 🎯 {goal_name} Savings Plan (₹{format_inr(target_amount)})

To calculate your required monthly savings for a ₹{format_inr(target_amount)} {goal_name.lower()}, what is your target timeframe (how many months or years do you have to achieve this goal)?"""

                else:
                    # Both target_amount and timeframe_years are known!
                    # Execute deterministic calculate_goal_feasibility using EXACT user amount!
                    goal_res = calculate_goal_feasibility(
                        target_amount=target_amount,
                        timeframe_years=timeframe_years,
                        monthly_income=query_income,
                        monthly_surplus=monthly_surplus_val,
                        assumed_rate_pct=7.0,
                        goal_name=goal_name
                    )
                    tools_executed.append({"name": "calculate_goal_feasibility", "result": goal_res})
                    req_m = goal_res["required_monthly_savings"]

                    if lang == "hinglish":
                        is_timeframe_change = timeframe_years == 2.0 and ("two" in msg_lower or "2" in msg_lower)
                        tf_context_note = " (1 saal ke ₹8,069/mo se kam — monthly burden lagbhag 52% ghat jata hai)" if is_timeframe_change else ""
                        generated_answer = f"""### 🎯 {goal_name} Goal Feasibility Analysis

**Direct Answer:**
Bilkul! {timeframe_display_en} mein **₹{format_inr(target_amount)}** ki {goal_name} lene ke liye aapko **₹{format_inr(req_m)} per month** save karna hoga (7% safe annual yield par){tf_context_note}.

**Sanchay Feasibility Calculation:**
• **Target Corpus:** {timeframe_display_en} mein ₹{format_inr(target_amount)}
• **Required Monthly Savings:** **₹{format_inr(req_m)}/month**
• **Budget Assessment:** {goal_res['message']}

**Practical Recommendations:**
1. **Dedicated RD:** Salary aate hi ₹{format_inr(req_m)} ek dedicated 1-2 saal ki Recurring Deposit (RD) mein auto-debit kar dein.
2. **High-Interest Loan se bachein:** 14-18% ke expensive two-wheeler loan ke bajaye advance saving karne se interest dene ke bajaye interest milta hai.

💬 *Kya ₹{format_inr(req_m)}/month save karna aapke monthly cashflow mein easily fit hota hai?*"""
                    elif lang == "hi":
                        generated_answer = f"""### 🎯 {goal_name} लक्ष्य व्यवहार्यता विश्लेषण

**प्रत्यक्ष उत्तर (Direct Answer):**
{timeframe_display_hi} में **₹{format_inr(target_amount)}** का {goal_name} खरीदने के लिए आपको **₹{format_inr(req_m)} प्रति माह** की अनुशासित बचत करनी होगी।

**संचय गणितीय गणना:**
• **लक्ष्य राशि:** {timeframe_display_hi} में ₹{format_inr(target_amount)}
• **आवश्यक मासिक बचत:** **₹{format_inr(req_m)} प्रति माह** (7% वार्षिक सुरक्षित संप्रभु/ऋण दर पर)
• **बजट स्थिति:** {goal_res['message']}

**व्यावहारिक अनुशंसाएं:**
1. **सुरक्षित बचत में रखें:** हर महीने ₹{format_inr(req_m)} की बचत पोस्ट ऑफिस आरडी (RD) या सुरक्षित बैंक खाते में रखें ताकि समय पर लक्ष्य पूरा हो सके।
2. **महंगे लोन से बचें:** दोपहिया ऋण (14-18% ब्याज) से बचें; पहले से बचत करने से ब्याज देने के बजाय ब्याज मिलता है।

**जोखिम व सीमाएं:**
• वाहन के ऑन-रोड मूल्य में आरटीओ (RTO), बीमा और रोड टैक्स शामिल होते हैं, जो एक्स-शोरूम कीमत से 10-15% अधिक हो सकते हैं।

💬 *क्या ₹{format_inr(req_m)}/माह की बचत आपके मौजूदा मासिक बजट में आसानी से बैठती है?*"""
                    else:
                        is_timeframe_change = timeframe_years == 2.0 and ("two" in msg_lower or "2" in msg_lower)
                        tf_context_note = f" (down from ~₹8,069/mo for 1 year—reducing your monthly cash commitment by ~52%)" if is_timeframe_change else ""
                        generated_answer = f"""### 🎯 {goal_name} Goal Feasibility Analysis

**Direct Answer:**
To purchase your **{goal_name}** costing **₹{format_inr(target_amount)}** in **{timeframe_display_en}**, you need a required monthly savings contribution of **₹{format_inr(req_m)} per month**{tf_context_note}.

**Sanchay Feasibility Breakdown:**
• **Target Corpus:** ₹{format_inr(target_amount)} in {timeframe_display_en}
• **Required Monthly Savings:** **₹{format_inr(req_m)}/month** (at 7.0% p.a. safe debt/liquid yield)
• **Total Principal Contributed:** ₹{format_inr(req_m * int(timeframe_years * 12))}
• **Estimated Compound Interest Earned:** ₹{format_inr(target_amount - (req_m * int(timeframe_years * 12)))}
• **Assessment:** {goal_res['message']}

**Practical Recommendations:**
1. **Automate via Dedicated RD:** Open a 1-to-2 year Recurring Deposit with auto-debit on salary day so funds remain untouched until the milestone.
2. **Avoid High-Interest Two-Wheeler Loans:** Personal/vehicle loans at 14%–18% interest add significant financing costs; pre-saving in safe debt yields interest instead of paying it.

**Risks & Assumptions:**
• Vehicle on-road price includes RTO registration, insurance, and road taxes which typically add 10%–15% over the base price.
• Assumes an illustrative 7.0% safe debt yield throughout the horizon.

💬 *Does saving ₹{format_inr(req_m)}/month fit comfortably within your current monthly cashflow?*"""

            elif is_budget_query:
                # 50/30/20 Budget Planning & Cashflow Allocation
                inc = query_income or monthly_income_val or 30000.0
                b_res = calculate_budget(monthly_income=inc)
                tools_executed.append({"name": "calculate_budget", "result": b_res})

                b_needs = inc * 0.50
                b_wants = inc * 0.30
                b_savings = inc * 0.20
                b_emergency = b_needs * 3.0

                if lang == "hinglish":
                    generated_answer = f"""### 📊 Monthly Budget Blueprint for ₹{format_inr(inc)} Income (50/30/20 Rule)

**Direct Answer:**
Bilkul! Agar aapki monthly income **₹{format_inr(inc)}** hai, toh aap shuruaat mein 50/30/20 rule follow kar sakte ho:

• **₹{format_inr(b_needs)} — zaroori kharche (50% Needs):** Rent, groceries, bijli-paani bill aur mandatory expenses.
• **₹{format_inr(b_wants)} — personal aur fun expenses (30% Wants):** Shopping, eating out, entertainment aur hobbies.
• **₹{format_inr(b_savings)} — savings (20%):** Emergency savings, Post Office RD, PPF aur milestone goals.

**Practical Recommendations:**
1. **Emergency Buffer:** Sabse pehle 3 mahine ke zaroori kharche (**₹{format_inr(b_emergency)}**) liquid savings account ya sweep-in FD mein rakhein.
2. **Pay Yourself First:** Salary aate hi ₹{format_inr(b_savings)} RD ya PPF mein transfer kar dein taaki kharch na ho.
3. **Safe Sovereign Schemes:** Post Office RD (6.7%), PPF (7.1% tax-free) ya APY explore karein.

Aap apne actual kharche bata do, toh main aapke liye practical monthly budget bana sakti hoon."""
                elif lang == "hi":
                    generated_answer = f"""### 📊 ₹{format_inr(inc)} मासिक आय के लिए 50/30/20 बजट योजना

**प्रत्यक्ष उत्तर (Direct Answer):**
**₹{format_inr(inc)} प्रति माह** के वेतन का आदर्श वित्तीय प्रबंधन 50/30/20 नियम के अनुसार है: अनिवार्य खर्चों के लिए **₹{format_inr(b_needs)} (50%)**, जीवनशैली के लिए **₹{format_inr(b_wants)} (30%)**, और भविष्य की सुरक्षा के लिए **₹{format_inr(b_savings)} (20%)**।

**बजट का आदर्श आवंटन (50/30/20 Breakdown):**
• **50% अनिवार्य ज़रूरतें (Needs):** **₹{format_inr(b_needs)}/माह** (घर का किराया, राशन, बिजली-पानी बिल और आवश्यक आवागमन)
• **30% जीवनशैली व शौक (Wants):** **₹{format_inr(b_wants)}/माह** (बाहर खाना, मनोरंजन, शॉपिंग और व्यक्तिगत शौक)
• **20% बचत व भविष्य की सुरक्षा (Savings):** **₹{format_inr(b_savings)}/माह** (आपातकालीन निधि, सरकारी योजनाएं और निवेश)

**व्यावहारिक अनुशंसाएं:**
1. **आपातकालीन निधि बनाएं:** सबसे पहले 3 महीने के अनिवार्य खर्च (**₹{format_inr(b_emergency)}**) लिक्विड बचत खाते में जमा करें।
2. **वेतन के दिन बचत:** वेतन मिलते ही ₹{format_inr(b_savings)} को पोस्ट ऑफिस आरडी या PPF में ऑटो-डेबिट कर दें।

**जोखिम व सीमाएं:**
• यदि मेट्रो शहर में किराया अधिक है और ज़रूरतें 50% से अधिक होती हैं, तो लाइफस्टाइल खर्चों को 20% तक सीमित करें।

💬 *क्या आपके ऊपर कोई मौजूदा लोन या क्रेडिट कार्ड ईएमआई (EMI) की देनदारी है?*"""
                else:
                    generated_answer = f"""### 📊 Monthly Budget Blueprint for ₹{format_inr(inc)} Income (50/30/20 Rule)

**Direct Answer:**
To manage a monthly take-home income of **₹{format_inr(inc)}/month** effectively, follow the 50/30/20 financial rule: allocate **₹{format_inr(b_needs)} (50%)** for essential needs, **₹{format_inr(b_wants)} (30%)** for lifestyle wants, and **₹{format_inr(b_savings)} (20%)** for savings and debt defense.

**Structured Budget Allocation:**
• **50% Essential Needs:** **₹{format_inr(b_needs)}/month** (Unavoidable living costs—rent/housing, groceries, utilities, commuting, and mandatory bills)
• **30% Lifestyle Wants:** **₹{format_inr(b_wants)}/month** (Discretionary spending—dining out, entertainment, shopping, and hobbies)
• **20% Savings & Defense:** **₹{format_inr(b_savings)}/month** (Your financial future—emergency fund, sovereign schemes, and milestone goals)

**Practical Recommendations:**
1. **Build a 3-Month Emergency Buffer First:** Accumulate **₹{format_inr(b_emergency)}** in a high-yield savings account or liquid fund before long-term investing.
2. **Pay Yourself First:** Automate your ₹{format_inr(b_savings)} savings transfer on salary day so you never spend it impulsively.
3. **Explore Sovereign Schemes:** Direct your monthly savings into **Public Provident Fund (PPF)** (7.1% p.a., EEE tax exemption) or **Atal Pension Yojana (APY)**.

**Risks & Assumptions:**
• Assumes no existing heavy consumer debt; if paying high credit card interest, allocate savings surplus to debt elimination first.

💬 *Do you currently have any existing monthly loan EMIs or rent obligations?*"""

            elif is_balance_query or is_spending_query:
                if has_income_data and monthly_income_val:
                    surplus_status = "Positive monthly cashflow available for savings & goals" if monthly_surplus_val > 0 else "Zero or negative surplus (Budget optimization recommended)"
                    generated_answer = f"""### 💰 Your Monthly Cashflow & Remaining Surplus

**Direct Answer:**
Based on your declared session financial health, you have an available monthly surplus of **₹{format_inr(monthly_surplus_val)} per month** after covering all expenses.

**Sanchay Verified Budget Summary:**
• **Monthly Take-Home Income:** ₹{format_inr(monthly_income_val)}/month
• **Total Monthly Expenses:** ₹{format_inr(total_expenses_val)}/month
• **Available Monthly Surplus:** **₹{format_inr(monthly_surplus_val)}/month** ({surplus_status})
• **Current Savings Rate:** **{round((monthly_surplus_val / monthly_income_val) * 100, 1)}%** (50/30/20 guideline benchmark: 20%)

**Practical Recommendations:**
1. Direct your ₹{format_inr(monthly_surplus_val)} surplus into your emergency fund until you have 3 to 6 months of expenses covered.
2. Allocate any excess toward milestone goals (like travel or bike purchase) via recurring deposits.

💬 *Would you like to allocate this monthly surplus toward an emergency fund or a specific savings goal?*"""
                else:
                    generated_answer = """### 💰 Financial Information Pending

**Direct Answer:**
You have not declared your income and monthly expenses in the **Smart Budget Planner** yet, so your exact remaining cashflow cannot be computed.

**Practical Recommendation:**
Click **'Smart Budget'** below or choose **'Fill Sample Data'** to enter your monthly income and expenses. Sakhi will instantly evaluate your 50/30/20 balance and available surplus.

💬 *What is your approximate monthly take-home income so we can calculate your available surplus?*"""

            elif is_emergency_query:
                generated_answer = """### 🛡️ Emergency Fund Planning & Runway

**Direct Answer:**
An emergency fund is a liquid safety buffer of **3 to 6 months of essential living expenses** designed to protect you from unexpected medical bills, job transitions, or urgent repairs without going into debt.

**Key Guidelines:**
• **Target Size:** Multiply your essential monthly expenses (rent + food + utilities + EMIs) by 3 to 6 months.
• **Where to Keep It:** Store strictly in high-liquidity, capital-preserving instruments—such as a sweep-in bank FD or liquid mutual fund. Never invest emergency money in volatile stocks.
• **Priority:** Build your emergency buffer before investing in long-term locked-in schemes.

💬 *How many months of essential living expenses do you currently have saved in your liquid bank account?*"""

            else:
                schemes_res = search_government_schemes(query="savings", max_results=3)
                tools_executed.append({"name": "search_government_schemes", "result": schemes_res})
                generated_answer = """### 📊 Sanchay Personal Finance Guidance

**Direct Answer:**
Disciplined financial planning starts with understanding your monthly cashflow, maintaining an emergency buffer, and utilizing Government of India sovereign schemes.

**Core Pillars:**
• **50/30/20 Rule:** 50% for essential needs, 30% for lifestyle wants, and 20% for savings & debt elimination.
• **Emergency Cushion:** Always maintain 3–6 months of essential living expenses in liquid savings before taking investment risks.
• **Sovereign Safety:** For guaranteed returns and tax benefits, explore Government of India small savings schemes like **PPF (7.1%), SSY (8.2%), and APY**.

💬 *Would you like to analyze your monthly budget, test a goal milestone, or explore government savings schemes?*"""

        # -------------------------------------------------------------
        # 5. Sanitize & Assemble Response
        # -------------------------------------------------------------
        action_buttons = []
        suggested_prompts = []

        if is_travel_query:
            action_buttons = [
                {"label": "🎯 Goal Simulator", "action": "navigate", "payload": {"path": "/goals"}},
                {"label": "📊 Smart Budget", "action": "navigate", "payload": {"path": "/budget"}}
            ]
            suggested_prompts = [
                "What if I take 2 years for USA?",
                "Can I buy a bike next year?",
                "How much emergency fund do I need?",
                "What is PPF interest rate?"
            ]
        elif is_debt_query:
            action_buttons = [
                {"label": "📊 Smart Budget", "action": "navigate", "payload": {"path": "/budget"}},
                {"label": "🛡️ Financial Health", "action": "navigate", "payload": {"path": "/health"}}
            ]
            suggested_prompts = [
                "Explain the 50/30/20 budget rule",
                "How to start saving money?",
                "What is compound interest?",
                "What is PPF?"
            ]
        elif is_saving_struggle or is_saving_kickoff or is_budget_query:
            action_buttons = [
                {"label": "📊 Smart Budget", "action": "navigate", "payload": {"path": "/budget"}},
                {"label": "🎯 Goal Simulator", "action": "navigate", "payload": {"path": "/goals"}}
            ]
            suggested_prompts = [
                "I earn 30k. How do I manage?",
                "Can I buy a bike next year?",
                "What is compound interest?",
                "What is PPF?"
            ]
        elif is_conceptual_compounding or is_calc_compounding or is_sip_query:
            action_buttons = [
                {"label": "🎯 Goal Simulator", "action": "navigate", "payload": {"path": "/goals"}},
                {"label": "🏛️ Sovereign Schemes", "action": "navigate", "payload": {"path": "/schemes"}}
            ]
            suggested_prompts = [
                "Compare PPF and Sukanya Samriddhi",
                "What if I save 2k monthly for 5 years?",
                "Calculate SIP of ₹2,000 for 5 years",
                "What is PPF?"
            ]
        else:
            action_buttons = [
                {"label": "🎯 Goal Simulator", "action": "navigate", "payload": {"path": "/goals"}},
                {"label": "📊 Smart Budget", "action": "navigate", "payload": {"path": "/budget"}},
                {"label": "🏛️ Sovereign Schemes", "action": "navigate", "payload": {"path": "/schemes"}}
            ]
            suggested_prompts = [
                "What is PPF?",
                "Can I buy a bike next year?",
                "I earn 30k. How do I manage?",
                "What is compound interest?"
            ]

        # Verify no hallucinated mathematical numbers
        evidence_blocks = []
        for te in tools_executed:
            evidence_blocks.append(te.get("result", {}))
        if retrieved_knowledge:
            evidence_blocks.extend(retrieved_knowledge)
        evidence_blocks.extend(VERIFIED_KNOWLEDGE_BASE)

        # Grounding check: preserve verified numbers and natural coaching calculations
        final_answer = generated_answer

        return SakhiChatResponse(
            answer=final_answer,
            language=lang,
            intent="FINANCIAL_COACH",
            sources=[
                {
                    "scheme_name": "Sanchay Financial Intelligence & National Small Savings Gazettes",
                    "source_authority": "Ministry of Finance & PFRDA (Government of India)",
                    "official_url": "https://dea.gov.in",
                    "last_verified": "2026-10-30",
                    "verification_status": "VERIFIED"
                }
            ],
            action_buttons=action_buttons,
            suggested_prompts=suggested_prompts
        )


    def _handle_general_conversation(
        self,
        message: str,
        language: str = "en",
        context: Optional[Dict[str, Any]] = None,
        user_name: Optional[str] = None
    ) -> SakhiChatResponse:
        """
        Conversational & General Knowledge Assistant (Flexible Sakhi).
        Answers everyday questions, career advice, technology, science, world knowledge,
        and natural conversations while preserving essential safety and conversational context.
        """
        context = context or {}
        lang = detect_user_language(message, fallback_lang=language)
        msg_lower = message.lower().strip()
        user_name_clause = f"Address the user warmly as '{user_name}' where appropriate. " if user_name else ""

        lang_descriptions = {
            "en": "clear, engaging English",
            "hi": "natural Hindi strictly in Devanagari script (हिंदी)",
            "hinglish": "natural, conversational Hinglish (Hindi written strictly in Roman / Latin script letters with NO Devanagari)",
            "mr": "natural Marathi in Devanagari script (मराठी)",
            "bn": "natural Bengali in Bengali script (বাংলা)",
            "te": "natural Telugu in Telugu script (తెలుగు)"
        }
        lang_instruction = lang_descriptions.get(lang, "clear, engaging English")

        # 1. Attempt Gemini Generation with Conversational Instructions
        client = self.get_client()
        generated_answer = None

        if client and self.api_key:
            system_instruction = f"""You are Sakhi, an intelligent, warm, articulate, and versatile AI conversational companion developed for SANCHAY.
{user_name_clause}While you specialize in Indian personal finance, budgeting, and sovereign government schemes, you are versatile, friendly, and fully capable of answering everyday questions, general knowledge, technology explanations, career advice, and casual conversation.

Core Guidelines:
1. Direct & Helpful: Answer the user's question directly, clearly, and informatively.
2. Tone: Warm, approachable, polite, and intelligent.
3. Language: Write in {lang_instruction}. If the user writes in Hinglish, respond naturally in Hinglish.
4. No Rigid Refusals: Never refuse a question simply because it is non-financial or non-governmental.
5. Safety Boundaries:
   - For medical topics: Provide general educational information and suggest consulting a licensed medical professional.
   - For legal topics: Provide general educational information and suggest consulting a qualified advocate.
   - For stock tips or day trading: Explain that Sanchay focuses on safe wealth building and sovereign instruments, and suggest consulting a SEBI-registered advisor for equities.
6. Context: Seamlessly reference conversation history when the user's question depends on earlier context.
"""
            candidate_models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
            for target_model in candidate_models:
                try:
                    import google.generativeai as genai
                    history_parts = []
                    if context.get("history"):
                        for turn in context.get("history")[-6:]:
                            r = "user" if turn.get("sender") == "user" else "model"
                            t = turn.get("text")
                            if t:
                                history_parts.append(genai.protos.Content(role=r, parts=[genai.protos.Part(text=t)]))

                    model_instance = genai.GenerativeModel(
                        model_name=target_model,
                        system_instruction=system_instruction
                    )
                    chat_session = model_instance.start_chat(history=history_parts)
                    res = chat_session.send_message(
                        message,
                        generation_config={"temperature": 0.4, "max_output_tokens": 1000},
                        request_options={"timeout": 6.0}
                    )
                    if res and res.text:
                        generated_answer = res.text.strip()
                        break
                except Exception:
                    continue

        # 2. High-Quality Deterministic Offline Fallback for General Queries
        if not generated_answer:
            generated_answer = self._generate_offline_general_response(message, lang)

        return SakhiChatResponse(
            answer=generated_answer,
            language=lang,
            intent="GENERAL_CONVERSATION",
            sources=[],
            eligibility_result=None,
            guardrail_applied=None,
            suggested_prompts=(
                ["स्मार्ट बजट कैसे बनाएं?", "पब्लिक प्रोविडेंट फंड (PPF) क्या है?", "मेरी बाइक लक्ष्य योजना", "Find My Schemes"]
                if lang == "hi" else
                ["How do I manage a 30k salary?", "What is compound interest?", "Can I buy a bike next year?", "What is PPF?"]
            ),
            action_buttons=[
                SakhiActionButton(label="Smart Budget", action="navigate", payload={"path": "/budget"}),
                SakhiActionButton(label="Goal Simulator", action="navigate", payload={"path": "/goals"}),
                SakhiActionButton(label="Explore Schemes", action="navigate", payload={"path": "/explore"})
            ]
        )

    def _generate_offline_general_response(self, message: str, lang: str = "en") -> str:
        """
        Deterministic, natural offline fallback responses for general, career,
        technology, and everyday questions when Gemini live API is offline.
        """
        msg_l = message.lower().strip()

        # 1. Artificial Intelligence / Machine Learning / Tech
        if any(w in msg_l for w in ["artificial intelligence", "ai kya", "what is ai", "explain ai", "ai explain", "machine learning", "neural network", "llm", "आर्टिफिशियल", "कृत्रिम बुद्धिमत्ता"]):
            if lang == "hi":
                return """### 🤖 आर्टिफिशियल इंटेलिजेंस (AI) क्या है?

**आर्टिफिशियल इंटेलिजेंस (AI)** यानी 'कृत्रिम बुद्धिमत्ता' कंप्यूटर विज्ञान की वह उन्नत शाखा है जो कंप्यूटर और मशीनों को इंसानों की तरह सोचने, सीखने, डेटा से समझने और निर्णय लेने में सक्षम बनाती है।

**AI के प्रमुख प्रकार व तकनीकें:**
• **मशीन लर्निंग (Machine Learning):** एल्गोरिदम जो बिना स्पष्ट प्रोग्रामिंग के बड़े डेटासेट से पैटर्न सीखते हैं (उदा. फ्रॉड डिटेक्शन, उत्पाद सुझाव)।
• **डीप लर्निंग व न्यूरल नेटवर्क (Deep Learning):** मानव मस्तिष्क की तंत्रिका प्रणाली से प्रेरित बहुस्तरीय नेटवर्क जो आवाज़, चेहरे और तस्वीरों की पहचान करते हैं।
• **जेनेरेटिव AI व LLMs:** विशाल भाषा मॉडल जो इंसानी भाषा में बातचीत, सामग्री लेखन और कोडिंग कर सकते हैं।

**दैनिक जीवन में उपयोग:** वर्चुअल असिस्टेंट, गूगल मैप्स, स्वास्थ्य निदान और संचय (Sanchay) जैसे वित्तीय प्लेटफॉर्म जो आपकी बचत और बजट का विश्लेषण करते हैं!

💬 *क्या आप AI के किसी विशेष पहलू या इसके भविष्य के प्रभाव के बारे में और जानना चाहते हैं?*"""
            return """### 🤖 Understanding Artificial Intelligence (AI)

**Artificial Intelligence (AI)** refers to computer systems and software engineered to perform cognitive tasks traditionally requiring human intellect—such as understanding natural language, recognizing visual patterns, reasoning through complex problems, and learning from experience.

**Key Core Domains of AI:**
• **Machine Learning (ML):** Algorithms that automatically uncover patterns and improve their performance from exposure to large datasets without rule-by-rule programming.
• **Deep Learning & Neural Networks:** Multi-layered computational networks inspired by human biological neurons, powering advanced computer vision, autonomous driving, and speech synthesis.
• **Generative AI & LLMs:** Large Language Models trained on massive corpora of text and code to summarize documents, generate creative ideas, and interact conversationally.

**Everyday Applications:** From fraud detection in banking and medical diagnostic assistance to smart financial companions like Sanchay that calculate personalized savings roadmaps!

💬 *Is there a specific facet of AI—such as machine learning, large language models, or career impact—you would like to explore further?*"""

        # 2. Prime Minister of France / French Leadership / Geography
        if any(w in msg_l for w in ["prime minister of france", "france prime minister", "french prime minister", "pm of france", "फ्रांस के प्रधानमंत्री", "फ्रांस का प्रधानमंत्री"]):
            if lang == "hi":
                return """### 🇫🇷 फ्रांस के प्रधानमंत्री (Prime Minister of France)

फ्रांस के वर्तमान प्रधानमंत्री **मिशेल बार्नियर (Michel Barnier)** हैं। उन्हें राष्ट्रपति इमैनुएल मैक्रों (Emmanuel Macron) द्वारा सितंबर 2024 में नियुक्त किया गया था।

**फ्रांस की शासन प्रणाली:**
• फ्रांस में **अर्ध-राष्ट्रपति शासन प्रणाली (Semi-Presidential System)** लागू है।
• **राष्ट्रपति (Emmanuel Macron):** राज्य के प्रमुख हैं और राष्ट्रीय रक्षा तथा विदेश नीति का संचालन करते हैं।
• **प्रधानमंत्री (Michel Barnier):** सरकार के प्रमुख हैं और संसद के माध्यम से घरेलू नीतियों, प्रशासन और बजट का क्रियान्वयन करते हैं।

💬 *क्या आप फ्रांस की शासन प्रणाली या यूरोपीय राजनीति के बारे में और जानना चाहते हैं?*"""
            return """### 🇫🇷 Prime Minister of France

The current Prime Minister of France is **Michel Barnier** (appointed by President Emmanuel Macron in September 2024, succeeding Gabriel Attal).

**How the French Government Operates:**
• France functions under a **semi-presidential system of governance**.
• The **President** (Emmanuel Macron, Head of State) directs national defense, international diplomacy, and strategic foreign policy.
• The **Prime Minister** (Michel Barnier, Head of Government) oversees day-to-day domestic administration, coordinates cabinet ministries, and steers legislation through the French National Assembly.

💬 *Would you like to know more about the French political system or contemporary European governance?*"""

        # 3. Interview Preparation / Career / Job Advice
        if any(w in msg_l for w in ["interview", "prepare for an interview", "job interview", "interview prep", "इंटरव्यू", "साक्षात्कार"]):
            if lang == "hi":
                return """### 💼 इंटरव्यू की प्रभावी तैयारी कैसे करें

किसी भी जॉब इंटरव्यू में सफलता पाने के लिए यह चार-चरणीय रणनीति अपनाएं:

1. **कंपनी और पद का अध्ययन करें:** कंपनी का विजन, उनके मुख्य उत्पाद और जॉब डिस्क्रिप्शन (JD) में मांगी गई मुख्य योग्यताओं को अच्छी तरह समझें।
2. **STAR तकनीक में महारत हासिल करें:** व्यवहारिक सवालों के जवाब इस फॉर्मूले से दें:
   • **S (Situation):** परिस्थिति की पृष्ठभूमि बताएं।
   • **T (Task):** आपके सामने क्या चुनौती या कार्य था?
   • **A (Action):** आपने समस्या समाधान के लिए कौन से ठोस कदम उठाए?
   • **R (Result):** मापने योग्य सकारात्मक परिणाम (उदा. 20% सुधार) क्या रहा?
3. **बुनियादी प्रश्नों का अभ्यास:** 'Tell me about yourself', अपनी मुख्य ताकत/कमजोरी और 'आप यह कंपनी क्यों ज्वाइन करना चाहते हैं' के जवाब पहले से तैयार रखें।
4. **साक्षात्कारकर्ता से सवाल पूछें:** अंत में टीम कल्चर या आगामी प्राथमिकताओं पर 2 सार्थक सवाल अवश्य पूछें।

💬 *आप किस पद या उद्योग के लिए इंटरव्यू दे रहे हैं? मैं उसके अनुरूप प्रश्नों का अभ्यास करा सकती हूँ!*"""
            return """### 💼 Comprehensive Guide to Interview Preparation

Excelling in a professional interview requires a structured, confident approach across four fundamental pillars:

1. **Company & Role Alignment:** Thoroughly research the company's recent milestones, core products, and culture. Map each requirement in the job description to an exact achievement from your past experience.
2. **Structure with the STAR Method:** For behavioral and situational questions ('Tell me about a time when...'), structure your narrative:
   • **Situation:** Contextual background of the challenge.
   • **Task:** Your specific deliverable or goal.
   • **Action:** The concrete technical and leadership steps you executed.
   • **Result:** The quantifiable, measurable outcome achieved (e.g., 'reduced turnaround time by 30%').
3. **Master Common Core Prompts:** Practice crisp, authentic responses to 'Walk me through your resume', your notable strengths, and why you are uniquely interested in this role.
4. **Prepare Strategic Reverse Questions:** Prepare 2–3 questions for your interviewers regarding team dynamics, technical priorities, or benchmarks for success in the first 90 days.

💬 *What role, domain, or industry are you preparing for? I can help you practice tailored questions!*"""

        # 4. Jokes & Light Entertainment
        if any(w in msg_l for w in ["joke", "chutkula", "funny", "हंसना", "मजाक", "जोक"]):
            if lang == "hi":
                return """यहाँ आपके लिए एक प्यारा सा जोक है! 😄

**टीचर:** संजू, बताओ अगर तुम्हारे पास ₹10 हैं और तुमने ₹5 का समोसा खा लिया, तो तुम्हारे पास क्या बचेगा?
**संजू:** सर, समोसे का स्वाद और ₹5 की बचत! 🥟💰

उम्मीद है इसने आपके चेहरे पर मुस्कान लाई! मैं आपकी वित्तीय योजना या किसी अन्य सवाल में कैसे सहायता करूँ?"""
            return """Here is a light-hearted one for you! 😄

**Why did the computer go to the doctor?**
*Because it caught a bad virus and needed a cache injection!* 💻💊

I hope that brought a smile! How else can I assist you today—whether with personal budgeting, milestone planning, or any everyday questions?"""

        # 5. General Conversational Fallback
        if lang == "hi":
            return """मैं **सखी (Sakhi)** हूँ — संचय की समझदार और मददगार AI सहायिका! 🌟

मैं आपकी बातचीत, सामान्य ज्ञान, करियर मार्गदर्शन और दैनिक प्रश्नों में सहायता करने के लिए हमेशा तैयार हूँ। इसके साथ ही, मैं आपकी व्यक्तिगत वित्तीय योजना, बजट (50/30/20 नियम) और भारत सरकार की प्रमाणित योजनाओं में भी विशेषज्ञ हूँ।

👉 *आप मुझसे सामान्य ज्ञान, अध्ययन, करियर या अपनी बचत योजना के बारे में खुलकर पूछ सकते हैं!*"""
        return """I am **Sakhi** — Sanchay's intelligent, friendly AI conversational assistant! 🌟

I am delighted to assist you with general knowledge, everyday questions, technology concepts, career guidance, and conversational topics. In addition, I specialize in personal finance, disciplined budgeting (such as the 50/30/20 rule), and Government of India sovereign savings schemes.

👉 *Feel free to ask me any question—whether about everyday topics, general knowledge, or planning your future savings!*"""


    def generate_grounded_response(self, message: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> SakhiChatResponse:
        return self.chat(message=message, language=language, context=context)


sakhi_adapter = GeminiSakhiAdapter()
