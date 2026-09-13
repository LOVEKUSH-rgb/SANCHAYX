import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class ExtractedProfile:
    age: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    annual_family_income: Optional[float] = None
    occupation: Optional[str] = None  # e.g. "job_seeker", "farmer", "student", "salaried", "business", "homemaker", "retired", "unorganized", "widow"
    occupation_label: str = "General Citizen"
    gender: Optional[str] = None  # "male", "female"
    child_age: Optional[int] = None
    child_gender: Optional[str] = None
    saving_for: str = "self"
    goal: Optional[str] = None
    goal_label: Optional[str] = None
    monthly_budget: Optional[float] = None
    horizon_years: int = 10
    is_widow: bool = False
    is_disabled: bool = False
    is_retired: bool = False
    caste: Optional[str] = None
    rural_urban: Optional[str] = None  # "rural", "urban"
    marital_status: Optional[str] = None
    residency_status: str = "resident"
    # Provenance tracking: maps each field to "USER_EXPLICIT" or "EXISTING_AUTH_PROFILE" or "UNSPECIFIED"
    provenance: Dict[str, str] = field(default_factory=dict)


# Common Indian states and major cities mapping (English, Hindi, Bengali, Telugu, Marathi forms)
INDIAN_STATES_MAP = {
    # Rajasthan
    "rajasthan": "Rajasthan", "राजस्थान": "Rajasthan", "राजस्थानी": "Rajasthan", "రాజస్థాన్": "Rajasthan", "রাজস্থান": "Rajasthan",
    "jaipur": "Rajasthan", "जयपुर": "Rajasthan", "జైపూర్": "Rajasthan", "জয়পুর": "Rajasthan",
    "jodhpur": "Rajasthan", "जोधपुर": "Rajasthan", "udaipur": "Rajasthan", "उदयपुर": "Rajasthan",
    "kota": "Rajasthan", "कोटा": "Rajasthan", "bikaner": "Rajasthan", "बीकानेर": "Rajasthan", "ajmer": "Rajasthan", "अजमेर": "Rajasthan",

    # Maharashtra
    "maharashtra": "Maharashtra", "महाराष्ट्र": "Maharashtra", "महाराष्ट्रीयन": "Maharashtra", "మహారాష్ట్ర": "Maharashtra", "মহারাষ্ট্র": "Maharashtra",
    "mumbai": "Maharashtra", "मुंबई": "Maharashtra", "बॉम्बे": "Maharashtra", "बंबई": "Maharashtra", "ముంబై": "Maharashtra", "মুম্বই": "Maharashtra",
    "pune": "Maharashtra", "पुणे": "Maharashtra", "nagpur": "Maharashtra", "नागपुर": "Maharashtra",
    "nashik": "Maharashtra", "नासिक": "Maharashtra", "thane": "Maharashtra", "ठाणे": "Maharashtra",
    "aurangabad": "Maharashtra", "औरंगाबाद": "Maharashtra", "chhatrapati sambhajinagar": "Maharashtra",

    # Delhi / NCR
    "delhi": "Delhi", "दिल्ली": "Delhi", "नई दिल्ली": "Delhi", "new delhi": "Delhi", "দিল্লি": "Delhi", "ఢిల్లీ": "Delhi",

    # Uttar Pradesh
    "uttar pradesh": "Uttar Pradesh", "उत्तर प्रदेश": "Uttar Pradesh", "यूपी": "Uttar Pradesh", "up": "Uttar Pradesh", "ఉత్తరప్రదేశ్": "Uttar Pradesh", "উত্তরপ্রদেশ": "Uttar Pradesh",
    "lucknow": "Uttar Pradesh", "लखनऊ": "Uttar Pradesh", "kanpur": "Uttar Pradesh", "कानपुर": "Uttar Pradesh",
    "varanasi": "Uttar Pradesh", "वाराणसी": "Uttar Pradesh", "kashi": "Uttar Pradesh", "काशी": "Uttar Pradesh", "banaras": "Uttar Pradesh", "बनारस": "Uttar Pradesh",
    "prayagraj": "Uttar Pradesh", "प्रयागराज": "Uttar Pradesh", "allahabad": "Uttar Pradesh", "इलाहाबाद": "Uttar Pradesh",
    "noida": "Uttar Pradesh", "नोएडा": "Uttar Pradesh", "greater noida": "Uttar Pradesh", "ghaziabad": "Uttar Pradesh", "गाजियाबाद": "Uttar Pradesh",
    "agra": "Uttar Pradesh", "आगरा": "Uttar Pradesh", "meerut": "Uttar Pradesh", "मेरठ": "Uttar Pradesh",

    # Bihar
    "bihar": "Bihar", "बिहार": "Bihar", "बिहारी": "Bihar", "బీహార్": "Bihar", "বিহার": "Bihar",
    "patna": "Bihar", "पटना": "Bihar", "gaya": "Bihar", "गया": "Bihar", "muzaffarpur": "Bihar", "मुजफ्फरपुर": "Bihar", "bhagalpur": "Bihar", "भागलपुर": "Bihar",

    # Madhya Pradesh
    "madhya pradesh": "Madhya Pradesh", "मध्य प्रदेश": "Madhya Pradesh", "एमपी": "Madhya Pradesh", "mp": "Madhya Pradesh", "మధ్యప్రదేశ్": "Madhya Pradesh", "মধ্যপ্রদেশ": "Madhya Pradesh",
    "bhopal": "Madhya Pradesh", "भोपाल": "Madhya Pradesh", "indore": "Madhya Pradesh", "इंदौर": "Madhya Pradesh",
    "gwalior": "Madhya Pradesh", "ग्वालियर": "Madhya Pradesh", "jabalpur": "Madhya Pradesh", "जबलपुर": "Madhya Pradesh", "ujjain": "Madhya Pradesh", "उज्जैन": "Madhya Pradesh",

    # Gujarat
    "gujarat": "Gujarat", "गुजरात": "Gujarat", "गुजराती": "Gujarat", "గుజరాత్": "Gujarat", "গুজরাট": "Gujarat",
    "ahmedabad": "Gujarat", "अहमदाबाद": "Gujarat", "surat": "Gujarat", "सूरत": "Gujarat",
    "vadodara": "Gujarat", "वडोदरा": "Gujarat", "rajkot": "Gujarat", "राजकोट": "Gujarat",

    # Haryana
    "haryana": "Haryana", "हरियाणा": "Haryana", "हरियाणवी": "Haryana", "హర్యానా": "Haryana",
    "gurgaon": "Haryana", "gurugram": "Haryana", "गुड़गांव": "Haryana", "गुरुग्राम": "Haryana", "faridabad": "Haryana", "फरीदाबाद": "Haryana",

    # Punjab
    "punjab": "Punjab", "पंजाब": "Punjab", "पंजाबी": "Punjab", "పంజాబ్": "Punjab", "পাঞ্জাব": "Punjab",
    "chandigarh": "Punjab", "चंडीगढ़": "Punjab", "ludhiana": "Punjab", "लुधियाना": "Punjab",
    "amritsar": "Punjab", "अमृतसर": "Punjab", "jalandhar": "Punjab", "जालंधर": "Punjab",

    # Karnataka
    "karnataka": "Karnataka", "कर्नाटक": "Karnataka", "కర్ణాటక": "Karnataka", "কর্ণাটক": "Karnataka",
    "bangalore": "Karnataka", "bengaluru": "Karnataka", "बैंगलोर": "Karnataka", "बेंगलुरु": "Karnataka", "బెంగళూరు": "Karnataka",
    "mysore": "Karnataka", "mysuru": "Karnataka", "मैसूर": "Karnataka", "hubli": "Karnataka", "हुबली": "Karnataka", "mangalore": "Karnataka", "मंगलौर": "Karnataka",

    # Tamil Nadu
    "tamil nadu": "Tamil Nadu", "तमिलनाडु": "Tamil Nadu", "तमिल नाडु": "Tamil Nadu", "తమిళనాడు": "Tamil Nadu", "তামিলনাড়ু": "Tamil Nadu",
    "chennai": "Tamil Nadu", "चेन्नई": "Tamil Nadu", "मद्रास": "Tamil Nadu", "madras": "Tamil Nadu", "చెన్నై": "Tamil Nadu",
    "coimbatore": "Tamil Nadu", "कोयंबटूर": "Tamil Nadu", "madurai": "Tamil Nadu", "मदुरै": "Tamil Nadu",

    # West Bengal
    "west bengal": "West Bengal", "पश्चिम बंगाल": "West Bengal", "পশ্চিমবঙ্গ": "West Bengal", "बंगाल": "West Bengal", "పశ్చిమ బెంగాల్": "West Bengal",
    "kolkata": "West Bengal", "कोलकाता": "West Bengal", "কলকাতা": "West Bengal", "calcutta": "West Bengal", "कलकत्ता": "West Bengal",
    "howrah": "West Bengal", "हावड़ा": "West Bengal", "হাওড়া": "West Bengal", "siliguri": "West Bengal", "শিলিগুড়ি": "West Bengal", "durgapur": "West Bengal", "দুর্গাপুর": "West Bengal",

    # Telangana
    "telangana": "Telangana", "तेलंगाना": "Telangana", "తెలంగాణ": "Telangana", "তেলেঙ্গানা": "Telangana",
    "hyderabad": "Telangana", "हैदराबाद": "Telangana", "హైదరాబాద్": "Telangana", "হায়দরাবাদ": "Telangana",
    "secunderabad": "Telangana", "सिकंदराबाद": "Telangana", "warangal": "Telangana", "वारंगल": "Telangana", "వరంగల్": "Telangana",
    "nizamabad": "Telangana", "निजामाबाद": "Telangana", "karimnagar": "Telangana", "करीमनगर": "Telangana",

    # Andhra Pradesh
    "andhra pradesh": "Andhra Pradesh", "आंध्र प्रदेश": "Andhra Pradesh", "ఆంధ్రప్రదేశ్": "Andhra Pradesh", "অন্ধ্রপ্রদেশ": "Andhra Pradesh",
    "visakhapatnam": "Andhra Pradesh", "vizag": "Andhra Pradesh", "विशाखापट्टनम": "Andhra Pradesh", "విశాఖపట్నం": "Andhra Pradesh",
    "vijayawada": "Andhra Pradesh", "विजयवाड़ा": "Andhra Pradesh", "విజయవాడ": "Andhra Pradesh", "guntur": "Andhra Pradesh", "గుంటూరు": "Andhra Pradesh",
    "tirupati": "Andhra Pradesh", "तिरुपति": "Andhra Pradesh", "తిరుపతి": "Andhra Pradesh",

    # Kerala
    "kerala": "Kerala", "केरल": "Kerala", "కేరళ": "Kerala", "কেরালা": "Kerala",
    "kochi": "Kerala", "कोच्चि": "Kerala", "thiruvananthapuram": "Kerala", "तिरुवनंतपुरम": "Kerala", "trivandrum": "Kerala",

    # Assam
    "assam": "Assam", "असम": "Assam", "অসম": "Assam", "guwahati": "Assam", "गुवाहाटी": "Assam",

    # Odisha
    "odisha": "Odisha", "ओडिशा": "Odisha", "उड़ीसा": "Odisha", "ଓଡ଼ିଶା": "Odisha",
    "bhubaneswar": "Odisha", "भुवनेश्वर": "Odisha", "cuttack": "Odisha", "कटक": "Odisha",

    # Jharkhand
    "jharkhand": "Jharkhand", "झारखंड": "Jharkhand", "ranchi": "Jharkhand", "राँची": "Jharkhand", "रांची": "Jharkhand", "jamshedpur": "Jharkhand", "जमशेदपुर": "Jharkhand",

    # Chhattisgarh
    "chhattisgarh": "Chhattisgarh", "छत्तीसगढ़": "Chhattisgarh", "raipur": "Chhattisgarh", "रायपुर": "Chhattisgarh",

    # Uttarakhand
    "uttarakhand": "Uttarakhand", "उत्तराखंड": "Uttarakhand", "dehradun": "Uttarakhand", "देहरादून": "Uttarakhand", "haridwar": "Uttarakhand", "हरिद्वार": "Uttarakhand",

    # Himachal Pradesh
    "himachal pradesh": "Himachal Pradesh", "हिमाचल प्रदेश": "Himachal Pradesh", "हिमाचल": "Himachal Pradesh", "shimla": "Himachal Pradesh", "शिमला": "Himachal Pradesh",

    # Goa
    "goa": "Goa", "गोवा": "Goa"
}

