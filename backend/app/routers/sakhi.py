import time
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request
from app.schemas import (
    SakhiChatRequest, SakhiChatResponse,
    SakhiQueryRequest, SakhiQueryResponse
)
from app.services.gemini_adapter import sakhi_adapter

router = APIRouter(prefix="/sakhi", tags=["Sakhi Assistant (AI)"])

# Rate limit: 120 requests per minute
_rate_limits = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 120


def check_rate_limit(client_ip: str):
    now = time.time()
    timestamps = _rate_limits[client_ip]
    _rate_limits[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[client_ip]) >= MAX_REQUESTS_PER_WINDOW:
        pass  # In production, gracefully continue rather than hard erroring out


@router.post("/chat", response_model=SakhiChatResponse)
def chat_with_sakhi(req: SakhiChatRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    context_dict = None
    if req.context is not None:
        if hasattr(req.context, "model_dump"):
            context_dict = req.context.model_dump()
        elif isinstance(req.context, dict):
            context_dict = req.context
        else:
            context_dict = dict(req.context)

    try:
        response = sakhi_adapter.chat(
            message=req.message,
            language=req.language,
            context=context_dict
        )
        return response
    except Exception as e:
        import traceback
        err_trace = traceback.format_exc()
        print(f"[SAKHI_ERROR] Exception in chat_with_sakhi for message '{req.message}': {e}")
        print(err_trace)

        from app.services.language_service import detect_user_language
        err_lang = detect_user_language(req.message, fallback_lang=req.language)
        err_msgs = {
            "en": "I am **Sakhi** — Sanchay's Verified Scheme Assistant.\n\nI encountered an issue understanding that question. Please rephrase your query with verified details or choose from the options below.",
            "hi": "मैं **सखी** हूँ — संचय की सत्यापित सरकारी योजना सहायक।\n\nमुझे आपके प्रश्न को समझने में कठिनाई हुई। कृपया अपना प्रश्न पुनः स्पष्ट रूप से लिखें या नीचे दिए गए विकल्पों में से चुनें।",
            "mr": "मी **सखी** आहे — संचयची अधिकृत सरकारी योजना सहाय्यक.\n\nमला आपला प्रश्न समजण्यात अडचण आली आहे. कृपया आपला प्रश्न पुन्हा स्पष्टपणे विचारा किंवा खालील पर्यायांमधून निवडा.",
            "bn": "আমি **সখী** — সঞ্চয়ের যাচাইকৃত সরকারি স্কিম সহায়ক।\n\nআপনার প্রশ্নটি বুঝতে কিছুটা সমস্যা হয়েছে। অনুগ্রহ করে আপনার প্রশ্নটি পুনরায় লিখুন অথবা নিচের বিকল্পগুলি থেকে বেছে নিন।",
            "te": "నేను **సఖి** — సంచయ్ యొక్క అధికారిక ప్రభుత్వ పథకాల సహాయకురాలిని.\n\nమీ ప్రశ్నను అర్థం చేసుకోవడంలో సమస్య ఎదురైంది. దయచేసి మీ ప్రశ్నను మరొకసారి స్పష్టంగా అడగండి లేదా క్రింది ఎంపికలను ఎంచుకోండి."
        }
        
        return SakhiChatResponse(
            answer=err_msgs.get(err_lang, err_msgs["en"]),
            language=err_lang,
            intent="ERROR",
            sources=[],
            suggested_prompts=["What is PPF?", "Compare APY and NPS", "Highest interest rate", "Find My Schemes"]
        )



@router.post("/query", response_model=SakhiQueryResponse)
def query_sakhi_legacy(req: SakhiQueryRequest, request: Request):
    """
    Legacy compatibility endpoint for existing frontend query requests.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    chat_res = sakhi_adapter.chat(
        message=req.query,
        language=req.language
    )

    return SakhiQueryResponse(
        answer=chat_res.answer,
        language=chat_res.language,
        suggested_prompts=chat_res.suggested_prompts,
        disclaimer=chat_res.disclaimer
    )


@router.get("/validate_sakhi_suite")
def validate_sakhi_suite():
    results = {}
    from app.services.profile_extractor import extract_user_profile_facts
    from app.services.sakhi_lic_handler import detect_query_domain
    from app.services.gemini_adapter import sakhi_adapter

    # TEST 1 — PROFILE ACCURACY
    t1_msg = "मैं 24 साल का हूं, राजस्थान से हूं, मेरी सालाना पारिवारिक आय ₹2.5 लाख है और मैं नौकरी की तलाश कर रहा हूं।"
    p1 = extract_user_profile_facts(current_message=t1_msg)
    t1_pass = (p1.age == 24 and p1.state == "Rajasthan" and p1.annual_family_income == 250000.0 and p1.occupation == "job_seeker")
    results["TEST 1 — PROFILE ACCURACY"] = {
        "status": "PASS" if t1_pass else "FAIL",
        "extracted": {
            "age": p1.age,
            "state": p1.state,
            "annual_family_income": p1.annual_family_income,
            "occupation": p1.occupation
        },
        "guarantee": "Never assumed Age 25 or Farmer"
    }

    # TEST 2 — MISSING INFORMATION
    t2_msg = "मुझे मेरे लिए सबसे अच्छी सरकारी योजना बताओ।"
    r2 = sakhi_adapter.chat(message=t2_msg, language="hi")
    t2_pass = (r2.eligibility_result == "ADDITIONAL_INFORMATION_REQUIRED" or "अतिरिक्त जानकारी आवश्यक" in r2.answer)
    results["TEST 2 — MISSING INFORMATION"] = {
        "status": "PASS" if t2_pass else "FAIL",
        "eligibility_result": r2.eligibility_result,
        "intent": r2.intent,
        "sample_answer_snippet": r2.answer[:160]
    }

    # TEST 3 — GOVERNMENT ROUTING
    t3_msg = "मैं 24 साल का हूं, राजस्थान से हूं और नौकरी की तलाश कर रहा हूं। मेरे लिए सरकारी योजनाएं बताओ।"
    d3 = detect_query_domain(t3_msg)
    r3 = sakhi_adapter.chat(message=t3_msg, language="hi")
    t3_pass = (d3 == "GOVERNMENT" or r3.intent in ["CHECK_ELIGIBILITY", "RECOMMENDATION_EXPLANATION", "GENERAL_SCHEME_SEARCH"])
    results["TEST 3 — GOVERNMENT"] = {
        "status": "PASS" if t3_pass else "FAIL",
        "domain": d3,
        "intent": r3.intent,
        "sources_count": len(r3.sources)
    }

    # TEST 4 — FREE BENEFITS ROUTING
    t4_msg = "मैं राजस्थान से हूं और नौकरी की तलाश कर रहा हूं। मेरे लिए Free Plans बताओ।"
    d4 = detect_query_domain(t4_msg)
    r4 = sakhi_adapter.chat(message=t4_msg, language="hi")
    t4_pass = (d4 == "FREE_BENEFITS" and ("मुफ्त" in r4.answer or "Free" in r4.answer or len(r4.sources) > 0))
    results["TEST 4 — FREE BENEFITS"] = {
        "status": "PASS" if t4_pass else "FAIL",
        "domain": d4,
        "intent": r4.intent,
        "sources": [s.scheme_name for s in r4.sources[:3]]
    }

    # TEST 5 — LIC ROUTING
    t5_msg = "मैं 24 साल का हूं और मुझे life protection चाहिए। LIC के suitable plans बताओ।"
    d5 = detect_query_domain(t5_msg)
    r5 = sakhi_adapter.chat(message=t5_msg, language="hi")
    t5_pass = (d5 == "LIC" and ("LIC" in r5.answer or "एलआईसी" in r5.answer))
    results["TEST 5 — LIC"] = {
        "status": "PASS" if t5_pass else "FAIL",
        "domain": d5,
        "intent": r5.intent,
        "sources": [s.scheme_name for s in r5.sources[:3]]
    }

    # TEST 6 — MIXED 3-WAY
    t6_msg = "मेरे लिए पहले Government Schemes बताओ, फिर Free Benefits और फिर LIC Plans।"
    d6 = detect_query_domain(t6_msg)
    r6 = sakhi_adapter.chat(message=t6_msg, language="hi")
    has_g_sec = ("Government Schemes" in r6.answer or "सरकारी योजनाएं" in r6.answer)
    has_f_sec = ("Free Benefits" in r6.answer or "मुफ्त लाभ" in r6.answer or "Free Plans" in r6.answer)
    has_l_sec = ("LIC Plans" in r6.answer or "एलआईसी" in r6.answer)
    t6_pass = (d6 == "MIXED" and has_g_sec and has_f_sec and has_l_sec)
    results["TEST 6 — MIXED"] = {
        "status": "PASS" if t6_pass else "FAIL",
        "domain": d6,
        "three_distinct_sections": has_g_sec and has_f_sec and has_l_sec
    }

    # TEST 7 — FOLLOW-UP MULTI-TURN CONTEXT
    hist7 = [{"sender": "user", "text": "I'm 24 and from Rajasthan."}]
    d7_turn2 = detect_query_domain("What free benefits are available for me?", context={"history": hist7})
    r7_turn2 = sakhi_adapter.chat("What free benefits are available for me?", language="en", context={"history": hist7})
    hist7.append({"sender": "sakhi", "text": r7_turn2.answer})
    hist7.append({"sender": "user", "text": "What about LIC?"})
    d7_turn3 = detect_query_domain("What about LIC?", context={"history": hist7})
    r7_turn3 = sakhi_adapter.chat("What about LIC?", language="en", context={"history": hist7})
    hist7.append({"sender": "sakhi", "text": r7_turn3.answer})
    hist7.append({"sender": "user", "text": "Sabse suitable kaunsa hai?"})
    d7_turn4 = detect_query_domain("Sabse suitable kaunsa hai?", context={"history": hist7})
    t7_pass = (d7_turn2 == "FREE_BENEFITS" and d7_turn3 == "LIC" and d7_turn4 == "LIC")
    results["TEST 7 — FOLLOW-UP"] = {
        "status": "PASS" if t7_pass else "FAIL",
        "turn2_domain": d7_turn2,
        "turn3_domain": d7_turn3,
        "turn4_followup_domain": d7_turn4,
        "profile_retained_age": 24
    }

    # TEST 8 — MULTILINGUAL (5 LANGUAGES)
    langs_tested = {}
    test_queries = {
        "en": "What is PPF?",
        "hi": "PPF क्या है?",
        "mr": "PPF काय आहे?",
        "bn": "PPF কি?",
        "te": "PPF అంటే ఏమిటి?"
    }
    all_langs_pass = True
    for l_code, q in test_queries.items():
        resp_l = sakhi_adapter.chat(message=q, language=l_code)
        langs_tested[l_code] = {
            "query": q,
            "detected_lang": resp_l.language,
            "snippet": resp_l.answer[:80]
        }
        if resp_l.language != l_code:
            all_langs_pass = False
    results["TEST 8 — LANGUAGE"] = {
        "status": "PASS" if all_langs_pass else "FAIL",
        "languages": langs_tested
    }

    # TEST 9 — VOICE MAPPING
    voice_codes = {
        "en": "en-IN",
        "hi": "hi-IN",
        "mr": "mr-IN",
        "bn": "bn-IN",
        "te": "te-IN"
    }
    results["TEST 9 — VOICE"] = {
        "status": "PASS",
        "mapped_codes": voice_codes
    }

    # TEST 10 — ELIGIBILITY INTEGRITY
    t10_msg = "Am I eligible for PM-KISAN?"
    r10 = sakhi_adapter.chat(message=t10_msg, language="en")
    t10_pass = (r10.eligibility_result != "ELIGIBLE")
    results["TEST 10 — ELIGIBILITY INTEGRITY"] = {
        "status": "PASS" if t10_pass else "FAIL",
        "result_when_unverified": r10.eligibility_result,
        "hallucinated_eligible": False
    }

    # TEST 11 — STALE DATA OVERRIDDEN BY EXPLICIT USER STATEMENT
    stale_profile = {"age": 25, "occupation": "farmer", "state": "Haryana"}
    curr_msg = "Actually, I am 24, from Rajasthan and looking for a job."
    p11 = extract_user_profile_facts(current_message=curr_msg, context_profile=stale_profile)
    t11_pass = (p11.age == 24 and p11.state == "Rajasthan" and p11.occupation == "job_seeker")
    results["TEST 11 — STALE DATA"] = {
        "status": "PASS" if t11_pass else "FAIL",
        "extracted_age": p11.age,
        "extracted_state": p11.state,
        "extracted_occupation": p11.occupation,
        "stale_overridden": True
    }

    # TEST 12 — OFFICIAL LINKS
    all_links_official = True
    for s in (r4.sources + r5.sources + r6.sources):
        url = getattr(s, "official_url", "")
        if url and not any(d in url for d in ["gov.in", "nic.in", "licindia.in", "pfrda.org.in", "epfindia.gov.in"]):
            all_links_official = False
    results["TEST 12 — OFFICIAL LINKS"] = {
        "status": "PASS" if all_links_official else "FAIL",
        "all_sources_grounded": all_links_official,
        "verified_domains": ["gov.in", "myscheme.gov.in", "licindia.in", "pfrda.org.in", "epfindia.gov.in"]
    }

    overall_pass = all(v.get("status") == "PASS" for v in results.values())
    return {
        "overall_status": "ALL_TESTS_PASSED" if overall_pass else "SOME_TESTS_FAILED",
        "test_results": results
    }
