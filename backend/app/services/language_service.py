"""
SANCHAY Multilingual Support & Language Detection Service
Supports all 5 constitutionally backed project languages:
1. en - English
2. hi - Hindi (हिन्दी)
3. mr - Marathi (मराठी)
4. bn - Bengali (বাংলা)
5. te - Telugu (తెలుగు)

Provides strict deterministic language detection (Scripts, Lexical markers, Hinglish/Romanized input),
cross-language multi-turn memory support, and localization dictionary for Sakhi Assistant.
"""

import re
from typing import Dict, Any, Optional, List, Tuple

SUPPORTED_LANGUAGES = ["en", "hi", "hinglish", "mr", "bn", "te"]

# Unicode character block ranges
RE_TELUGU = re.compile(r'[ఀ-౿]')
RE_BENGALI = re.compile(r'[ঀ-৿]')
RE_DEVANAGARI = re.compile(r'[ऀ-ॿ]')

# Marathi lexical & morphological markers in Devanagari
MARATHI_DEVANAGARI_MARKERS = [
    # Unique Marathi consonant
    "ळ",
    # Verbs / auxiliaries
    "आहेत", "आहे", "नाही", "नाहीत", "होते", "होता", "होती", "असेल", "असतील",
    "मिळेल", "मिळतील", "सांगा", "दाखवा", "तपासा", "करावे", "करावी", "करावा",
    "पाहिजे", "हवे", "हवी", "झाले", "झाली", "मिळू", "मिळतात",
    # Pronouns / postpositions
    "माझ्यासाठी", "तुमच्यासाठी", "आमच्यासाठी", "माझे", "माझी", "माझा", "मला",
    "तुम्हाला", "आम्हाला", "कोणत्या", "कोणती", "कोणता", "कोणते", "कशा", "कसा",
    "कसे", "किती", "यांच्यासाठी", "त्यांच्यासाठी", "कौटुंबिक",
    # Nouns / keywords
    "शेतकरी", "शेतकऱ्यांसाठी", "शेतकऱ्यांना", "मुले", "मुलगी", "मुलीसाठी", "मुलांसाठी",
    "उत्पन्न", "उत्पन्नाची", "वय", "वर्षे", "शासकीय", "प्रकल्प", "योजनेसाठी",
    "योजनांची", "भांडवल", "अनुदान", "मोफत", "विनामूल्य", "शिष्यवृत्ती", "तपासण्यासाठी",
    "निवृत्ती", "पेन्शन", "विमा", "एलआयसी", "कर्ज", "बचत", "लाभ", "काय", "कशासाठी", "होईल", "मी", "गुंतवले", "गुंतवणूक", "वर्षांसाठी", "दरमहा", "वाचवायचे"
]

# Hindi lexical & morphological markers in Devanagari
HINDI_DEVANAGARI_MARKERS = [
    # Verbs / auxiliaries
    "हैं", "है", "नहीं", "था", "थी", "थे", "होगा", "होगी", "होंगे",
    "मिलेगा", "मिलेंगे", "मिलेगी", "बताओ", "बताइए", "दिखाइए", "जांचें",
    "करना", "करनी", "चाहिए", "सकता", "सकती", "सकते", "पात्रता", "जांचने",
    # Pronouns / postpositions
    "मेरे", "मेरी", "मेरा", "मुझको", "मुझे", "आपके", "आपकी", "आपका", "आपको",
    "हमारे", "हमारी", "हमारा", "हमें", "कौन", "कौनसी", "कौनसा", "कौनसे",
    "कैसे", "कितना", "कितनी", "कितने", "के लिए", "की", "का", "के", "से", "में", "पर", "को",
    # Nouns / keywords
    "किसान", "किसानों", "बच्चे", "बेटी", "बेटा", "परिवार", "पारिवारिक", "आय",
    "उम्र", "साल", "वर्ष", "योजनाएं", "योजनाएँ", "योजनाओं", "मुफ्त", "मुफ़्त",
    "छूट", "सब्सिडी", "छात्रवृत्ति", "पेंशन", "बीमा", "एलआईसी", "ऋण", "लोन", "क्या", "अब", "पैसे", "बचाने", "चाहिए"
]

# Romanized / Transliterated markers
ROMANIZED_TELUGU_WORDS = [
    "naaku", "naku", "pathakalu", "pathakam", "cheppandi", "raitulaku", "raitu", "raithu",
    "arhudina", "arhatalu", "kosam", "ela", "yemi", "unnayi", "prabhutva", "labhalu",
    "yentha", "vaddii", "thelusukovalani", "evariki", "manchi"
]