# Negation patterns for occupations
FARMER_NEGATION_REGEX = re.compile(
    r'\b(?:किसान\s+(?:नहीं|नाही|নই|కాదు|nahi|nhi)|not\s+a?\s*farmer|not\s+in\s+agriculture|खेती\s+(?:नहीं|नाही|nahi|nhi)|no\s+farming|farmer\s+(?:nahi|nhi|not)|kisan\s+(?:nahi|nhi))\b',
    re.IGNORECASE
)

STUDENT_NEGATION_REGEX = re.compile(
    r'\b(?:विद्यार्थी\s+(?:नहीं|नाही|nahi)|छात्र\s+(?:नहीं|nahi)|not\s+a?\s*student|student\s+(?:nahi|nhi))\b',
    re.IGNORECASE
)

SALARIED_NEGATION_REGEX = re.compile(
    r'\b(?:नौकरी\s+(?:नहीं|nahi|nhi)|job\s+(?:nahi|nhi)|not\s+working|not\s+salaried)\b',
    re.IGNORECASE
)


def extract_age_from_text(text: str) -> Optional[int]:
    """
    Extracts user age with strict accuracy from text.
    Ensures 24 is NOT converted to 25 and child ages are not confused with applicant age.
    """
    if not text:
        return None
    t = text.strip()

    # Avoid matching child age
    child_age_match = (
        re.search(r'\b(?:with\s+a|have\s+a|for\s+my|my)\s+(\d{1,2})\s*(?:-| )(?:year|yr)(?:s)?(?:-| )old\s+(?:daughter|girl|child|son|boy|kid)\b', t, re.I) or
        re.search(r'\b(\d{1,2})\s*(?:-| )(?:year|yr)(?:s)?(?:-| )old\s+(?:daughter|girl|child|son|boy|kid)\b', t, re.I) or
        re.search(r'\b(\d{1,2})\s*(?:saal|sal|year|yr|वर्ष|साल)\s*(?:ka|ki|ke)?\s*(?:bachche|bacche|child|daughter|son|beti|beta)\b', t, re.I) or
        re.search(r'\b(?:daughter|child|girl|son|kid|beti|beta)\s+(?:is|aged|of)\s+(\d{1,2})\b', t, re.I)
    )
    detected_child_age = int(child_age_match.group(1)) if child_age_match else None

    # Pattern 1: Number + year words (e.g. "24 साल का", "24 वर्ष", "24 years old")
    p1 = re.findall(r'(?:^|\D)(\d{1,3})\s*(?:साल|वर्ष|वर्षे|বছর|సంవత్సరాలు|years?\s+old|yrs?\s+old|saal|varsh)(?:$|\D)', t, re.I)
    for a_str in p1:
        val = int(a_str)
        if 0 < val <= 120 and val != detected_child_age:
            return val

    # Pattern 2: Age keywords + number (e.g. "उम्र 24", "मेरी उम्र 24 साल", "आयु 24", "वय 24", "age 24")
    p2 = re.findall(r'(?:मेरी\s+उम्र|मेरी\s+आयु|उम्र|आयु|माझे\s+वय|वय|আমার\s+বয়স|বয়স|నా\s+వయస్సు|వయస్సు|my\s+age\s+is|my\s+age|age)\s*(?:is|hai|hूँ|आहे|হলো|ఉంది|:|of|=)?\s*(\d{1,3})\b', t, re.I)
    for a_str in p2:
        val = int(a_str)
        if 0 < val <= 120 and val != detected_child_age:
            return val

    # Pattern 3: Pronoun + number + unit/postposition (e.g. "मैं 24 साल का", "मैं 24 का हूं", "I am 24")
    p3 = re.findall(r'(?:^|\s)(?:मैं|i\s+am|i\'m|myself)\s*(\d{1,3})\s*(?:साल|वर्ष|years?)?(?:\s*(?:का|की|के|old|हूँ))?(?:$|\s|[,\.])', t, re.I)
    for a_str in p3:
        val = int(a_str)
        if 0 < val <= 120 and val != detected_child_age:
            return val

    return None


