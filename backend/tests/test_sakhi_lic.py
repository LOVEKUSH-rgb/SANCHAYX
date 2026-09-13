import sys
import pytest
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database import init_db
from app.services.gemini_adapter import GeminiSakhiAdapter, sakhi_adapter
from app.services.sakhi_lic_handler import detect_query_domain, extract_lic_user_profile
from seed_lic import seed_lic_database
from seed_master import seed_master_schemes


@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    seed_master_schemes()
    seed_lic_database()


def test_query_domain_routing():
    """Verify intelligent query routing across LIC, Government, Mixed, and General."""
    assert detect_query_domain("What is LIC?") == "LIC"
    assert detect_query_domain("LIC mein child education ke liye kya plan hai?") == "LIC"
    assert detect_query_domain("What is LIC Jeevan Tarun?") == "LIC"
    assert detect_query_domain("Am I eligible for Plan 715?") == "LIC"
    assert detect_query_domain("Tell me about Bima Lakshmi") == "LIC"
    
    # Government schemes
    assert detect_query_domain("What is PPF?") == "GOVERNMENT"
    assert detect_query_domain("Am I eligible for Sukanya Samriddhi Yojana?") == "GOVERNMENT"
    assert detect_query_domain("Show me pension schemes for farmers") == "GOVERNMENT"
    assert detect_query_domain("Explain APY") == "GOVERNMENT"

    # Mixed queries
    assert detect_query_domain("Government schemes aur LIC dono mein child education ke liye options batao") == "MIXED"
    assert detect_query_domain("Compare government schemes and LIC for retirement") == "MIXED"
    assert detect_query_domain("What is the difference between PPF and LIC Jeevan Labh?") == "MIXED"


# -------------------------------------------------------------
# 1. General LIC Question
# -------------------------------------------------------------
def test_1_general_lic_question():
    adapter = GeminiSakhiAdapter()
    res = adapter.chat("What is LIC?", language="en")
    
    assert res is not None
    assert "Life Insurance Corporation of India" in res.answer or "LIC" in res.answer
    assert "38" in res.answer or "active" in res.answer.lower()
    assert len(res.sources) >= 1
    assert "licindia.in" in res.sources[0].official_url
    assert "Life Insurance Corporation of India (LIC)" in res.sources[0].authority


# -------------------------------------------------------------
# 2. Specific LIC Plan Question
# -------------------------------------------------------------
def test_2_specific_lic_plan_question():
    adapter = GeminiSakhiAdapter()
    
    # English specific plan inquiry
    res_en = adapter.chat("What is LIC Jeevan Tarun?", language="en")
    assert "Jeevan Tarun" in res_en.answer
    assert "734" in res_en.answer
    assert "512N299V03" in res_en.answer or "UIN" in res_en.answer
    assert "Death Benefit" in res_en.answer
    assert "Maturity Benefit" in res_en.answer
    assert len(res_en.sources) >= 1
    assert "licindia.in" in res_en.sources[0].official_url

    # Hindi specific plan inquiry
    res_hi = adapter.chat("LIC ka Jeevan Tarun kya hai?", language="hi")
    assert "जीवन तरुण" in res_hi.answer or "Jeevan Tarun" in res_hi.answer
    assert "734" in res_hi.answer
    assert len(res_hi.sources) >= 1


# -------------------------------------------------------------
# 3. LIC Eligibility Question
# -------------------------------------------------------------
def test_3_lic_eligibility_question():
    adapter = GeminiSakhiAdapter()
    
    # Eligible scenario: Jeevan Tarun for a 5-year-old child
    res = adapter.chat(
        "Am I eligible for LIC Jeevan Tarun for my 5 year old child?",
        language="en"
    )
    assert res.eligibility_result == "ELIGIBLE"
    assert "ELIGIBLE" in res.answer
    assert "Jeevan Tarun" in res.answer
    assert len(res.sources) >= 1
    assert "licindia.in" in res.sources[0].official_url


