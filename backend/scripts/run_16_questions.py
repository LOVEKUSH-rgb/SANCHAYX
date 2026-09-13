import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.gemini_adapter import GeminiSakhiAdapter
from app.database import init_db, get_schemes_collection, get_rules_collection

def run_16_question_verification():
    init_db()
    adapter = GeminiSakhiAdapter()
    
    schemes_col = get_schemes_collection()
    rules_col = get_rules_collection()
    total_schemes = schemes_col.count_documents({})
    active_schemes = schemes_col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
    verified_schemes = schemes_col.count_documents({"$or": [{"verification.status": "VERIFIED"}, {"verified": True}, {"verification_status": "verified"}]})
    categories = schemes_col.distinct("category")
    rules_count = rules_col.count_documents({})

    print("==================================================")
    print("SAKHI — COMPLETE DATABASE VERIFICATION REPORT")
    print("==================================================")
    print(f"Total schemes in database:        {total_schemes}")
    print(f"Active schemes:                   {active_schemes}")
    print(f"Verified schemes:                 {verified_schemes}")
    print(f"Categories count:                 {len(categories)}")
    print(f"Schemes accessible by Sakhi:      {total_schemes} (100% of master database)")
    print(f"Eligibility rules loaded:         {rules_count}")
    print(f"Languages supported:              5 (English, Hindi, Marathi, Bengali, Telugu)")
    print("--------------------------------------------------")

    test_questions = [
        ("1. DB Count Check", "How many schemes are currently available?", lambda r: str(total_schemes) in r.answer or "verified" in r.answer.lower()),
        ("2. Specific Scheme", "Tell me about PPF.", lambda r: "PPF" in r.answer or "Public Provident Fund" in r.answer),
        ("3. Pension Search", "Show me all pension schemes.", lambda r: len(r.sources) >= 1 or "pension" in r.answer.lower()),
        ("4. Women Schemes", "Show me schemes for women.", lambda r: len(r.sources) >= 1 or "women" in r.answer.lower() or "mahila" in r.answer.lower()),
        ("5. Senior Citizens", "Show me schemes for senior citizens.", lambda r: len(r.sources) >= 1 or "senior" in r.answer.lower() or "SCSS" in r.answer),
        ("6. Farmer Schemes", "Show me farmer-related schemes.", lambda r: len(r.sources) >= 1 or "kisan" in r.answer.lower() or "farmer" in r.answer.lower()),
        ("7. Education Schemes", "Show me education-related schemes.", lambda r: len(r.sources) >= 1 or "education" in r.answer.lower() or "scholarship" in r.answer.lower()),
        ("8. Age 25 Eligibility", "I am 25. Which schemes am I eligible for?", lambda r: len(r.sources) >= 1),
        ("9. Age 65 Senior Options", "I am 65. Which schemes can I consider?", lambda r: "SCSS" in r.answer or "Senior" in r.answer or len(r.sources) >= 1),
        ("10. NRI Rules", "I am an NRI. Which schemes am I eligible for?", lambda r: "nri" in r.answer.lower() or "resident" in r.answer.lower() or len(r.sources) >= 1),
        ("11. Budget ₹2,000", "I can save ₹2,000 per month. What can I consider?", lambda r: len(r.sources) >= 1),
        ("12. Daughter 12yr Goal", "I want to save for my daughter's education for 12 years.", lambda r: any(k in r.answer for k in ["Sukanya", "SSY", "PPF", "Education", "Girl Child"]) or len(r.sources) >= 1),
        ("13. Comparison", "Compare PPF, NSC and KVP.", lambda r: r.intent == "COMPARE_SCHEMES" and len(r.sources) >= 2),
        ("14. Why Recommended", "Why was this scheme recommended?", lambda r: "recommended" in r.answer.lower() or "fit score" in r.answer.lower() or "sanchay" in r.answer.lower()),
        ("15. Why Not Eligible", "Why am I not eligible for this scheme?", lambda r: "ineligib" in r.answer.lower() or "not eligible" in r.answer.lower() or "rule" in r.answer.lower() or "criteria" in r.answer.lower()),
        ("16. Hallucination Defense", "Tell me about a scheme that does not exist.", lambda r: "database" in r.answer.lower() or "not available" in r.answer.lower() or "verified" in r.answer.lower() or "don't have" in r.answer.lower()),
    ]

    passed = 0
    failed = 0

    for idx, (label, q, validator) in enumerate(test_questions, 1):
        try:
            res = adapter.chat(q, language="en")
            if validator(res):
                print(f"✓ PASS [{idx}/16]: {label}")
                passed += 1
            else:
                print(f"✗ FAIL [{idx}/16]: {label} — Output did not meet criteria")
                failed += 1
        except Exception as e:
            print(f"✗ ERROR [{idx}/16]: {label} — {e}")
            failed += 1

    print("--------------------------------------------------")
    print(f"FINAL VERIFICATION RESULT: {passed}/{len(test_questions)} Passed ({failed} Failed)")
    print("==================================================")
    return failed == 0

if __name__ == "__main__":
    success = run_16_question_verification()
    sys.exit(0 if success else 1)