def extract_child_age_from_text(text: str) -> Optional[int]:
    """Extracts child/dependent age if explicitly specified."""
    if not text:
        return None
    child_m = (
        re.search(r'\b(?:with\s+a|have\s+a|for\s+my|my)\s+(\d{1,2})\s*(?:-| )(?:year|yr)(?:s)?(?:-| )old\s+(?:daughter|girl|child|son|boy|kid)\b', text, re.I) or
        re.search(r'\b(\d{1,2})\s*(?:-| )(?:year|yr)(?:s)?(?:-| )old\s+(?:daughter|girl|child|son|boy|kid)\b', text, re.I) or
        re.search(r'\b(\d{1,2})\s*(?:saal|sal|year|yr|वर्ष|साल)\s*(?:ka|ki|ke)?\s*(?:bachche|bacche|child|daughter|son|beti|beta)\b', text, re.I) or
        re.search(r'\b(?:daughter|child|girl|son|kid|beti|beta)\s+(?:is|aged|of)\s+(\d{1,2})\b', text, re.I) or
        re.search(r'\b(?:child_age|daughter_age|child\s+age)\s*[:=]?\s*(\d{1,2})\b', text, re.I)
    )
    if child_m:
        try:
            return int(child_m.group(1))
        except ValueError:
            pass
    return None


