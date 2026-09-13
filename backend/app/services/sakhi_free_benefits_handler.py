import re
from typing import Dict, Any, List, Optional, Tuple
from app.schemas import SakhiChatResponse, SourceCitation, SakhiActionButton
from app.database import get_free_benefits_collection
from app.free_benefits_engine import (
    FreeBenefitUserProfile,
    evaluate_single_free_benefit,
    evaluate_all_free_benefits,
    FreeBenefitEvaluationResult
)
from app.services.language_service import detect_user_language, get_multilingual_text

FREE_BENEFIT_KEYWORDS = [
    "free", "free plan", "free plans", "muft", "mufat", "nishulk", "shulk", "subsidy", "subsidies", "scholarship", "chhatravratti",
    "coaching", "free coaching", "free training", "free rice", "ration", "pmgkay", "pm daksh",
    "pm-daksh", "smile", "transgender", "dhtess", "hsmis", "vjnt", "sebc", "nagaland",
    "assistance", "free yojana", "free scheme", "free schemes", "free benefits", "muft yojana",
    "free scooty", "free food", "free tablet", "free laptop", "stipend",
    "hostel", "free hostel", "jai bhim", "jbmpvy", "naya savera", "disability", "divyang",
    "post matric", "postmatric", "ebc", "mes sdis", "employable skills",
    "pmjay", "pm-jay", "ayushman", "ayushman bharat", "esdp", "entrepreneurship",
    "pmkvy", "kaushal vikas", "heart surgery", "congenital heart", "surya ghar",
    "muft bijli", "rooftop solar", "solar subsidy", "health treatment", "free treatment",
    # Hindi / Devanagari
    "फ्री", "फ्री प्लान", "फ्री प्लेन्स", "फ्री प्लान्स", "फ्री योजना", "फ्री योजनाएं", "फ्री योजनाएँ", "फ्री लाभ", "फ्री स्कीम", "फ्री स्कीम्स", "फ्री बेनिफिट्स", "सरकारी फ्री",
    "मुफ्त", "मुफ़्त", "निःशुल्क", "निशुल्क", "मुफ्त लाभ", "मुफ्त सरकारी लाभ", "मुफ्त योजना", "मुफ्त प्लान",
    "मुफ्त योजनाएं", "छात्रवृत्ति", "मुफ्त इलाज", "मुफ्त ट्रेनिंग", "मुफ्त राशन", "मुफ्त सुविधा", "मुफ्त सुविधाएं", "सब्सिडी",
    # Marathi
    "मोफत", "मोफत प्लॅन्स", "मोफत योजना", "मोफत सरकारी लाभ", "मोफत लाभ", "विनामूल्य", "अनुदान", "शिष्यवृत्ती", "मोफत उपचार", "मोफत अन्न", "सबसिडी",
    # Bengali
    "বিনামূল্যে", "বিনামূল্যের", "ফ্রি", "ফ্রি প্ল্যান", "বৃত্তি", "অনুদান", "বিনামূল্যের সরকারি সুবিধা", "বিনামূল্যে সুবিধা", "বিনামূল্যে চিকিৎসা", "ভর্তুকি", "বিনামূল্যে স্কিম",
    # Telugu
    "ఉచిత", "ఉచిత ప్లాన్లు", "ఉచిత పథకాలు", "ఉచిత ప్రభుత్వ ప్రయోజనాలు", "ఉచిత పథకాలు", "ఉపకార వేతనం", "సబ్సిడీ", "ఉచిత చికిత్స", "ఉచిత బియ్యం", "ప్రయోజనాలు"
]


def is_free_benefits_query(message: str) -> bool:
    msg_lower = message.lower().strip()
    return any(kw in msg_lower for kw in FREE_BENEFIT_KEYWORDS)


