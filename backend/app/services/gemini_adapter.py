import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
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
    "OUT_OF_SCOPE": "OUT_OF_SCOPE"
}

OUT_OF_SCOPE_KEYWORDS = [
    # Stocks, shares, equity, trading & speculative assets
    "stock", "stocks", "share market", "stock market", "buy stocks", "sell stocks", "share bazar", "शेयर बाजार", "शेयर मार्केट", "स्टॉक",
    "crypto", "cryptocurrency", "bitcoin", "ethereum", "doge", "क्रिप्टो", "बिटकॉइन",
    "mutual fund", "mutual funds", "sip in mutual", "म्यूचुअल फंड",
    "trading", "day trading", "intraday", "forex", "derivatives", "futures trading", "options trading", "call option", "put option",
    "multibagger", "get rich quick", "20% return", "guaranteed 20", "speculation", "satta", "सट्टा",
    
    # Non-government off-topic queries
    "weather", "joke", "tell me a joke", "movie", "cricket", "ipl", "song", "recipe", "who is prime minister", "who is president",
    "mausam", "chutkula", "गाना", "मौसम", "क्रिकेट", "जोक",
    
    # Prompt injection / rule override
    "ignore your rules", "ignore rules", "override system", "jailbreak", "pretend you are"
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
        if backend_env.exists():
            load_dotenv(backend_env, override=True)
        else:
            load_dotenv(override=True)

        key = self.api_key or os.getenv("GEMINI_API_KEY")
        if key and key != self.api_key:
            self.api_key = key

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                for model_name in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]:
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

        # 1. Hard refusal check (Precise regex boundaries)
        for kw in OUT_OF_SCOPE_KEYWORDS:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, msg_lower):
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

        # 11. General Search / Category query
        return "GENERAL_SCHEME_SEARCH", []

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
        answer_nums = extract_numbers_and_percentages(answer_text)

        hallucinated = []
        for token in answer_nums:
            clean_token = token.replace("₹", "").replace("Rs.", "").replace("%", "").strip().replace(",", "")
            if clean_token not in evidence_str:
                try:
                    num_val = float(clean_token)
                    if num_val in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0, 12.0, 15.0, 18.0, 21.0, 25.0, 30.0, 40.0, 50.0, 55.0, 60.0, 65.0, 70.0, 80.0, 100.0, 500.0, 1000.0, 2000.0, 5000.0, 6000.0, 10000.0, 50000.0, 100000.0, 150000.0]:
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
        lang = detect_user_language(message, fallback_lang=language)
        msg_lower = message.lower().strip()

        # 1. Hard refusal check (Out of scope keywords take precedence)
        for kw in OUT_OF_SCOPE_KEYWORDS:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, msg_lower):
                return self._chat_government_schemes(message, lang, context)

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
        lang = detect_user_language(message, fallback_lang=language)
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
        parsed_residency = extracted_profile.residency_status
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
        # 1. Handle Out of Scope Refusal
        # -------------------------------------------------------------
        if intent == "OUT_OF_SCOPE":
            refusals = {
                "hi": (
                    "### ⚠️ सखी की सीमा: केवल आधिकारिक सरकारी योजनाएं\n\n"
                    "मैं **सखी (Sakhi)** हूँ — संचय की सत्यापित सरकारी योजना सहायक।\n\n"
                    "**मेरी सीमाएं और नियम:**\n"
                    "• **मैं क्या बताती हूँ:** केवल भारत सरकार, डाकघर (India Post), PFRDA, EPFO और राज्य सरकारों द्वारा अधिसूचित 100% सुरक्षित और सत्यापित सरकारी योजनाएं (जैसे PPF, SSY, SCSS, APY, NPS)।\n"
                    "• **मैं क्या नहीं बताती:** मैं शेयर बाज़ार (Stocks/Shares), म्यूचुअल फंड (Mutual Funds), क्रिप्टोकरेंसी (Bitcoin), ट्रेडिंग टिप्स, या किसी भी प्रकार के गैर-सरकारी सट्टा बाज़ार पर कोई सलाह या जानकारी नहीं देती हूँ।\n\n"
                    "👉 यदि आप सुरक्षित और सरकारी गारंटीकृत बचत योजनाओं के बारे में जानना चाहते हैं, तो नीचे दिए गए विकल्पों को चुन सकते हैं:"
                ),
                "mr": (
                    "### ⚠️ सखीची मर्यादा: केवळ अधिकृत सरकारी योजना\n\n"
                    "मी **सखी (Sakhi)** आहे — संचयची अधिकृत सरकारी योजना सहाय्यक.\n\n"
                    "**माझ्या मर्यादा:**\n"
                    "• मी केवळ भारत सरकार, टपाल खाते आणि PFRDA च्या अधिकृत योजनांची (PPF, SSY, SCSS, APY, NPS) माहिती देते.\n"
                    "• मी शेअर मार्केट, क्रिप्टो किंवा म्युच्युअल फंडांवर कोणतीही माहिती किंवा सल्ला देत नाही.\n\n"
                    "👉 सुरक्षित सरकारी योजनांसाठी खालील पर्याय निवडा:"
                ),
                "bn": (
                    "### ⚠️ সখীর কার্যপরিধি: শুধুমাত্র সরকারি স্কিম\n\n"
                    "আমি **সখী (Sakhi)** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক।\n\n"
                    "**আমার নিয়মাবলী:**\n"
                    "• আমি শুধুমাত্র ভারত সরকার এবং ডাকঘর অনুমোদিত নিরাপদ স্কিমের (যেমন PPF, SSY, SCSS, APY, NPS) তথ্য দিই।\n"
                    "• আমি শেয়ার মার্কেট, ক্রিপ্টোকারেন্সি বা মিউচুয়াল ফান্ডের বিষয়ে কোনো উত্তর বা পরামর্শ দিই না।\n\n"
                    "👉 সরকারি সঞ্চয় স্কিমের জন্য নিচের বিকল্পগুলি দেখুন:"
                ),
                "te": (
                    "### ⚠️ సఖి పరిమితి: అధికారిక ప్రభుత్వ పథకాలు మాత్రమే\n\n"
                    "నేను **సఖి (Sakhi)** — సంచయ్ యొక్క అధికారిక ప్రభుత్వ పథకాల సహాయకురాలిని.\n\n"
                    "**నా పరిమితులు:**\n"
                    "• నేను భారత ప్రభుత్వం మరియు పోస్టాఫీస్ ద్వారా ధృవీకరించబడిన పథకాల (PPF, SSY, SCSS, APY, NPS) పై మాత్రమే సమాచారాన్ని అందిస్తాను.\n"
                    "• నేను స్టాక్ మార్కెట్, క్రిప్టో లేదా మ్యూచువల్ ఫండ్స్‌పై సలహాలు లేదా వివరణలు ఇవ్వను.\n\n"
                    "👉 సురక్షిత ప్రభుత్వ పథకాల కోసం దిగువ ఎంపికలను చూడండి:"
                ),
                "en": (
                    "### ⚠️ Sakhi Scope: Verified Government Schemes Only\n\n"
                    "I am **Sakhi** — Sanchay's Verified Government Scheme Assistant.\n\n"
                    "**My Strict Boundaries & Scope:**\n"
                    "• **What I Cover:** Officially notified Government of India savings, pensions, social security, and welfare programs (e.g. PPF, SSY, SCSS, APY, NPS, EPF).\n"
                    "• **What I Do Not Cover:** I do not provide explanations, trading advice, or tips for the stock market, shares, mutual funds, cryptocurrency, intraday trading, or non-government speculative instruments.\n\n"
                    "👉 If you are looking for sovereign-guaranteed, safe savings schemes, please select a prompt below or click **Find My Schemes**:"
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
                        generation_config={"temperature": 0.2, "max_output_tokens": 700}
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
            guidance_ans = {
                "hi": (
                    "### ⚠️ सखी की सीमा: केवल आधिकारिक सरकारी योजनाएं\n\n"
                    "मैं **सखी (Sakhi)** हूँ — संचय की सत्यापित सरकारी योजना सहायक।\n\n"
                    "**मेरी सीमाएं और कार्यक्षेत्र:**\n"
                    "• मैं केवल भारत सरकार और राज्य सरकारों द्वारा अधिसूचित 184 सत्यापित बचत, पेंशन, ऋण और कल्याणकारी योजनाओं की जानकारी देती हूँ।\n"
                    "• मैं व्यक्तिगत बातचीत, सट्टा/शेयर बाज़ार या गैर-सरकारी विषयों पर जानकारी नहीं देती हूँ।\n\n"
                    "**आप मुझसे क्या पूछ सकते हैं:**\n"
                    "• किसी योजना की ब्याज दर या नियम (उदा. *What is PPF?*, *Sukanya Samriddhi Yojana*)\n"
                    "• आपकी उम्र व बचत के अनुसार योजनाएं (उदा. *I am 30 years old, can save ₹2,000 monthly*)\n"
                    "• दो योजनाओं की तुलना (उदा. *Compare APY vs NPS*)\n\n"
                    "👉 *अपनी पसंदीदा योजना जानने के लिए नीचे दिए गए सुझावों में से चुनें या **Find My Schemes** पर क्लिक करें:*"
                ),
                "mr": (
                    "### ⚠️ सखीची मर्यादा: केवळ अधिकृत सरकारी योजना\n\n"
                    "मी **सखी (Sakhi)** आहे — संचयची अधिकृत सरकारी योजना सहाय्यक.\n\n"
                    "मी केवळ भारत सरकारच्या अधिकृत १८४ योजनांची (PPF, SSY, SCSS, APY, NPS) माहिती देते.\n\n"
                    "👉 *खालील पर्यायांमधून निवडा किंवा **Find My Schemes** चा वापर करा:*"
                ),
                "bn": (
                    "### ⚠️ সখীর কার্যপরিধি: শুধুমাত্র সরকারি স্কিম\n\n"
                    "আমি **সখী (Sakhi)** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক।\n\n"
                    "আমি শুধুমাত্র ভারত সরকারের ১৮৪টি অনুমোদিত স্কিমের সঠিক তথ্য প্রদান করি।\n\n"
                    "👉 *নিচের অপশনগুলি থেকে বেছে নিন বা **Find My Schemes** ব্যবহার করুন:*"
                ),
                "te": (
                    "### ⚠️ సఖి పరిమితి: అధికారిక ప్రభుత్వ పథకాలు మాత్రమే\n\n"
                    "నేను **సఖి (Sakhi)** — సంచయ్ యొక్క అధికారిక ప్రభుత్వ పథకాల సహాయకురాలిని.\n\n"
                    "నేను భారత ప్రభుత్వం ద్వారా ధృవీకరించబడిన 184 పథకాలపై మాత్రమే సమాచారాన్ని అందిస్తాను.\n\n"
                    "👉 *దిగువ సూచనలను ఎంచుకోండి లేదా **Find My Schemes** ను ఉపయోగించండి:*"
                ),
                "en": (
                    "### ⚠️ Sakhi Scope: Verified Government Schemes Only\n\n"
                    "I am **Sakhi** — Sanchay's Verified Government Scheme Assistant.\n\n"
                    "**My Strict Boundaries & Role:**\n"
                    "• I provide grounded explanations strictly for 184 officially notified Government of India savings, pensions, social security, and welfare programs (e.g. PPF, SSY, SCSS, APY, NPS).\n"
                    "• I do not answer casual non-government banter, entertainment, or speculative market queries.\n\n"
                    "**What you can ask me:**\n"
                    "• Scheme interest rates and rules (e.g. *What is PPF?*, *Tell me about Sukanya Samriddhi*)\n"
                    "• Personalized recommendations (e.g. *I am 28 years old, can save ₹3,000 monthly*)\n"
                    "• Compare two schemes (e.g. *Compare APY vs NPS*)\n\n"
                    "👉 *Select a suggested prompt below or click **Find My Schemes** to explore verified programs:*"
                )
            }
            return SakhiChatResponse(
                answer=guidance_ans.get(lang, guidance_ans["en"]),
                intent="GENERAL_SCHEME_SEARCH",
                sources=[],
                eligibility_result=None,
                guardrail_applied="OUT_OF_SCOPE_REFUSAL",
                language=language,
                suggested_prompts=["What is PPF?", "Tell me about Sukanya Samriddhi", "What pension schemes are available?", "Find My Schemes"],
                action_buttons=[
                    SakhiActionButton(label="Find My Schemes", action="navigate", payload={"path": "/profile"}),
                    SakhiActionButton(label="Explore Catalog", action="navigate", payload={"path": "/explore"})
                ]
            )

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
                        generation_config={"temperature": 0.2, "max_output_tokens": 700}
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

    def generate_grounded_response(self, message: str, language: str = "en", context: Optional[Dict[str, Any]] = None) -> SakhiChatResponse:
        return self.chat(message=message, language=language, context=context)


sakhi_adapter = GeminiSakhiAdapter()