ROMANIZED_BENGALI_WORDS = [
    "amar", "aamar", "jonno", "prokolpo", "krishok", "krishokder", "chaii", "chai",
    "ki ki", "pawa jay", "pawa jai", "shorkari", "sarkari prokolpo", "subidha", "joggo",
    "koto", "bhalo", "shob", "ekhon"
]

ROMANIZED_MARATHI_WORDS = [
    "majhyasathi", "majhe", "shetkari", "shetkaryansathi", "konti yojana", "konte",
    "ahet", "aahe", "sangaa", "sanga", "pahije", "milal", "kiti", "majhe vay",
    "mofat", "anudan"
]

ROMANIZED_HINGLISH_PHRASES = [
    r'\bbacha sakta hu\b', r'\bbacha sakta hoon\b', r'\bbacha sakti hu\b', r'\bbacha sakte hain\b',
    r'\bbacha sakte ho\b', r'\bkaise bacha\b', r'\bkaise bachaye\b', r'\bkaise bachau\b',
    r'\bkarna hai\b', r'\bkarein\b', r'\bsamjha do\b', r'\bbata do\b', r'\bho jaye\b',
    r'\bho jayega\b', r'\bkamaata hu\b', r'\bkamata hu\b', r'\bkamata hoon\b',
    r'\bkaha se\b', r'\bkitne paise\b', r'\bkitna paisa\b', r'\bshuru karu\b', r'\bshuru karein\b',
    r'\bpaise bachane\b', r'\bpaise kaise\b', r'\bsip samjhao\b', r'\bkaise manage\b'
]

ROMANIZED_HINGLISH_WORDS = [
    "mujhe", "mujhko", "mera", "meri", "mere", "mein", "main", "hum", "humara", "humari", "humare",
    "aap", "aapka", "aapki", "aapke", "tum", "tumhara", "tumhari", "tumhare",
    "kaise", "kya", "kaun", "kaunsa", "kaunsi", "kaunse", "kitna", "kitne", "kitni", "kab", "kaha", "kahan", "kyun", "kyu",
    "chahiye", "chahie", "sakta", "sakti", "sakte", "hu", "hoon", "hai", "hain", "ho", "hoga", "hogi", "honge",
    "karo", "karna", "karein", "karu", "karun", "kare", "batao", "bataiye", "batayein", "samjhao", "samjhaiye", "samjhana",
    "bacha", "bachana", "bachaye", "bachau", "bachane", "bachat", "kamaata", "kamata",
    "kharch", "kharcha", "kharche", "milega", "milegi", "milenge",
    "aur", "agar", "toh", "bhi", "nahi", "nahin", "mat", "se", "pe", "par", "ko", "ke", "ki", "ka",
    "liye", "baad", "pehle", "zaroori", "zaruri", "zarurat", "shuru", "shuruaat",
    "paise", "paisa", "rupaye", "rupay", "byaj", "nivesh", "yojna", "yojana", "ab"
]

ENGLISH_MARKERS = [
    "how", "what", "which", "who", "when", "why", "where",
    "can", "could", "should", "would", "will", "shall", "may", "might",
    "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "our", "their",
    "save", "saving", "savings", "invest", "investing", "investment",
    "budget", "budgeting", "income", "salary", "expense", "expenses",
    "earn", "earning", "manage", "managing", "plan", "planning",
    "bike", "car", "trip", "travel", "vacation", "america", "usa",
    "explain", "tell", "compound", "interest", "rate", "money",
    "government", "scheme", "schemes", "benefit", "benefits", "free",
    "best", "need", "want", "help", "please", "details", "compare"
]