def find_matching_free_benefits(message: str, user_profile: Optional[FreeBenefitUserProfile] = None) -> List[Dict[str, Any]]:
    col = get_free_benefits_collection()
    all_docs = list(col.find({}))
    msg_lower = message.lower().strip()
    user_state = (user_profile.state or "").lower() if user_profile and user_profile.state else ""
    user_occ = (user_profile.occupation or "").lower() if user_profile and user_profile.occupation else ""

    matches = []
    # 1. Exact ID or specific scheme name keyword match
    for doc in all_docs:
        b_id = str(doc.get("benefit_id", "")).lower()
        name = str(doc.get("name", "")).lower()
        
        # Check direct containment
        if b_id in msg_lower or (len(name) > 4 and name in msg_lower):
            matches.append(doc)
            continue

        # Check significant sub-phrases
        if "hostel" in msg_lower and "hostel" in name:
            matches.append(doc)
        elif ("jai bhim" in msg_lower or "jbmpvy" in msg_lower) and "jai bhim" in name:
            matches.append(doc)
        elif ("naya savera" in msg_lower or "minority coaching" in msg_lower) and "naya savera" in name:
            matches.append(doc)
        elif ("disability" in msg_lower or "divyang" in msg_lower or "disabled" in msg_lower or "विकलांग" in msg_lower or "दिव्यांग" in msg_lower) and "disabilit" in name:
            matches.append(doc)
        elif ("post matric" in msg_lower or "postmatric" in msg_lower or "छात्रवृत्ति" in msg_lower or "scholarship" in msg_lower) and "post matric" in name:
            matches.append(doc)
        elif ("pmjay" in msg_lower or "pm-jay" in msg_lower or "ayushman" in msg_lower or "free health" in msg_lower or "cashless" in msg_lower or "इलाज" in msg_lower or "आयुष्मान" in msg_lower) and "pm-jay" in name.lower():
            matches.append(doc)
        elif ("esdp" in msg_lower or "entrepreneurship" in msg_lower) and "esdp" in b_id:
            matches.append(doc)
        elif ("pmkvy" in msg_lower or "kaushal vikas" in msg_lower or "कौशल" in msg_lower or "स्किल" in msg_lower) and "pmkvy" in b_id:
            matches.append(doc)
        elif ("heart" in msg_lower or "congenital" in msg_lower or "cardiac" in msg_lower or "dil ki" in msg_lower or "हार्ट" in msg_lower) and "heart" in b_id:
            matches.append(doc)
        elif ("surya ghar" in msg_lower or "muft bijli" in msg_lower or "rooftop solar" in msg_lower or "solar" in msg_lower or "सोलर" in msg_lower or "सूर्य घर" in msg_lower) and "surya" in b_id:
            matches.append(doc)

    if matches:
        return matches

    # 2. State specific query (e.g. Rajasthan, Maharashtra, Delhi, Telangana)
    matched_by_state = []
    for doc in all_docs:
        st = str(doc.get("state", "")).lower()
        if st != "all india":
            if st in msg_lower or (user_state and (st in user_state or user_state in st)):
                matched_by_state.append(doc)

    if matched_by_state:
        # Also include flagship central schemes accessible in that state
        for doc in all_docs:
            if doc.get("level") == "central" or doc.get("state") == "All India":
                if doc not in matched_by_state:
                    matched_by_state.append(doc)
        
        # Prioritize by user occupation/category if present (e.g. job_seeker -> skill training first)
        if user_occ == "job_seeker" or any(w in msg_lower for w in ["job", "नौकरी", "रोजगार", "training", "skill", "प्रशिक्षण"]):
            matched_by_state.sort(key=lambda d: 0 if (d.get("category") == "skill_employment" or "training" in str(d.get("name", "")).lower() or "skill" in str(d.get("eligibility_text", "")).lower()) else 1)
        elif user_occ == "student" or any(w in msg_lower for w in ["student", "scholarship", "छात्र", "विद्यार्थी"]):
            matched_by_state.sort(key=lambda d: 0 if (d.get("category") == "education" or "scholarship" in str(d.get("name", "")).lower()) else 1)
        return matched_by_state

    # 3. Category / occupation match (e.g. job seeker -> skill & employment)
    matched_by_cat = []
    is_food = any(w in msg_lower for w in ["food", "ration", "rice", "anna", "gehu", "chawal", "अन्न", "राशन", "मुफ्त राशन", "चावल", "गेहूं"])
    is_student = any(w in msg_lower for w in ["student", "scholarship", "education", "padhai", "fee", "college", "school", "छात्र", "छात्रों", "विद्यार्थी", "पढ़ाई", "छात्रवृत्ति"])
    is_skill = (user_occ == "job_seeker") or any(w in msg_lower for w in ["training", "skill", "employment", "rozgar", "transgender", "smile", "kaushal", "ट्रेनिंग", "कौशल", "प्रशिक्षण", "हुनर", "नौकरी", "job", "career"])
    is_health = any(w in msg_lower for w in ["health", "medical", "treatment", "hospital", "surgery", "ilaj", "इलाज", "अस्पताल", "दवा", "स्वास्थ्य", "मुफ्त इलाज"])
    is_energy = any(w in msg_lower for w in ["solar", "bijli", "electricity", "energy", "सोलर", "बिजली"])
    is_women = any(w in msg_lower for w in ["women", "woman", "girl", "female", "mahila", "ladki", "महिला", "महिलाओं", "बेटी", "लड़की", "कन्या", "स्त्री"])

    for doc in all_docs:
        cat = str(doc.get("category", "")).lower()
        b_name = str(doc.get("name", "")).lower()
        elig = str(doc.get("eligibility_text", "")).lower()

        if is_skill and (cat == "skill_employment" or "training" in b_name or "skill" in elig):
            matched_by_cat.append(doc)
        elif is_food and cat == "food":
            matched_by_cat.append(doc)
        elif is_student and (cat == "education" or "scholarship" in b_name or "student" in elig):
            matched_by_cat.append(doc)
        elif is_health and (cat == "health" or "hospital" in elig or "treatment" in elig):
            matched_by_cat.append(doc)
        elif is_energy and cat == "energy_utility":
            matched_by_cat.append(doc)
        elif is_women and ("women" in elig or "female" in elig or "girl" in elig or "scooty" in b_name):
            matched_by_cat.append(doc)

    if matched_by_cat:
        return matched_by_cat

    # 4. Default: return all active listed records
    return [d for d in all_docs if d.get("status") == "active_listed"]