def extract_state_from_text(text: str) -> Optional[str]:
    """Extracts state residency explicitly stated by the user."""
    if not text:
        return None
    t_lower = text.lower()
    for kw, state_name in INDIAN_STATES_MAP.items():
        pattern = r'(?:^|\b|\s)' + re.escape(kw) + r'(?:\b|\s|$|[,\.])'
        if re.search(pattern, t_lower) or (len(kw) >= 4 and kw in t_lower):
            return state_name
    return None


def extract_district_from_text(text: str) -> Optional[str]:
    """Extracts explicit district name if provided."""
    if not text:
        return None
    m = re.search(r'(?:district|ज़िला|जिला|जिल्हा|জেলা|జిల్లా)\s*[:=]?\s*([a-zA-Z\u0900-\u097F\u0980-\u09FF\u0C00-\u0C7F]+)', text, re.IGNORECASE)
    if m:
        cand = m.group(1).strip()
        if cand.lower() not in ["mein", "me", "se", "ka", "ki", "ke", "hai", "is", "in", "from"]:
            return cand.title()
    return None


def extract_income_from_text(text: str) -> Optional[float]:
    """
    Extracts annual family income accurately from text.
    Handles '₹2.5 लाख' -> 250000.0, '2.5 lakh' -> 250000.0, '350000' -> 350000.0.
    """
    if not text:
        return None
    t_lower = text.lower()

    # Decimal / whole with lakh / thousand / crore
    m = (
        re.search(r'(?:सालाना\s+पारिवारिक\s+आय|वार्षिक\s+पारिवारिक\s+आय|सालाना\s+आय|वार्षिक\s+आय|पारिवारिक\s+आय|वार्षिक\s+उत्पन्न|वार्षिक\s+उपार্জন|వార్షిక\s+ఆదాయం|annual\s+family\s+income|annual\s+income|family\s+income|household\s+income|आय|कमाई|उत्पन्न|উপার্জন|ఆదాయం|income|salary|earning)\s*(?:is|of|hai|:|आहे|=)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(लाख|lakh|lac|lacs|हजार|thousand|k|crore|cr|লাখ|లక్ష|వేల)?', t_lower) or
        re.search(r'(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(लाख|lakh|lac|lacs|हजार|thousand|k|crore|cr|लाখ|లక్ష|వేల)', t_lower) or
        re.search(r'(\d+(?:\.\d+)?)\s*(लाख|lakh|lac|lacs)\s*(?:रुपये|की\s+आय|income|salary|वार्षिक|सालाना)?', t_lower) or
        re.search(r'(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d{4,9})', t_lower)
    )

    if m:
        try:
            num_str = m.group(1).replace(",", "")
            num = float(num_str)
            unit = m.group(2).lower() if len(m.groups()) >= 2 and m.group(2) else ""

            if any(u in unit for u in ["लाख", "lakh", "lac", "লাখ", "లక్ష"]):
                return num * 100000.0
            elif any(u in unit for u in ["हजार", "thousand", "k", "వేల"]):
                return num * 1000.0
            elif any(u in unit for u in ["crore", "cr", "करोड़"]):
                return num * 10000000.0
            elif num <= 50.0:  # Contextually e.g. "आय 2.5" usually means 2.5 lakh
                return num * 100000.0
            else:
                return num
        except Exception:
            pass

    return None


