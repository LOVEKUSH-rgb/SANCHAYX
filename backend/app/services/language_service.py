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

SUPPORTED_LANGUAGES = ["en", "hi", "mr", "bn", "te"]

# Unicode character block ranges
RE_TELUGU = re.compile(r'[\u0C00-\u0C7F]')
RE_BENGALI = re.compile(r'[\u0980-\u09FF]')
RE_DEVANAGARI = re.compile(r'[\u0900-\u097F]')

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
    "निवृत्ती", "पेन्शन", "विमा", "एलआयसी", "कर्ज", "बचत", "लाभ", "काय", "कशासाठी"
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
    "छूट", "सब्सिडी", "छात्रवृत्ति", "पेंशन", "बीमा", "एलआईसी", "ऋण", "लोन", "क्या"
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

ROMANIZED_HINDI_WORDS = [
    "mere", "meri", "mera", "mujhe", "batao", "bataiye", "konsi", "kaunsi", "kaun sa",
    "kaun si", "chahiye", "kisan", "kisanon", "yojana hai", "yojna hai", "karna", "kaise",
    "milega", "kya", "bachche", "bacche", "beti", "ke liye", "kaha", "kitna", "aamdani",
    "kamai", "umra", "umar"
]


def detect_user_language(message: str, fallback_lang: str = "en") -> str:
    """
    Intelligently detects user language from message text:
    - Telugu (te) if Telugu script or Romanized Telugu is present
    - Bengali (bn) if Bengali script or Romanized Bengali is present
    - Marathi (mr) or Hindi (hi) if Devanagari script is present:
        Distinguishes Marathi vs Hindi using morphological/lexical features
    - Romanized Hinglish -> Hindi (hi)
    - Romanized Minglish -> Marathi (mr)
    - Romanized Bengali -> Bengali (bn)
    - Romanized Telugu -> Telugu (te)
    - Falls back to fallback_lang if neutral/undetermined (e.g. acronym like 'PPF' or plan number '715')
    """
    if not message or not message.strip():
        return fallback_lang if fallback_lang in SUPPORTED_LANGUAGES else "en"

    msg = message.strip()
    msg_lower = msg.lower()

    # 1. Script-based detection
    # A. Telugu Script
    if RE_TELUGU.search(msg):
        return "te"

    # B. Bengali Script
    if RE_BENGALI.search(msg):
        return "bn"

    # C. Devanagari Script (Marathi vs Hindi)
    if RE_DEVANAGARI.search(msg):
        # 1. Look for unique Marathi letter 'ळ'
        if "ळ" in msg:
            return "mr"

        mr_score = 0
        hi_score = 0

        for marker in MARATHI_DEVANAGARI_MARKERS:
            # Word boundary or containment for Devanagari tokens
            if marker in msg:
                mr_score += 2 if len(marker) > 3 else 1

        for marker in HINDI_DEVANAGARI_MARKERS:
            if marker in msg:
                hi_score += 2 if len(marker) > 3 else 1

        if mr_score > hi_score:
            return "mr"
        elif hi_score > mr_score:
            return "hi"
        else:
            # If ambiguous Devanagari (e.g. "योजना" which exists in both), honor fallback if it's mr or hi
            if fallback_lang == "mr":
                return "mr"
            return "hi"

    # 2. Romanized / Transliterated Lexical Detection
    te_rom_score = sum(1 for w in ROMANIZED_TELUGU_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))
    bn_rom_score = sum(1 for w in ROMANIZED_BENGALI_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))
    mr_rom_score = sum(1 for w in ROMANIZED_MARATHI_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))
    hi_rom_score = sum(1 for w in ROMANIZED_HINDI_WORDS if re.search(r'\b' + re.escape(w) + r'\b', msg_lower))

    scores = [
        (te_rom_score, "te"),
        (bn_rom_score, "bn"),
        (mr_rom_score, "mr"),
        (hi_rom_score, "hi")
    ]
    scores.sort(key=lambda x: x[0], reverse=True)
    if scores[0][0] > 0:
        return scores[0][1]

    # 3. Pure English check or Neutral Entity (e.g. "PPF", "Plan 715", "SSY")
    # If standard English question words or phrases are present:
    en_markers = ["what", "which", "how", "who", "when", "why", "tell me", "available", "eligible", "schemes", "scheme", "plan", "details", "compare", "apply", "benefit"]
    if any(re.search(r'\b' + re.escape(w) + r'\b', msg_lower) for w in en_markers):
        return "en"

    # Neutral fallback
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