from app.services.profile_extractor import extract_user_profile_facts


def extract_user_profile_from_text(message: str, user_profile: Optional[Dict[str, Any]] = None, context: Optional[Dict[str, Any]] = None) -> FreeBenefitUserProfile:
    """
    Extracts structured user profile facts using the unified extractor.
    Enforces that facts explicitly provided by user are never distorted or defaulted.
    """
    profile_data = user_profile or {}
    extracted = extract_user_profile_facts(
        current_message=message,
        history=context.get("history") if context else None,
        context_profile=profile_data
    )

    msg_lower = message.lower()

    # Extract Category
    category = profile_data.get("category") or extracted.caste
    if not category:
        if "sc" in msg_lower or "scheduled caste" in msg_lower or "अनुसूचित जाति" in msg_lower or "তফসিলি জাতি" in msg_lower:
            category = "SC"
        elif "st" in msg_lower or "scheduled tribe" in msg_lower or "अनुसूचित जनजाति" in msg_lower or "তফসিলি उपজাতি" in msg_lower:
            category = "ST"
        elif "obc" in msg_lower or "other backward" in msg_lower or "पिछड़ा वर्ग" in msg_lower or "इतर मागास" in msg_lower or "অন্যান্য অনগ্রসর" in msg_lower:
            category = "OBC"
        elif "vjnt" in msg_lower or "vj" in msg_lower or "nt" in msg_lower:
            category = "VJNT"
        elif "sebc" in msg_lower:
            category = "SEBC"
        elif "ews" in msg_lower or "आर्थिक रूप से कमजोर" in msg_lower or "ఆర్థికంగా బలహీన" in msg_lower:
            category = "EWS"
        elif "general" in msg_lower or "सामान्य" in msg_lower:
            category = "General"

    is_trans = ("transgender" in msg_lower or "trans" in msg_lower or "third gender" in msg_lower)
    is_student = (extracted.occupation == "student")

    return FreeBenefitUserProfile(
        age=extracted.age,
        gender=extracted.gender.capitalize() if extracted.gender else None,
        state=extracted.state,
        occupation=extracted.occupation,
        annual_family_income=extracted.annual_family_income,
        category=category,
        is_transgender=is_trans,
        is_student=is_student
    )