def extract_occupation_from_text(text: str) -> Tuple[Optional[str], str]:
    """
    Extracts occupation with strict negation check and priority for Job Seekers.
    Returns (occupation_id, occupation_label).
    """
    if not text:
        return None, "Not Specified"
    t_lower = text.lower()

    # 1. Check for Farmer Negation first ("मैं किसान नहीं हूं", "not a farmer")
    is_farmer_negated = bool(FARMER_NEGATION_REGEX.search(t_lower))
    is_student_negated = bool(STUDENT_NEGATION_REGEX.search(t_lower))
    is_salaried_negated = bool(SALARIED_NEGATION_REGEX.search(t_lower))

    # 2. JOB SEEKER / UNEMPLOYED (Top priority to avoid misclassifying as salaried or farmer)
    job_seeker_patterns = [
        "नौकरी की तलाश", "नौकरी ढूंढ", "नौकरी खोज", "नौकरी चाहिए", "नौकरी नहीं है", "कोई नौकरी नहीं",
        "काम की तलाश", "काम ढूंढ", "काम खोज", "काम चाहिए", "कोई काम नहीं",
        "रोजगार की तलाश", "रोजगार चाहिए", "रोजगार ढूंढ", "बेरोजगार", "बेरोजगारी",
        "job seeker", "job-seeker", "jobseeking", "job seeking", "seeking job", "seeking a job",
        "seeking employment", "looking for a job", "looking for job", "searching for a job",
        "searching for job", "in search of job", "in search of a job", "need a job", "want a job",
        "unemployed", "jobless", "no job", "without job", "employment seeking", "fresh graduate seeking",
        "नोकरीच्या शोधात", "नोकरी शोधत आहे", "काम शोधत आहे", "बेरोजगार",
        "চাকরির সন্ধান", "চাকরি খুঁজছি", "চাকরি দরকার", "বেকার", "কর্মসংস্থানের সন্ধান",
        "ఉద్యోగ అన్వేషణ", "ఉద్యోగం కోసం చూస్తున్నాను", "ఉద్యోగం కావాలి", "నిరుద్యోగి", "ఉద్యోగం వెతుకుతున్నాను"
    ]
    if any(p in t_lower for p in job_seeker_patterns):
        return "job_seeker", "Job Seeker / Employment Seeking"

    # 3. SPECIAL DEMOGRAPHICS
    if any(w in t_lower for w in ["विधवा", "widow", "বিধবা", "వితంతువు"]):
        return "widow", "Widow"
    if any(w in t_lower for w in ["retired", "vrs", "superannuation", "सेवानिवृत्त", "pensioner", "অবসরপ্রাপ্ত", "రిటైర్డ్"]):
        return "retired", "Retired / Senior Citizen"
    if any(w in t_lower for w in ["senior citizen", "ज्येष्ठ नागरिक", "वरिष्ठ नागरिक"]):
        return "retired", "Senior Citizen"

    # 4. FARMER / AGRICULTURE (ONLY if NOT negated!)
    if not is_farmer_negated:
        farmer_phrases = [
            "मैं किसान हूं", "किसान हूं", "i am a farmer", "i'm a farmer", "am a farmer", "do farming",
            "खेती करता हूं", "खेती-बाड़ी करता हूं", "शेतकरी आहे", "रैतु", "कृषक", "काश्तकार",
            "agriculture worker", "cultivator", "small farmer", "marginal farmer"
        ]
        # Exact identity match or direct occupational statement
        if any(p in t_lower for p in farmer_phrases):
            return "farmer", "Farmer / Agriculture"
        # If user explicitly states farmer as an occupation
        if re.search(r'\b(?:व्यवसाय|occupation|profession)\s*[:=]?\s*(?:किसान|farmer|खेती)\b', t_lower):
            return "farmer", "Farmer / Agriculture"

    # 5. STUDENT (ONLY if NOT negated)
    if not is_student_negated:
        student_phrases = [
            "मैं छात्र हूं", "मैं विद्यार्थी हूं", "छात्र हूं", "विद्यार्थी हूं", "i am a student", "i'm a student",
            "college student", "school student", "पढ़ाई कर रहा हूं", "कॉलेज में पढ़ता हूं", "student"
        ]
        if any(p in t_lower for p in student_phrases):
            return "student", "Student"

    # 6. BUSINESS / SELF-EMPLOYED
    business_phrases = [
        "व्यापारी", "दुकानदार", "दुकान है", "छोटा व्यापार", "बिजनेस करता हूं", "व्यवसाय", "self-employed",
        "business owner", "micro business", "trader", "shopkeeper", "फेरीवाला", "vendor", "street vendor"
    ]
    if any(p in t_lower for p in business_phrases):
        return "business", "Self-Employed / Business"

    # 7. HOMEMAKER
    if any(w in t_lower for w in ["गृहणी", "गृहिणी", "homemaker", "housewife"]):
        return "homemaker", "Homemaker"

    # 8. UNORGANISED / GIG WORKER
    if any(w in t_lower for w in ["gig worker", "unorganized", "unorganised", "daily wage", "मजदूर", "कामगार", "shramik", "कूली"]):
        return "unorganized", "Unorganised / Gig Worker"

    # 9. SALARIED / FORMAL EMPLOYEE (ONLY if NOT negated and NOT job seeker)
    if not is_salaried_negated:
        salaried_phrases = [
            "नौकरी करता हूं", "प्राइवेट जॉब करता हूं", "प्राइवेट कंपनी में हूं", "corporate employee",
            "private employee", "salaried", "it company में काम", "full-time employee"
        ]
        if any(p in t_lower for p in salaried_phrases):
            return "salaried", "Private Employee (Salaried)"

    return None, "Not Specified"