def detect_user_language(message: str, fallback_lang: str = "en") -> str:
    """
    Intelligently detects user language from message text:
    - English (en)
    - Hindi (hi) in Devanagari script
    - Hinglish (hinglish) - Hindi written in Roman / Latin script
    - Marathi (mr) in Devanagari script (or Romanized Marathi)
    - Bengali (bn) in Bengali script (or Romanized Bengali)
    - Telugu (te) in Telugu script (or Romanized Telugu)
    - Falls back to fallback_lang if neutral/undetermined (e.g. acronym like 'PPF' or plan number '715')
    """
    if not message or not message.strip():
        return fallback_lang if fallback_lang in SUPPORTED_LANGUAGES else "en"

    msg = message.strip()
    msg_lower = msg.lower()

    # 1. Explicit Directives (e.g. "Now explain it in English.")
    if re.search(r'\b(in english|explain (?:it )?in english|speak in english|tell me in english|now explain (?:it )?in english|in pure english)\b', msg_lower):
        return "en"
    if re.search(r'\b(in hindi|shuddh hindi|shuddha hindi)\b', msg_lower):
        return "hi"
    if re.search(r'\b(in marathi|marathi madhye)\b', msg_lower):
        return "mr"
    if re.search(r'\b(in bengali|bangla te)\b', msg_lower):
        return "bn"
    if re.search(r'\b(in telugu|telugu lo)\b', msg_lower):
        return "te"

    # 2. Script-based detection
    # A. Telugu Script
    if RE_TELUGU.search(msg):
        return "te"

    # B. Bengali Script
    if RE_BENGALI.search(msg):
        return "bn"

    # C. Devanagari Script (Marathi vs Hindi)
    if RE_DEVANAGARI.search(msg):
        if "ळ" in msg:
            return "mr"

        mr_score = sum(2 if len(m) > 3 else 1 for m in MARATHI_DEVANAGARI_MARKERS if m in msg)
        hi_score = sum(2 if len(m) > 3 else 1 for m in HINDI_DEVANAGARI_MARKERS if m in msg)

        if mr_score > hi_score:
            return "mr"
        elif hi_score > mr_score:
            return "hi"
        else:
            return "mr" if fallback_lang == "mr" else "hi"

    # 3. Romanized non-Hindi Indian languages
    te_rom = sum(1 for w in ROMANIZED_TELUGU_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))
    bn_rom = sum(1 for w in ROMANIZED_BENGALI_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))
    mr_rom = sum(1 for w in ROMANIZED_MARATHI_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))

    if te_rom > 0 and te_rom >= bn_rom and te_rom >= mr_rom:
        return "te"
    if bn_rom > 0 and bn_rom >= mr_rom:
        return "bn"
    if mr_rom > 0:
        return "mr"

    # 4. Hinglish Detection (Romanized Hindi)
    hinglish_score = 0
    # Match multi-word Hinglish phrases (weight 3 each)
    for p in ROMANIZED_HINGLISH_PHRASES:
        if re.search(p, msg_lower):
            hinglish_score += 3

    # Match individual Hinglish words (weight 1 each)
    tokens = re.findall(r'\b[a-z]+\b', msg_lower)
    for tok in tokens:
        if tok in ROMANIZED_HINGLISH_WORDS:
            hinglish_score += 1

    # Match English words
    english_score = sum(1 for tok in tokens if tok in ENGLISH_MARKERS)

    if hinglish_score > 0:
        return "hinglish"

    if english_score > 0:
        return "en"

    # 5. Neutral / Numeric Fallback
    return fallback_lang if fallback_lang in SUPPORTED_LANGUAGES else "en"

# =====================================================================
# MULTILINGUAL DICTIONARY FOR SAKHI CORE PHRASES & DETERMINISTIC REPLIES
# =====================================================================