# -------------------------------------------------------------
# 4. LIC Broad Recommendation
# -------------------------------------------------------------
def test_4_lic_broad_recommendation():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat(
        "Meri age 32 hai aur mera budget 5000 per month hai, LIC mein kya le sakta hoon?",
        language="en"
    )
    assert res.eligibility_result == "ELIGIBLE"
    assert "Top Recommended LIC Plans" in res.answer or "LIC" in res.answer
    assert "Match Score" in res.answer or "Plan No." in res.answer
    assert len(res.sources) >= 1
    assert any("licindia.in" in s.official_url for s in res.sources)


# -------------------------------------------------------------
# 5. LIC Child Education Query
# -------------------------------------------------------------
def test_5_lic_child_education_query():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat("LIC mein child education ke liye kya plan hai?", language="en")
    assert "Amritbaal" in res.answer or "Jeevan Lakshya" in res.answer or "Jeevan Tarun" in res.answer or "Child" in res.answer
    assert len(res.sources) >= 1
    assert any("licindia.in" in s.official_url for s in res.sources)


# -------------------------------------------------------------
# 6. LIC Retirement Query
# -------------------------------------------------------------
def test_6_lic_retirement_query():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat("LIC mein retirement ke liye kya options hain?", language="en")
    assert any(k in res.answer for k in ["Saral Pension", "Jeevan Shanti", "Jeevan Akshay", "Jeevan Dhara", "Jeevan Umang", "Pension", "Annuity"])
    assert len(res.sources) >= 1
    assert any("licindia.in" in s.official_url for s in res.sources)


# -------------------------------------------------------------
# 7. LIC Protection Query
# -------------------------------------------------------------
def test_7_lic_protection_query():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat("LIC mein family protection ke liye kaunsa plan hai?", language="en")
    assert any(k in res.answer for k in ["Digi Term", "Yuva Term", "Tech Term", "Jeevan Amar", "Saral Jeevan Bima", "Protection", "Term Assurance"])
    assert len(res.sources) >= 1
    assert any("licindia.in" in s.official_url for s in res.sources)


# -------------------------------------------------------------
# 8. Missing User Information Handling
# -------------------------------------------------------------
def test_8_missing_user_information():
    adapter = GeminiSakhiAdapter()
    
    # Generic inquiry without profile -> Sakhi asks concise follow-up
    res = adapter.chat("LIC mein mere liye best plan kaunsa hai?", language="en")
    assert res.eligibility_result == "ADDITIONAL_INFORMATION_REQUIRED"
    assert "Age" in res.answer or "budget" in res.answer.lower() or "आयु" in res.answer or "बजट" in res.answer


# -------------------------------------------------------------
# 9. Ineligible LIC User
# -------------------------------------------------------------
def test_9_ineligible_lic_user():
    adapter = GeminiSakhiAdapter()
    
    # Age 16 user asking for adult plan 715 (Min Entry Age 18)
    res = adapter.chat(
        "I am 16 years old. Am I eligible for LIC New Jeevan Anand?",
        language="en"
    )
    assert res.eligibility_result == "INELIGIBLE"
    assert "INELIGIBLE" in res.answer
    assert "18" in res.answer or "minimum entry age" in res.answer.lower()
    assert len(res.sources) >= 1
    assert "licindia.in" in res.sources[0].official_url


# -------------------------------------------------------------
# 10. No Applicable LIC Plan
# -------------------------------------------------------------
def test_10_no_applicable_lic_plan():
    adapter = GeminiSakhiAdapter()
    
    # Age 105 (Exceeds max entry age for all 38 plans)
    res = adapter.chat(
        "I am 105 years old, what LIC plan is available?",
        language="en"
    )
    assert res.eligibility_result == "NO_APPLICABLE_PLAN"
    assert "No currently matching LIC plan was found" in res.answer