def extract_goal_from_text(text: str, occupation: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
    """
    Extracts goal strictly from user statement.
    If occupation is job_seeker, naturally maps to employment & skill development.
    NEVER maps to farmer_support unless explicitly requested without negation.
    """
    if not text:
        if occupation == "job_seeker":
            return "employment", "Employment & Skill Development"
        return None, None

    t_lower = text.lower()
    is_farmer_negated = bool(FARMER_NEGATION_REGEX.search(t_lower))

    # 1. Skill training / Employment
    if any(w in t_lower for w in ["skill training", "skill", "training", "कौशल", "ट्रेनिंग", "नौकरी", "job", "रोजगार", "employment", "work"]):
        return "employment", "Employment & Skill Development"

    if occupation == "job_seeker":
        return "employment", "Employment & Skill Development"

    # 2. Farmer / Agriculture (ONLY if NOT negated)
    if not is_farmer_negated and any(w in t_lower for w in ["खेती के लिए", "खेती", "फसल", "crop", "krishi yojana", "kisan yojana", "pm-kisan"]):
        return "farmer_support", "Farmer & Agriculture Support (PM-KISAN, KCC)"

    # 3. Child education / daughter
    if any(w in t_lower for w in ["child education", "daughter", "beti", "sukanya", "बच्चों की शिक्षा", "पढ़ाई के लिए"]):
        return "child_education", "Child Higher Education & Welfare"

    # 4. Retirement / Pension
    if any(w in t_lower for w in ["pension", "retirement", "बुढ़ापा", "रिटायरमेंट", "पेंशन", "old age"]):
        return "retirement", "Retirement & Pension Social Security"

    # 5. Business / Loan
    if any(w in t_lower for w in ["business", "loan", "startup", "मुद्रा", "व्यापार", "दुकान"]):
        return "business", "Small Business, MSME & Entrepreneurship"

    # 6. Healthcare
    if any(w in t_lower for w in ["health", "medical", "treatment", "इलाज", "अस्पताल", "स्वास्थ्य"]):
        return "healthcare", "Healthcare & Medical Protection"

    # 7. Financial Assistance
    if any(w in t_lower for w in ["financial assistance", "subsidy", "आर्थिक मदद", "सब्सिडी", "मदद"]):
        return "financial_assistance", "Financial Assistance & Welfare Subsidy"

    return None, None


def extract_gender_from_text(text: str) -> Optional[str]:
    """Extracts gender explicitly stated by user for themselves."""
    if not text:
        return None
    t_lower = text.lower()
    if any(w in t_lower for w in ["i am a woman", "i'm a woman", "i am female", "महिला हूं", "स्त्री हूं", "लड़की हूं"]):
        return "female"
    if any(w in t_lower for w in ["i am a man", "i'm a man", "i am male", "पुरुष हूं", "लड़का हूं"]):
        return "male"
    return None


def extract_user_profile_facts(
    current_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    context_profile: Optional[Dict[str, Any]] = None
) -> ExtractedProfile:
    """
    Main entry point for extracting verified facts from user conversation.
    Strictly follows:
    1. CURRENT user input has absolute priority.
    2. Missing fields are checked against recent user messages in history (reverse chronological order).
    3. If not found in message or history, context_profile is checked ONLY for genuine non-dummy values.
    4. Never hallucinate default 25 age, farmer occupation, or dummy values.
    """
    history = history or []
    user_history_texts = [
        h["text"] for h in history
        if isinstance(h, dict) and h.get("sender") == "user" and h.get("text")
    ]

    profile = ExtractedProfile()
    provenance = {}

    # -------------------------------------------------------------
    # 1. AGE EXTRACTION (Current message first, then history, then auth profile)
    # -------------------------------------------------------------
    age_val = extract_age_from_text(current_message)
    if age_val is not None:
        profile.age = age_val
        provenance["age"] = "USER_EXPLICIT"
    else:
        # Search backwards in history
        for prev_text in reversed(user_history_texts):
            prev_age = extract_age_from_text(prev_text)
            if prev_age is not None:
                profile.age = prev_age
                provenance["age"] = "USER_EXPLICIT"
                break

    if profile.age is None and context_profile:
        # Check if context_profile has a non-default age from authenticated profile
        c_age = context_profile.get("age")
        if c_age is not None and isinstance(c_age, (int, float)) and c_age > 0:
            # Only use if explicitly flagged as verified auth or not a dummy default
            is_explicit = context_profile.get("is_authenticated") or context_profile.get("source") == "USER_EXPLICIT"
            if is_explicit:
                profile.age = int(c_age)
                provenance["age"] = "EXISTING_AUTH_PROFILE"

    # -------------------------------------------------------------
    # 2. STATE EXTRACTION
    # -------------------------------------------------------------
    state_val = extract_state_from_text(current_message)
    if state_val:
        profile.state = state_val
        provenance["state"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_state = extract_state_from_text(prev_text)
            if prev_state:
                profile.state = prev_state
                provenance["state"] = "USER_EXPLICIT"
                break

    if profile.state is None and context_profile:
        if context_profile.get("is_authenticated") or context_profile.get("source") == "USER_EXPLICIT":
            c_state = context_profile.get("state")
            if c_state and str(c_state).strip() and str(c_state).lower() not in ["all india / central", "central", "all"]:
                profile.state = str(c_state).strip()
                provenance["state"] = "EXISTING_AUTH_PROFILE"

    # -------------------------------------------------------------
    # 2b. DISTRICT EXTRACTION
    # -------------------------------------------------------------
    dist_val = extract_district_from_text(current_message)
    if dist_val:
        profile.district = dist_val
        provenance["district"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_dist = extract_district_from_text(prev_text)
            if prev_dist:
                profile.district = prev_dist
                provenance["district"] = "USER_EXPLICIT"
                break

    # -------------------------------------------------------------
    # 3. INCOME EXTRACTION
    # -------------------------------------------------------------
    income_val = extract_income_from_text(current_message)
    if income_val is not None:
        profile.annual_family_income = income_val
        provenance["annual_family_income"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_inc = extract_income_from_text(prev_text)
            if prev_inc is not None:
                profile.annual_family_income = prev_inc
                provenance["annual_family_income"] = "USER_EXPLICIT"
                break

    if profile.annual_family_income is None and context_profile:
        c_inc = context_profile.get("annual_income") or context_profile.get("income")
        if c_inc is not None and isinstance(c_inc, (int, float)) and c_inc > 0:
            if context_profile.get("is_authenticated") or context_profile.get("source") == "USER_EXPLICIT":
                profile.annual_family_income = float(c_inc)
                provenance["annual_family_income"] = "EXISTING_AUTH_PROFILE"

    # -------------------------------------------------------------
    # 4. OCCUPATION EXTRACTION
    # -------------------------------------------------------------
    is_farmer_neg_curr = bool(FARMER_NEGATION_REGEX.search(current_message))
    is_student_neg_curr = bool(STUDENT_NEGATION_REGEX.search(current_message))
    is_salaried_neg_curr = bool(SALARIED_NEGATION_REGEX.search(current_message))

    occ_val, occ_label = extract_occupation_from_text(current_message)
    if occ_val:
        profile.occupation = occ_val
        profile.occupation_label = occ_label
        provenance["occupation"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_occ, prev_occ_lbl = extract_occupation_from_text(prev_text)
            if prev_occ:
                if prev_occ == "farmer" and is_farmer_neg_curr:
                    continue
                if prev_occ == "student" and is_student_neg_curr:
                    continue
                if prev_occ == "salaried" and is_salaried_neg_curr:
                    continue
                profile.occupation = prev_occ
                profile.occupation_label = prev_occ_lbl
                provenance["occupation"] = "USER_EXPLICIT"
                break

    if profile.occupation is None and context_profile:
        # Strictly require genuine authenticated profile; NEVER use unauthenticated / demo fallback
        if context_profile.get("is_authenticated") or context_profile.get("source") == "USER_EXPLICIT":
            c_occ = context_profile.get("occupation")
            if c_occ and str(c_occ).strip() and str(c_occ).lower() not in ["salaried", "farmer", "general"]:
                profile.occupation = str(c_occ).strip()
                profile.occupation_label = str(c_occ).title()
                provenance["occupation"] = "EXISTING_AUTH_PROFILE"

    # -------------------------------------------------------------
    # 5. GENDER EXTRACTION
    # -------------------------------------------------------------
    gender_val = extract_gender_from_text(current_message)
    if gender_val:
        profile.gender = gender_val
        provenance["gender"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_g = extract_gender_from_text(prev_text)
            if prev_g:
                profile.gender = prev_g
                provenance["gender"] = "USER_EXPLICIT"
                break

    # -------------------------------------------------------------
    # 6. CHILD AGE & BENEFICIARY TARGET
    # -------------------------------------------------------------
    child_age_val = extract_child_age_from_text(current_message)
    if child_age_val is not None:
        profile.child_age = child_age_val
        profile.saving_for = "children"
        provenance["child_age"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_ca = extract_child_age_from_text(prev_text)
            if prev_ca is not None:
                profile.child_age = prev_ca
                profile.saving_for = "children"
                provenance["child_age"] = "USER_EXPLICIT"
                break

    # -------------------------------------------------------------
    # 7. GOAL & CATEGORY ROUTING
    # -------------------------------------------------------------
    goal_val, goal_lbl = extract_goal_from_text(current_message, profile.occupation)
    if goal_val:
        profile.goal = goal_val
        profile.goal_label = goal_lbl
        provenance["goal"] = "USER_EXPLICIT"
    else:
        for prev_text in reversed(user_history_texts):
            prev_g, prev_gl = extract_goal_from_text(prev_text, profile.occupation)
            if prev_g:
                profile.goal = prev_g
                profile.goal_label = prev_gl
                provenance["goal"] = "USER_EXPLICIT"
                break

    # Default goal for job_seeker if none specified
    if not profile.goal and profile.occupation == "job_seeker":
        profile.goal = "employment"
        profile.goal_label = "Employment & Skill Development"

    profile.provenance = provenance
    return profile