MULTILINGUAL_PROMPTS = {
    # Requirement 8: Missing family income prompt
    "missing_annual_family_income": {
        "hi": "आपकी पात्रता जांचने के लिए आपकी वार्षिक पारिवारिक आय बताएं।",
        "mr": "तुमची पात्रता तपासण्यासाठी तुमचे वार्षिक कौटुंबिक उत्पन्न सांगा.",
        "bn": "আপনার যোগ্যতা যাচাই করতে আপনার বার্ষিক পারিবারিক আয় জানান।",
        "te": "మీ అర్హతను తనిఖీ చేయడానికి మీ వార్షిక కుటుంబ ఆదాయాన్ని చెప్పండి.",
        "en": "To evaluate your eligibility, please provide your annual family income."
    },
    # Missing age and income general prompt
    "missing_age_and_income": {
        "hi": "आपकी पात्रता जांचने के लिए कृपया अपनी उम्र और वार्षिक पारिवारिक आय बताएं।",
        "mr": "तुमची पात्रता तपासण्यासाठी कृपया तुमचे वय आणि वार्षिक कौटुंबिक उत्पन्न सांगा.",
        "bn": "আপনার যোগ্যতা যাচাই করতে দয়া করে আপনার বয়স এবং বার্ষিক পারিবারিক আয় জানান।",
        "te": "మీ అర్హతను తనిఖీ చేయడానికి దయచేసి మీ వయస్సు మరియు వార్షిక కుటుంబ ఆదాయాన్ని తెలపండి.",
        "en": "To check your eligibility without guessing, please share your age and annual family income."
    },
    # Missing information required general headline
    "additional_info_required_title": {
        "hi": "अतिरिक्त जानकारी आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)",
        "mr": "अतिरिक्त माहिती आवश्यक (ADDITIONAL_INFORMATION_REQUIRED)",
        "bn": "অতিরিক্ত তথ্য আবশ্যক (ADDITIONAL_INFORMATION_REQUIRED)",
        "te": "అదనపు సమాచారం అవసరం (ADDITIONAL_INFORMATION_REQUIRED)",
        "en": "Additional Information Required (ADDITIONAL_INFORMATION_REQUIRED)"
    },
    # Verified source note
    "statutory_source_note": {
        "hi": "सभी योजनाएं भारत सरकार के आधिकारिक राजपत्रों और अधिकृत रिकॉर्ड द्वारा सत्यापित हैं।",
        "mr": "सर्व योजना भारत सरकारच्या अधिकृत राजपत्रांद्वारे १००% सत्यापित आहेत.",
        "bn": "সমস্ত স্কিম ভারত সরকারের অফিসিয়াল গেজেটের মাধ্যমে শতভাগ যাচাইকৃত।",
        "te": "అన్ని పథకాలు భారత ప్రభుత్వ అధికారిక గెజిట్‌ల ద్వారా 100% ధృవీకరించబడ్డాయి.",
        "en": "All schemes are 100% verified against official Government of India gazettes."
    },
    # Verified information unavailable
    "verified_info_unavailable": {
        "hi": "संचय के वर्तमान सत्यापित डेटाबेस में उस योजना के बारे में आधिकारिक जानकारी उपलब्ध नहीं है। सखी केवल भारत सरकार के राजपत्रों से प्रमाणित जानकारी प्रदान करती है।",
        "mr": "संचयच्या सध्याच्या अधिकृत डेटाबेसमध्ये त्या योजनेबद्दल माहिती उपलब्ध नाही. सखी केवळ भारत सरकारच्या राजपत्रांनुसार सत्यापित माहिती प्रदान करते.",
        "bn": "সঞ্চয়ের বর্তমান যাচাইকৃত ডেটাবেসে সেই স্কিম সম্পর্কে তথ্য উপলব্ধ নেই। সখী শুধুমাত্র ভারত সরকারের গেজেট অনুমোদিত তথ্য প্রদান করে।",
        "te": "సంచయ్ ప్రస్తుత ధృవీకరించబడిన డేటాబేస్‌లో ఆ పథకం గురించి సమాచారం అందుబాటులో లేదు. సఖి భారత ప్రభుత్వ గెజిట్‌ల ద్వారా ధృవీకరించబడిన సమాచారాన్ని మాత్రమే అందిస్తుంది.",
        "en": "Verified information for that scheme is currently not available in SANCHAY's database. Sakhi provides grounded details strictly from official Government of India gazettes."
    },
    # Buttons
    "btn_find_schemes": {
        "hi": "मेरी योजनाएं खोजें",
        "mr": "माझ्या योजना शोधा",
        "bn": "আমার স্কিম খুঁজুন",
        "te": "నా పథకాలను కనుగొనండి",
        "en": "Find My Schemes"
    },
    "btn_explore_catalog": {
        "hi": "सभी योजनाएं देखें",
        "mr": "सर्व योजना पहा",
        "bn": "সব স্কিম দেখুন",
        "te": "అన్ని పథకాలను చూడండి",
        "en": "Explore Catalog"
    },
    "btn_official_portal": {
        "hi": "आधिकारिक वेबसाइट",
        "mr": "अधिकृत संकेतस्थळ",
        "bn": "অফিসিয়াল পোর্টাল",
        "te": "అధికారిక పోర్టల్",
        "en": "Official Portal"
    }
}


LANGUAGE_SCRIPTS = {
    "en": "Latin",
    "hi": "Devanagari",
    "mr": "Devanagari",
    "bn": "Bengali",
    "te": "Telugu"
}

PROMPT_TRANSLATIONS = MULTILINGUAL_PROMPTS


def get_multilingual_text(key: str, lang: str = "en") -> str:
    """Retrieve localized text snippet with fallback to English."""
    entry = MULTILINGUAL_PROMPTS.get(key, {})
    return entry.get(lang) or entry.get("en") or ""

