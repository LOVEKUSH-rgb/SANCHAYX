import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.gemini_adapter import sakhi_adapter

def test_suite():
    tests = [
        {
            "id": 1,
            "query": "If I invest ₹5,000 every month for 10 years at an assumed annual return of 12%, how much money will I have?",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Post Office 5-Year RD", "Verified Scheme Assistant"],
            "must_contain": ["6,00,000", "5,50,193", "11,50,193", "12%", "ordinary annuity"]
        },
        {
            "id": 2,
            "query": "How much will I have if I invest ₹10,000 monthly for 5 years at 10%?",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Verified Scheme Assistant"],
            "must_contain": ["6,00,000", "7,74,371", "1,74,371", "10%"]
        },
        {
            "id": 3,
            "query": "What if I save ₹2,000 each month for 5 years?",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Verified Scheme Assistant"],
            "must_contain": ["1,20,000", "60 monthly"]
        },
        {
            "id": 4,
            "query": "What happens if I invest ₹15,000 every quarter for 5 years at 10%?",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Verified Scheme Assistant"],
            "must_contain": ["3,00,000", "3,83,170", "83,170", "20 quarterly", "Quarterly"]
        },
        {
            "id": 5,
            "query": "Can I start a weekly SIP?",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Verified Scheme Assistant"],
            "must_contain": ["Weekly SIP", "52", "Rupee Cost Averaging"]
        },
        {
            "id": 6,
            "query": "Explain the difference between SIP and lump-sum investing.",
            "expected_intent": "FINANCIAL_COACH",
            "forbidden_phrases": ["Verified in official gazette", "POMIS", "National Savings Recurring Deposit", "Verified Scheme Assistant"],
            "must_contain": ["Lump-Sum", "Rupee Cost Averaging"]
        },
        {
            "id": 7,
            "query": "Am I eligible for PM-KISAN?",
            "expected_intent": "CHECK_ELIGIBILITY",
            "forbidden_phrases": [],
            "must_contain": ["PM-KISAN", "Eligibility"]
        },
        {
            "id": 8,
            "query": "Compare PPF and Sukanya Samriddhi Yojana.",
            "expected_intent": "COMPARE_SCHEMES",
            "forbidden_phrases": [],
            "must_contain": ["PPF", "SSY", "Comparison"]
        }
    ]

    all_passed = True
    print("=" * 70)
    print("SANCHAYX — SAKHI NATURAL FINANCIAL QUERY ROUTING TEST SUITE")
    print("=" * 70)

    for t in tests:
        print(f"\n--- Test {t['id']}: {t['query']} ---")
        resp = sakhi_adapter.chat(t["query"])
        
        intent_ok = resp.intent == t["expected_intent"]
        print(f"Intent: {resp.intent} (Expected: {t['expected_intent']}) -> {'PASS' if intent_ok else 'FAIL'}")
        if not intent_ok:
            all_passed = False

        # Check forbidden phrases
        forbidden_found = [p for p in t["forbidden_phrases"] if p.lower() in resp.answer.lower()]
        if forbidden_found:
            print(f"Forbidden phrases detected: {forbidden_found} -> FAIL")
            all_passed = False
        else:
            print(f"Forbidden phrases check: PASS (No hijacking/gazette artifacts)")

        # Check required phrases
        missing_phrases = [p for p in t["must_contain"] if p.lower() not in resp.answer.lower()]
        if missing_phrases:
            print(f"Missing required phrases: {missing_phrases} -> FAIL")
            all_passed = False
        else:
            print(f"Required phrases check: PASS ({t['must_contain']})")

        print(f"Answer snippet:\n{resp.answer[:220]}...")

    print("\n" + "=" * 70)
    if all_passed:
        print("ALL 8 END-TO-END TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED! CHECK LOGS ABOVE.")
    print("=" * 70)

    return all_passed

if __name__ == "__main__":
    success = test_suite()
    sys.exit(0 if success else 1)
