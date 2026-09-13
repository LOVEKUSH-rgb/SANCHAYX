import os
import sys
import pytest
import re

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.gemini_adapter import GeminiSakhiAdapter, sakhi_adapter
from app.database import init_db, get_schemes_collection
from app.engine import evaluate_eligibility
from app.routers.recommendations import generate_recommendations
from app.schemas import UserProfile, UserPreferences

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

# ==============================================================================
# TEST GROUP A — BASIC
# ==============================================================================
def test_group_a_basic_explanations():
    adapter = GeminiSakhiAdapter()
    
    # 1. PPF
    res_ppf = adapter.chat("What is PPF?", language="en")
    assert res_ppf.intent in ["EXPLAIN_SCHEME", "BENEFITS"]
    assert "PPF" in res_ppf.answer or "Public Provident Fund" in res_ppf.answer
    assert len(res_ppf.sources) >= 1
    assert any("Ministry of Finance" in s.source_authority or "Department of Economic Affairs" in s.source_authority or "Government" in s.source_authority for s in res_ppf.sources)
    
    # 2. APY
    res_apy = adapter.chat("What is APY?", language="en")
    assert "APY" in res_apy.answer or "Atal Pension" in res_apy.answer
    assert len(res_apy.sources) >= 1
    
    # 3. PMJDY
    res_pmjdy = adapter.chat("Explain PMJDY.", language="en")
    assert "PMJDY" in res_pmjdy.answer or "Jan Dhan" in res_pmjdy.answer
    assert len(res_pmjdy.sources) >= 1


# ==============================================================================
# TEST GROUP B — AGE HARD GATE
# ==============================================================================
def test_group_b_age_eligibility():
    adapter = GeminiSakhiAdapter()
    
    # 1. Age 16 (Minor for adult schemes like APY/SCSS)
    res_16 = adapter.chat(
        "I am 16. Am I eligible for APY?",
        language="en",
        context={"scheme_id": "apy_001", "profile": {"age": 16}}
    )
    assert res_16.eligibility_result == "INELIGIBLE"
    assert "16" in res_16.answer or "18" in res_16.answer or "not eligible" in res_16.answer.lower()
    
    # 2. Age 28 for APY (Eligible: 18-40)
    res_28 = adapter.chat(
        "I am 28. Am I eligible for APY?",
        language="en",
        context={"scheme_id": "apy_001", "profile": {"age": 28}}
    )
    assert res_28.eligibility_result == "ELIGIBLE"
    assert "eligible" in res_28.answer.lower()
    
    # 3. Age 65 for Senior Citizen (SCSS: 60+)
    res_65 = adapter.chat(
        "I am 65. What senior citizen options are available?",
        language="en",
        context={"profile": {"age": 65}}
    )
    assert "SCSS" in res_65.answer or "Senior Citizen" in res_65.answer or len(res_65.sources) >= 1


# ==============================================================================
# TEST GROUP C — OCCUPATION FILTERING
# ==============================================================================
def test_group_c_occupation_filtering():
    adapter = GeminiSakhiAdapter()
    
    # 1. Farmer
    res_farmer = adapter.chat("I am a farmer. Which schemes are relevant?", language="en")
    assert any(k in res_farmer.answer for k in ["PM-KMY", "KMY", "Kisan", "Farmer", "Agriculture"]) or len(res_farmer.sources) >= 1
    
    # 2. Street Vendor
    res_vendor = adapter.chat("I am a street vendor. What schemes can I consider?", language="en")
    assert any(k in res_vendor.answer for k in ["SVANidhi", "PMSVANidhi", "Street Vendor", "Vendor"]) or len(res_vendor.sources) >= 1
    
    # 3. Self-employed / Unorganised worker
    res_unorg = adapter.chat("I am self-employed unorganised worker. Which pension options are available?", language="en")
    assert any(k in res_unorg.answer for k in ["PM-SYM", "NPS", "APY", "Pension", "Shram Yogi"]) or len(res_unorg.sources) >= 1


# ==============================================================================
# TEST GROUP D — GOAL MATCHING
# ==============================================================================
def test_group_d_goal_matching():
    adapter = GeminiSakhiAdapter()
    res_goal = adapter.chat("I want to save for my daughter's education for 12 years.", language="en")
    assert any(k in res_goal.answer for k in ["Sukanya", "SSY", "PPF", "Education", "Girl Child"]) or len(res_goal.sources) >= 1


# ==============================================================================
# TEST GROUP E — BUDGET MATCHING
# ==============================================================================
def test_group_e_budget_matching():
    adapter = GeminiSakhiAdapter()
    res_budget = adapter.chat("I can save ₹2,000 per month.", language="en")
    assert len(res_budget.sources) >= 1
    assert len(res_budget.answer) > 20


# ==============================================================================
# TEST GROUP F — LIQUIDITY
# ==============================================================================
def test_group_f_liquidity():
    adapter = GeminiSakhiAdapter()
    res_liq = adapter.chat("I need an option with high liquidity.", language="en")
    assert len(res_liq.sources) >= 1
    assert len(res_liq.answer) > 20


# ==============================================================================
# TEST GROUP G — NO MATCH / INELIGIBILITY
# ==============================================================================
def test_group_g_no_match_ineligible():
    adapter = GeminiSakhiAdapter()
    res_ineligible = adapter.chat(
        "I am 16. Am I eligible for SCSS?",
        language="en",
        context={"scheme_id": "scss_001", "profile": {"age": 16}}
    )
    assert res_ineligible.eligibility_result == "INELIGIBLE"
    assert "not eligible" in res_ineligible.answer.lower() or "ineligible" in res_ineligible.answer.lower() or "60" in res_ineligible.answer