# -------------------------------------------------------------
# 11. Government Scheme Safety (Untouched & Unbroken)
# -------------------------------------------------------------
def test_11_government_scheme_safety():
    adapter = GeminiSakhiAdapter()
    
    # 1. PPF
    res_ppf = adapter.chat("What is PPF?", language="en")
    assert "PPF" in res_ppf.answer or "Public Provident Fund" in res_ppf.answer
    assert len(res_ppf.sources) >= 1
    assert any("Government" in s.authority or "Finance" in s.authority for s in res_ppf.sources)

    # 2. Sukanya Samriddhi
    res_ssy = adapter.chat("Am I eligible for Sukanya Samriddhi Yojana for my 5 year old daughter?", language="en")
    assert "Sukanya" in res_ssy.answer or "SSY" in res_ssy.answer or "ELIGIBLE" in res_ssy.answer
    assert len(res_ssy.sources) >= 1

    # 3. Farmer Schemes
    res_farmer = adapter.chat("Which government schemes are available for farmers?", language="en")
    assert any(k in res_farmer.answer for k in ["PM-KMY", "Kisan", "PM-KISAN", "Farmer", "Agriculture"]) or len(res_farmer.sources) >= 1

    # 4. Pension Schemes
    res_pension = adapter.chat("Show me pension schemes.", language="en")
    assert any(k in res_pension.answer for k in ["APY", "Atal Pension", "NPS", "Pension"]) or len(res_pension.sources) >= 1


# -------------------------------------------------------------
# 12. Mixed Government + LIC Question
# -------------------------------------------------------------
def test_12_mixed_government_and_lic_question():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat(
        "Government schemes aur LIC dono mein child education ke liye options batao.",
        language="en"
    )
    assert "Government Schemes" in res.answer
    assert "LIC Plans" in res.answer
    # Should cite both sources
    assert len(res.sources) >= 2
    authorities = [s.authority for s in res.sources]
    assert any("Government" in a or "Ministry" in a for a in authorities)
    assert any("LIC" in a or "Life Insurance Corporation" in a for a in authorities)


# -------------------------------------------------------------
# 13. Hallucination / Unknown Information Protection
# -------------------------------------------------------------
def test_13_hallucination_protection():
    adapter = GeminiSakhiAdapter()
    
    # Non-existent plan number
    res = adapter.chat("What is LIC Plan 99999?", language="en")
    assert "not found" in res.answer.lower() or "not available" in res.answer.lower() or "unavailable" in res.answer.lower() or "सत्यापित" in res.answer


# -------------------------------------------------------------
# 14. Official LIC Source Handling
# -------------------------------------------------------------
def test_14_official_lic_source_handling():
    adapter = GeminiSakhiAdapter()
    
    res = adapter.chat("What is LIC Digi Term?", language="en")
    assert len(res.sources) >= 1
    assert "licindia.in" in res.sources[0].official_url
    assert res.sources[0].authority == "Life Insurance Corporation of India (LIC)"
    assert res.sources[0].last_verified is not None


def run_all_tests():
    print("\n=======================================================")
    print("   SAKHI STEP 3: LIC INTEGRATION FULL TEST SUITE")
    print("=======================================================\n")
    
    init_db()
    seed_master_schemes()
    seed_lic_database()

    tests = [
        ("Test 0: Query Domain Routing", test_query_domain_routing),
        ("Test 1: General LIC Question", test_1_general_lic_question),
        ("Test 2: Specific LIC Plan Question", test_2_specific_lic_plan_question),
        ("Test 3: LIC Eligibility Question", test_3_lic_eligibility_question),
        ("Test 4: LIC Broad Recommendation", test_4_lic_broad_recommendation),
        ("Test 5: LIC Child Education Query", test_5_lic_child_education_query),
        ("Test 6: LIC Retirement Query", test_6_lic_retirement_query),
        ("Test 7: LIC Protection Query", test_7_lic_protection_query),
        ("Test 8: Missing User Information", test_8_missing_user_information),
        ("Test 9: Ineligible LIC User", test_9_ineligible_lic_user),
        ("Test 10: No Applicable LIC Plan", test_10_no_applicable_lic_plan),
        ("Test 11: Government Scheme Safety", test_11_government_scheme_safety),
        ("Test 12: Mixed Government + LIC Question", test_12_mixed_government_and_lic_question),
        ("Test 13: Hallucination Protection", test_13_hallucination_protection),
        ("Test 14: Official LIC Source Handling", test_14_official_lic_source_handling)
    ]

    passed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"✓ {name} PASSED")
            passed += 1
        except Exception as e:
            print(f"✗ {name} FAILED: {e}")
            raise e

    print(f"\n=======================================================")
    print(f"   ALL {passed}/{len(tests)} TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")


if __name__ == "__main__":
    run_all_tests()