def handle_free_benefits_chat(
    message: str,
    user_profile: Optional[Dict[str, Any]] = None,
    lang: str = "en",
    context: Optional[Dict[str, Any]] = None
) -> SakhiChatResponse:
    """
    Core grounded handler for Free Benefits & Assistance inquiries.
    Adheres strictly to DATABASE INFORMATION = SOURCE OF TRUTH rule.
    Fully supports all 5 languages: en, hi, mr, bn, te.
    """
    context = context or {}
    msg_lower = message.lower().strip()

    # Dynamic language detection (English, Hindi, Marathi, Bengali, Telugu, Hinglish)
    lang = detect_user_language(message, fallback_lang=lang)

    # Merge context profile if passed
    effective_profile = dict(user_profile or {})
    if context.get("profile") and isinstance(context["profile"], dict):
        effective_profile.update(context["profile"])

    # Multi-turn history extraction: merge history text into profile extraction
    history_texts = []
    if context.get("history") and isinstance(context["history"], list):
        for h in context["history"]:
            if isinstance(h, dict) and h.get("sender") == "user" and h.get("text"):
                history_texts.append(h["text"])
    
    combined_msg_for_profile = " ".join(history_texts + [message])
    profile = extract_user_profile_from_text(combined_msg_for_profile, effective_profile)
    matched_benefits = find_matching_free_benefits(message, profile)

    citations: List[SourceCitation] = []
    actions: List[SakhiActionButton] = []

    # Check if this is a query about eligibility
    is_eligibility_q = any(w in msg_lower for w in [
        "eligible", "patra", "patrata", "qualify", "apply kar sakta", "apply kar sakti",
        "milega kya", "eligibility", "पात्र", "पात्रता", "योग्य", "पात्र आहे का", "योग्य কি", "అర్హుడినా", "అర్హురాలినా"
    ])

    # 1. Eligibility evaluation request
    if is_eligibility_q and matched_benefits:
        target_benefit = matched_benefits[0]
        eval_res = evaluate_single_free_benefit(target_benefit, profile)

        benefit_name = target_benefit.get("name")
        official_url = target_benefit.get("application_url")
        official_source = target_benefit.get("official_source")

        btn_apply_labels = {
            "hi": "आधिकारिक पोर्टल पर आवेदन करें",
            "mr": "अधिकृत पोर्टलवर अर्ज करा",
            "bn": "অফিসিয়াল পোর্টালে আবেদন করুন",
            "te": "అధికారిక పోర్టల్‌లో దరఖాస్తు చేయండి",
            "en": "Apply on Official Website"
        }
        btn_catalog_labels = {
            "hi": "मुफ्त लाभ कैटलॉग",
            "mr": "मोफत लाभ कॅटलॉग",
            "bn": "বিনামূল্যের সুবিধা ক্যাটালগ",
            "te": "ఉచిత ప్రయోజనాల కేటలాగ్",
            "en": "View Free Benefits Catalog"
        }

        if official_url:
            actions.append(SakhiActionButton(label=btn_apply_labels.get(lang, btn_apply_labels["en"]), action="open_url", payload={"url": official_url}))
        elif official_source:
            actions.append(SakhiActionButton(label=btn_apply_labels.get(lang, btn_apply_labels["en"]), action="open_url", payload={"url": official_source}))

        actions.append(SakhiActionButton(label=btn_catalog_labels.get(lang, btn_catalog_labels["en"]), action="navigate", payload={"path": "/free-benefits"}))

        citations.append(SourceCitation(
            scheme_id=target_benefit.get("benefit_id"),
            scheme_name=f"Verified Free Benefit: {benefit_name}",
            authority="Government of India / myScheme",
            official_url=official_url or official_source or "https://www.myscheme.gov.in",
            last_verified=target_benefit.get("last_verified", "2026-09-10")
        ))

        if eval_res.status == "ELIGIBLE":
            if lang == "hi":
                reply_text = (
                    f"**हाँ, सत्यापित मानदंडों के अनुसार आप {benefit_name} के लिए पात्र (ELIGIBLE) हैं।** ✅\n\n"
                    f"**सत्यापित लाभ:** {target_benefit.get('benefit')}\n\n"
                    f"**पात्रता मुख्य बिंदु:**\n" +
                    "\n".join([f"• {r}" for r in eval_res.eligibility_reasons]) +
                    f"\n\n**आवेदन माध्यम:** `{target_benefit.get('application_mode')}`"
                )
            elif lang == "mr":
                reply_text = (
                    f"**होय, सत्यापित निकषांनुसार तुम्ही {benefit_name} साठी पात्र (ELIGIBLE) आहात.** ✅\n\n"
                    f"**सत्यापित लाभ:** {target_benefit.get('benefit')}\n\n"
                    f"**पात्रतेचे मुख्य निकष:**\n" +
                    "\n".join([f"• {r}" for r in eval_res.eligibility_reasons]) +
                    f"\n\n**अर्ज पद्धत:** `{target_benefit.get('application_mode')}`"
                )
            elif lang == "bn":
                reply_text = (
                    f"**হ্যাঁ, যাচাইকৃত মানদণ্ড অনুসারে আপনি {benefit_name}-এর জন্য যোগ্য (ELIGIBLE)।** ✅\n\n"
                    f"**অনুমোদিত সুবিধা:** {target_benefit.get('benefit')}\n\n"
                    f"**যোগ্যতার শর্তাবলী:**\n" +
                    "\n".join([f"• {r}" for r in eval_res.eligibility_reasons]) +
                    f"\n\n**আবেদনের মাধ্যম:** `{target_benefit.get('application_mode')}`"
                )
            elif lang == "te":
                reply_text = (
                    f"**అవును, ధృవీకరించబడిన నిబంధనల ప్రకారం మీరు {benefit_name} కు అర్హులు (ELIGIBLE).** ✅\n\n"
                    f"**ధృవీకరించబడిన ప్రయోజనం:** {target_benefit.get('benefit')}\n\n"
                    f"**అర్హత ముఖ్యాంశాలు:**\n" +
                    "\n".join([f"• {r}" for r in eval_res.eligibility_reasons]) +
                    f"\n\n**దరఖాస్తు విధానం:** `{target_benefit.get('application_mode')}`"
                )
            else:
                reply_text = (
                    f"**Yes, based on the verified eligibility criteria, you appear ELIGIBLE for {benefit_name}.** ✅\n\n"
                    f"**Verified Benefit:** {target_benefit.get('benefit')}\n\n"
                    f"**Eligibility Highlights:**\n" +
                    "\n".join([f"• {r}" for r in eval_res.eligibility_reasons]) +
                    f"\n\n**Application Mode:** `{target_benefit.get('application_mode')}`"
                )

            if target_benefit.get("application_steps"):
                reply_text += f"\n**Steps to Apply / आवेदन प्रक्रिया:** {target_benefit.get('application_steps')}"
            final_status = "ELIGIBLE"

        elif eval_res.status == "ADDITIONAL_INFORMATION_REQUIRED":
            missing_text = eval_res.missing_information_prompt or "Please provide your age, state, category, or annual income."
            missing_prompts = {
                "hi": f"**{benefit_name} के लिए पात्रता निर्धारित करने हेतु अतिरिक्त जानकारी आवश्यक है।**\n\nआपकी पात्रता जांचने के लिए आपकी वार्षिक पारिवारिक आय बताएं।\n\n**आधिकारिक पात्रता नियम:**\n• {target_benefit.get('eligibility_text')}",
                "mr": f"**{benefit_name} साठी पात्रता निश्चित करण्यासाठी अतिरिक्त माहिती आवश्यक आहे.**\n\nतुमची पात्रता तपासण्यासाठी तुमचे वार्षिक कौटुंबिक उत्पन्न सांगा.\n\n**अधिकृत पात्रता नियम:**\n• {target_benefit.get('eligibility_text')}",
                "bn": f"**{benefit_name}-এর জন্য যোগ্যতা যাচাই করতে অতিরিক্ত তথ্য প্রয়োজন।**\n\nআপনার যোগ্যতা যাচাই করতে আপনার বার্ষিক পারিবারিক আয় জানান।\n\n**অফিসিয়াল যোগ্যতার নিয়ম:**\n• {target_benefit.get('eligibility_text')}",
                "te": f"**{benefit_name} కోసం అర్హతను నిర్ణయించడానికి అదనపు సమాచారం అవసరం.**\n\nమీ అర్హతను తనిఖీ చేయడానికి మీ వార్షిక కుటుంబ ఆదాయాన్ని చెప్పండి.\n\n**అధికారిక అర్హత నిబంధనలు:**\n• {target_benefit.get('eligibility_text')}",
                "en": f"**Additional information is required to determine eligibility for {benefit_name}.**\n\nTo evaluate your eligibility, please share your annual family income and age.\n\n**Mandatory Scheme Eligibility Rule:**\n• {target_benefit.get('eligibility_text')}"
            }
            reply_text = missing_prompts.get(lang, missing_prompts["en"])
            final_status = "ADDITIONAL_INFORMATION_REQUIRED"

        elif eval_res.status == "INELIGIBLE":
            failed_text = "\n".join([f"• {f}" for f in eval_res.failed_criteria])
            ineligible_prompts = {
                "hi": f"**उपलब्ध विवरण के आधार पर आप {benefit_name} की पात्रता शर्तों को पूरा नहीं करते हैं।** ❌\n\n**कारण:**\n{failed_text}\n\n**आधिकारिक नियम:** {target_benefit.get('eligibility_text')}",
                "mr": f"**उपलब्ध माहितीच्या आधारे तुम्ही {benefit_name} च्या पात्रता अटी पूर्ण करत नाही.** ❌\n\n**कारणे:**\n{failed_text}\n\n**अधिकृत नियम:** {target_benefit.get('eligibility_text')}",
                "bn": f"**উপলব্ধ তথ্যের ভিত্তিতে আপনি {benefit_name}-এর যোগ্যতার শর্ত পূরণ করছেন না।** ❌\n\n**কারণসমূহ:**\n{failed_text}\n\n**অফিসিয়াল নিয়ম:** {target_benefit.get('eligibility_text')}",
                "te": f"**అందుబాటులో ఉన్న వివరాల ఆధారంగా మీరు {benefit_name} యొక్క అర్హత నిబంధనలను తీర్చడం లేదు.** ❌\n\n**కారణాలు:**\n{failed_text}\n\n**అధికారిక నిబంధన:** {target_benefit.get('eligibility_text')}",
                "en": f"**Based on the available criteria, you do not meet the eligibility conditions for {benefit_name}.** ❌\n\n**Reasons:**\n{failed_text}\n\n**Official Rule:** {target_benefit.get('eligibility_text')}"
            }
            reply_text = ineligible_prompts.get(lang, ineligible_prompts["en"])
            final_status = "INELIGIBLE"
        else:
            no_match_texts = {
                "hi": "सत्यापित कैटलॉग में कोई उपयुक्त मुफ्त लाभ नहीं मिला।",
                "mr": "सत्यापित कॅटलॉगमध्ये कोणताही योग्य मोफत लाभ आढळला नाही.",
                "bn": "যাচাইকৃত ক্যাটালগে উপযুক্ত কোনো বিনামূল্যে সুবিধা পাওয়া যায়নি।",
                "te": "ధృవీకరించబడిన కేటలాగ్‌లో తగిన ఉచిత ప్రయోజనం కనుగొనబడలేదు.",
                "en": "No applicable free benefit matched your criteria in the verified catalog."
            }
            reply_text = no_match_texts.get(lang, no_match_texts["en"])
            final_status = "NO_APPLICABLE_BENEFIT"

        # Explicit Subsidy vs Completely Free Guardrail (Requirement 7)
        if target_benefit.get("benefit_id") == "CENTRAL-PM-SURYA-GHAR" or target_benefit.get("benefit_type") == "subsidy":
            subsidy_notes = {
                "hi": "\n\n> **महत्वपूर्ण सत्यापन नोट:** पीएम सूर्य घर योजना केंद्र सरकार द्वारा रूफटॉप सोलर स्थापना लागत को कम करने के लिए दी जाने वाली एक **वित्तीय पूंजी सब्सिडी** (3 kW तक के लिए ₹78,000 तक) है, यह 100% पूर्णतः मुफ्त स्थापना नहीं है।",
                "mr": "\n\n> **महत्त्वाची पडताळणी नोंद:** पीएम सूर्य घर योजना ही छतावरील सौर यंत्रणा उभारणी खर्च कमी करण्यासाठी सरकारकडून दिली जाणारी **आर्थिक भांडवली सबसिडी (अनुदान)** आहे, ही १००% पूर्णपणे मोफत स्थापना नाही.",
                "bn": "\n\n> **গুরুত্বপূর্ণ তথ্য:** পিএম সূর্য ঘর যোজনা হলো ছাদে সৌর প্যানেল ইনস্টলেশন খরচ কমাতে সরকার প্রদত্ত একটি **আর্থিক মূলধন ভর্তুকি (সাবসিডি)**, এটি শতভাগ বিনামূল্যে সম্পূর্ণ ইনস্টলেশন নয়।",
                "te": "\n\n> **ముఖ్యమైన గమనిక:** పిఎం సూర్య ఘర్ పథకం సోలార్ రూఫ్‌టాప్ ఏర్పాటు ఖర్చును తగ్గించడానికి కేంద్ర ప్రభుత్వం అందించే **ఆర్థిక మూలధన సబ్సిడీ**, ఇది 100% పూర్తిగా ఉచిత సంస్థాపన కాదు.",
                "en": "\n\n> **Important Verification Note:** PM Surya Ghar: Muft Bijli Yojana is a **financial capital subsidy** programme (up to ₹78,000 for up to 3 kW) provided by the Central Government to reduce rooftop solar installation costs, and is **not** a 100% completely free installation."
            }
            reply_text += subsidy_notes.get(lang, subsidy_notes["en"])

        return SakhiChatResponse(
            answer=reply_text,
            language=lang,
            intent="free_benefits_eligibility",
            sources=citations,
            eligibility_result=final_status,
            action_buttons=actions,
            suggested_prompts=["What is PMGKAY?", "Ayushman Bharat eligibility", "PM Surya Ghar subsidy", "All Free Benefits"],
            disclaimer="Evaluation generated strictly from verified government gazette & myScheme records."
        )

    # 2. General / Specific Free Benefits inquiry
    if not matched_benefits:
        empty_answers = {
            "hi": "वर्तमान में हमारे सत्यापित मुफ्त सरकारी लाभ कैटलॉग में 22 आधिकारिक रूप से सत्यापित योजनाएं शामिल हैं (जैसे PMGKAY मुफ्त खाद्यान्न, आयुष्मान भारत PM-JAY ₹5 लाख मुफ्त इलाज, PMKVY कौशल प्रशिक्षण, और छात्रवृत्तियां)। आपके खोज मानदंड से मेल खाता कोई रिकॉर्ड नहीं मिला।",
            "mr": "सध्या आमच्या अधिकृत मोफत सरकारी लाभ कॅटलॉगमध्ये २२ सत्यापित योजना समाविष्ट आहेत (उदा. PMGKAY मोफत धान्य, आयुष्यमान भारत मोफत उपचार, PMKVY कौशल्य प्रशिक्षण, आणि शिष्यवृत्ती). तुमच्या निकषांशी जुळणारा कोणताही थेट रेकॉर्ड आढळला नाही.",
            "bn": "বর্তমানে আমাদের যাচাইকৃত সরকারি সুবিধা ক্যাটালগে ২২টি অনুমোদিত স্কিম রয়েছে (যেমন PMGKAY বিনামূল্যে খাদ্যশস্য, আয়ুষ্মান ভারত বিনামূল্যে চিকিৎসা, PMKVY দক্ষতা প্রশিক্ষণ এবং বৃত্তি)। আপনার অনুসন্ধানের সাথে সরাসরি মিলে এমন কোনো রেকর্ড পাওয়া যায়নি।",
            "te": "ప్రస్తుతం మా ధృవీకరించబడిన ఉచిత ప్రభుత్వ ప్రయోజనాల కేటలాగ్‌లో 22 అధికారిక పథకాలు ఉన్నాయి (ఉదాహరణకు PMGKAY ఉచిత రేషన్, ఆయుష్మాన్ భారత్ ఉచిత చికిత్స, PMKVY నైపుణ్య శిక్షణ మరియు స్కాలర్‌షిప్‌లు). మీ శోధనకు సరిపోలే రికార్డు కనుగొనబడలేదు.",
            "en": (
                "Currently, our verified Free Benefits & Assistance catalog contains 22 officially verified Central, State, and UT schemes "
                "(including PMGKAY free food grains, Ayushman Bharat PM-JAY health coverage, PMKVY skill training, PM Surya Ghar subsidy, and state scholarships). "
                "No verified record directly matched your exact search query. You can browse all active schemes in our Free Benefits catalog."
            )
        }
        btn_browse = {
            "hi": "मुफ्त लाभ कैटलॉग देखें",
            "mr": "मोफत लाभ कॅटलॉग पहा",
            "bn": "বিনামূল্যের সুবিধা ক্যাটালগ দেখুন",
            "te": "ఉచిత ప్రయోజనాల కేటలాగ్ చూడండి",
            "en": "Browse Free Benefits"
        }
        return SakhiChatResponse(
            answer=empty_answers.get(lang, empty_answers["en"]),
            language=lang,
            intent="free_benefits_info",
            sources=[SourceCitation(scheme_id="FREE-BENEFITS-CATALOG", scheme_name="SANCHAY Verified Free Benefits", authority="Government of India / myScheme", official_url="https://www.myscheme.gov.in", last_verified="2026-09-10")],
            action_buttons=[SakhiActionButton(label=btn_browse.get(lang, btn_browse["en"]), action="navigate", payload={"path": "/free-benefits"})],
            eligibility_result="NO_APPLICABLE_BENEFIT",
            suggested_prompts=["What is PMGKAY?", "Ayushman Bharat eligibility", "PM Surya Ghar subsidy", "All Free Benefits"],
            disclaimer="Information sourced from official myScheme & State government portals."
        )

    # Build grounded informative response for matched benefits
    lines = []
    intro_headers = {
        "hi": "आधिकारिक डेटाबेस से सत्यापित **100% मुफ्त सरकारी लाभ व योजनाएं** नीचे दी गई हैं:\n",
        "mr": "अधिकृत डेटाबेसमधून तुमच्या विनंतीनुसार सत्यापित **मोफत सरकारी लाभ आणि योजना** खालीलप्रमाणे आहेत:\n",
        "bn": "অফিসিয়াল ডেটাবেস থেকে আপনার অনুরোধের ভিত্তিতে যাচাইকৃত **বিনামূল্যের সরকারি সুবিধাসমূহ** নিচে দেওয়া হলো:\n",
        "te": "అధికారిక డేటాబేస్ నుండి ధృవీకరించబడిన **ఉచిత ప్రభుత్వ ప్రయోజనాలు మరియు పథకాలు** క్రింద ఇవ్వబడ్డాయి:\n",
        "en": "Here are the verified **Free Benefits & Assistance** programs matching your query from the official database:\n"
    }
    lines.append(intro_headers.get(lang, intro_headers["en"]))

    labels = {
        "hi": {"type": "श्रेणी व प्रकार", "benefit": "क्या लाभ मिलेगा", "elig": "पात्रता मानदंड", "elig_status": "पात्रता स्थिति", "apply": "आवेदन लिंक", "mode": "आवेदन माध्यम", "portal": "आधिकारिक पोर्टल पर आवेदन करें"},
        "mr": {"type": "प्रवर्ग व प्रकार", "benefit": "काय लाभ मिळेल", "elig": "पात्रता निकष", "elig_status": "पात्रता स्थिती", "apply": "अर्ज लिंक", "mode": "अर्ज पद्धत", "portal": "अधिकृत पोर्टलवर अर्ज करा"},
        "bn": {"type": "বিভাগ ও ধরন", "benefit": "কী সুবিধা পাবেন", "elig": "কারা যোগ্য", "elig_status": "যোগ্যতার অবস্থা", "apply": "আবেদনের লিঙ্ক", "mode": "আবেদনের মাধ্যম", "portal": "অফিসিয়াল পোর্টালে আবেদন করুন"},
        "te": {"type": "వర్గం & రకం", "benefit": "లభించే ప్రయోజనం", "elig": "అర్హత నిబంధనలు", "elig_status": "అర్హత స్థితి", "apply": "దరఖాస్తు లింక్", "mode": "దరఖాస్తు విధానం", "portal": "అధికారిక పోర్టల్‌లో దరఖాస్తు చేయండి"},
        "en": {"type": "Category & Type", "benefit": "What you get", "elig": "Eligibility Criteria", "elig_status": "Statutory Eligibility", "apply": "Application Link", "mode": "Application Mode", "portal": "Official Application Portal"}
    }
    cur_labels = labels.get(lang, labels["en"])

    eval_results = []
    for i, b in enumerate(matched_benefits[:3], 1):
        b_name = b.get("name")
        b_state = b.get("state")
        b_type = b.get("benefit_type", "").replace("_", " ").title()
        b_summary = b.get("benefit")
        b_elig = b.get("eligibility_text")
        b_app_url = b.get("application_url")
        b_source = b.get("official_source")

        # Evaluate using deterministic free benefits engine
        eval_res = evaluate_single_free_benefit(b, profile)
        eval_results.append(eval_res)

        lines.append(f"### {i}. {b_name} ({b_state})")
        lines.append(f"- **{cur_labels['type']}:** {b_type}")
        lines.append(f"- **{cur_labels['benefit']}:** {b_summary}")
        lines.append(f"- **{cur_labels['elig']}:** {b_elig}")

        # Deterministic engine status badge
        if eval_res.status == "ELIGIBLE":
            reason_text = " • ".join(eval_res.eligibility_reasons[:2]) if eval_res.eligibility_reasons else "All statutory criteria satisfied"
            lines.append(f"- **{cur_labels['elig_status']}:** ✅ **ELIGIBLE (पात्र)** — {reason_text}")
        elif eval_res.status == "INELIGIBLE":
            failed_text = " • ".join(eval_res.failed_criteria[:1]) if eval_res.failed_criteria else "Statutory conditions not met"
            lines.append(f"- **{cur_labels['elig_status']}:** ❌ **INELIGIBLE (अपात्र)** — {failed_text}")
        else:
            missing_text = eval_res.missing_information_prompt or "Provide age, state, or income to verify statutory eligibility"
            lines.append(f"- **{cur_labels['elig_status']}:** ⚠️ **ADDITIONAL_INFORMATION_REQUIRED** — {missing_text}")

        # Explicit Subsidy vs Completely Free Guardrail (Section 9)
        if b.get("benefit_id") == "CENTRAL-PM-SURYA-GHAR" or b.get("benefit_type") == "subsidy":
            sub_notes = {
                "hi": "- **सब्सिडी नोट:** *यह सोलर रूफटॉप स्थापना लागत घटाने हेतु केंद्र सरकार द्वारा दी जाने वाली वित्तीय पूंजी सब्सिडी (₹78,000 तक) है; यह 100% मुफ्त नहीं है।*",
                "mr": "- **सबसिडी नोंद:** *हा सोलर रूफटॉप उभारणी खर्च कमी करण्यासाठी सरकारकडून दिला जाणारा आर्थिक भांडवली सबसिडी (अनुदान) कार्यक्रम आहे; ही १००% मोफत स्थापना नाही.*",
                "bn": "- **ভর্তুকি তথ্য:** *এটি সোলার রুফটপ ইনস্টলেশন খরচ কমাতে সরকার প্রদত্ত আর্থিক মূলধন ভর্তুকি (সাবসিডি); এটি শতভাগ বিনামূল্যে সম্পূর্ণ ইনস্টলেশন নয়।*",
                "te": "- **సబ్సిడీ గమనిక:** *ఇది సోలార్ రూఫ్‌టాప్ ఏర్పాటు ఖర్చును తగ్గించడానికి కేంద్ర ప్రభుత్వం అందించే ఆర్థిక మూలధన సబ్సిడీ; ఇది 100% ఉచిత సంస్థాపన కాదు.*",
                "en": "- **Subsidy Note:** *This is a Central Government financial capital subsidy to offset rooftop solar installation costs; it is not a 100% completely free installation.*"
            }
            lines.append(sub_notes.get(lang, sub_notes["en"]))

        if b_app_url:
            lines.append(f"- **{cur_labels['apply']}:** [{cur_labels['portal']}]({b_app_url})")
            if len(actions) < 2:
                actions.append(SakhiActionButton(label=f"Apply for {b_name[:20]}...", action="open_url", payload={"url": b_app_url}))
        else:
            lines.append(f"- **{cur_labels['mode']}:** `{b.get('application_mode')}` (Source: [{b_name}]({b_source}))")

        lines.append("")

        citations.append(SourceCitation(
            scheme_id=b.get("benefit_id"),
            scheme_name=f"{b_name} ({b_state})",
            authority="Government of India / myScheme",
            official_url=b_app_url or b_source or "https://www.myscheme.gov.in",
            last_verified=b.get("last_verified", "2026-09-10")
        ))

    btn_explore = {
        "hi": "सभी मुफ्त लाभ देखें",
        "mr": "सर्व मोफत लाभ पहा",
        "bn": "সব বিনামূল্যের সুবিধা দেখুন",
        "te": "అన్ని ఉచిత ప్రయోజనాలను చూడండి",
        "en": "Explore All Free Benefits"
    }
    actions.append(SakhiActionButton(label=btn_explore.get(lang, btn_explore["en"]), action="navigate", payload={"path": "/free-benefits"}))

    # Determine overall status strictly from deterministic engine
    if any(e.status == "ELIGIBLE" for e in eval_results):
        fb_eligibility_status = "ELIGIBLE"
    elif any(e.status == "ADDITIONAL_INFORMATION_REQUIRED" for e in eval_results):
        fb_eligibility_status = "ADDITIONAL_INFORMATION_REQUIRED"
    elif all(e.status == "INELIGIBLE" for e in eval_results):
        fb_eligibility_status = "INELIGIBLE"
    else:
        fb_eligibility_status = "ADDITIONAL_INFORMATION_REQUIRED"

    return SakhiChatResponse(
        answer="\n".join(lines),
        language=lang,
        intent="free_benefits_info",
        sources=citations,
        action_buttons=actions,
        eligibility_result=fb_eligibility_status,
        suggested_prompts=["Tell me about PMGKAY", "Ayushman Bharat eligibility", "PM Surya Ghar subsidy", "All Free Benefits"],
        disclaimer="Information strictly verified against official central & state government sources."
    )