# ==============================================================================
# TEST GROUP H — NRI RESIDENCY RULES
# ==============================================================================
def test_group_h_nri_rules():
    adapter = GeminiSakhiAdapter()
    res_nri = adapter.chat(
        "I am an NRI. Can I open a new PPF account?",
        language="en",
        context={"scheme_id": "ppf_001", "profile": {"residency_status": "nri"}}
    )
    assert res_nri.eligibility_result == "INELIGIBLE"
    assert "nri" in res_nri.answer.lower() or "resident" in res_nri.answer.lower() or "not eligible" in res_nri.answer.lower()


# ==============================================================================
# TEST GROUP I — COMPARISON
# ==============================================================================
def test_group_i_comparison():
    adapter = GeminiSakhiAdapter()
    res_comp = adapter.chat("Compare PPF, NSC and KVP.", language="en")
    assert res_comp.intent == "COMPARE_SCHEMES"
    assert "PPF" in res_comp.answer
    assert len(res_comp.sources) >= 2


# ==============================================================================
# TEST GROUP J — WHY RECOMMENDED
# ==============================================================================
def test_group_j_why_recommended():
    adapter = GeminiSakhiAdapter()
    res_why = adapter.chat(
        "Why did you recommend PPF?",
        language="en",
        context={"scheme_id": "ppf_001"}
    )
    assert "PPF" in res_why.answer or "Public Provident Fund" in res_why.answer
    assert len(res_why.sources) >= 1


# ==============================================================================
# TEST GROUP K — HALLUCINATION DEFENSE
# ==============================================================================
def test_group_k_hallucination_guardrail():
    adapter = GeminiSakhiAdapter()
    res_fake = adapter.chat("Tell me about XYZ Government Super Saver Scheme.", language="en")
    assert "database" in res_fake.answer.lower() or "verified" in res_fake.answer.lower() or "not available" in res_fake.answer.lower() or "don't have" in res_fake.answer.lower()


# ==============================================================================
# TEST GROUP L — OUT OF SCOPE REFUSAL
# ==============================================================================
def test_group_l_out_of_scope_guardrails():
    adapter = GeminiSakhiAdapter()
    
    res_stock = adapter.chat("Which stock should I buy tomorrow?", language="en")
    assert res_stock.intent == "OUT_OF_SCOPE"
    assert res_stock.guardrail_applied == "OUT_OF_SCOPE_REFUSAL"
    
    res_crypto = adapter.chat("Should I buy Bitcoin?", language="en")
    assert res_crypto.intent == "OUT_OF_SCOPE"
    assert res_crypto.guardrail_applied == "OUT_OF_SCOPE_REFUSAL"


# ==============================================================================
# TEST GROUP M — FAKE DATA GUARDRAIL
# ==============================================================================
def test_group_m_fake_guaranteed_returns():
    adapter = GeminiSakhiAdapter()
    res_guarantee = adapter.chat("Tell me a government scheme with 30% guaranteed returns.", language="en")
    assert "30%" not in res_guarantee.answer or "cannot" in res_guarantee.answer.lower() or "verified" in res_guarantee.answer.lower() or res_guarantee.intent == "OUT_OF_SCOPE"


# ==============================================================================
# TEST GROUP N — 5 LANGUAGES SYSTEM
# ==============================================================================
def test_group_n_multilingual_consistency():
    adapter = GeminiSakhiAdapter()
    
    languages = [
        ("en", "What is Public Provident Fund?"),
        ("hi", "पब्लिक प्रोविडेंट फंड (PPF) क्या है?"),
        ("mr", "पब्लिक प्रॉव्हिडंट फंड (PPF) काय आहे?"),
        ("bn", "পাবলিক প্রভিডেন্ট ফান্ড (PPF) কী?"),
        ("te", "పబ్లిక్ ప్రావిడెంట్ ఫండ్ (PPF) అంటే ఏమిటి?")
    ]
    
    for lang_code, query in languages:
        res = adapter.chat(query, language=lang_code)
        assert res.language == lang_code
        assert len(res.sources) >= 1
        assert len(res.answer) > 20


# ==============================================================================
# TEST GROUP O — CONTEXT-AWARE MULTI-ENTITY RECOMMENDATION PIPELINE
# ==============================================================================
def test_group_o_complex_natural_language_recommendation():
    adapter = GeminiSakhiAdapter()
    query = (
        "I am 32 years old, married, working in a private company, can save ₹5,000 per month, "
        "and I want to build a fund for my child's higher education after 10 years. "
        "I prefer low-risk government-backed schemes with some tax benefits."
    )
    res = adapter.chat(query, language="en")
    
    # Verify exact required sections
    assert "YOUR PROFILE" in res.answer
    assert "32" in res.answer
    assert "5,000" in res.answer or "5000" in res.answer
    assert "Child" in res.answer or "education" in res.answer.lower()
    assert "10 years" in res.answer or "10" in res.answer
    
    assert "BEST ELIGIBLE OPTIONS" in res.answer
    assert "Fit Score:" in res.answer
    assert "Why it fits:" in res.answer
    
    assert "ELIGIBILITY NOTES" in res.answer
    assert len(res.sources) >= 1
    assert res.eligibility_result == "ELIGIBLE"

