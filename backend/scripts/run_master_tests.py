import sys
import os

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tests.test_sakhi_master_suite import (
    test_group_a_basic_explanations,
    test_group_b_age_eligibility,
    test_group_c_occupation_filtering,
    test_group_d_goal_matching,
    test_group_e_budget_matching,
    test_group_f_liquidity,
    test_group_g_no_match_ineligible,
    test_group_h_nri_rules,
    test_group_i_comparison,
    test_group_j_why_recommended,
    test_group_k_hallucination_guardrail,
    test_group_l_out_of_scope_guardrails,
    test_group_m_fake_guaranteed_returns,
    test_group_n_multilingual_consistency,
    test_group_o_complex_natural_language_recommendation,
    setup_database
)
from app.database import get_schemes_collection, get_rules_collection

def run_all_tests():
    setup_database()
    
    schemes_col = get_schemes_collection()
    rules_col = get_rules_collection()
    total_schemes = schemes_col.count_documents({})
    total_rules = rules_col.count_documents({})

    print("==================================================")
    print("SAKHI MASTER VERIFICATION & TEST SUITE")
    print("==================================================")
    print(f"Total Schemes Accessible in Database: {total_schemes}")
    print(f"Total Eligibility Rules in Database:  {total_rules}")
    print(f"Supported Languages:                   5 (English, Hindi, Marathi, Bengali, Telugu)")
    print("--------------------------------------------------")

    tests = [
        ("TEST GROUP A — BASIC", test_group_a_basic_explanations),
        ("TEST GROUP B — AGE HARD GATE", test_group_b_age_eligibility),
        ("TEST GROUP C — OCCUPATION FILTERING", test_group_c_occupation_filtering),
        ("TEST GROUP D — GOAL MATCHING", test_group_d_goal_matching),
        ("TEST GROUP E — BUDGET MATCHING", test_group_e_budget_matching),
        ("TEST GROUP F — LIQUIDITY", test_group_f_liquidity),
        ("TEST GROUP G — NO MATCH (INELIGIBLE)", test_group_g_no_match_ineligible),
        ("TEST GROUP H — NRI RESIDENCY RULES", test_group_h_nri_rules),
        ("TEST GROUP I — SCHEME COMPARISON", test_group_i_comparison),
        ("TEST GROUP J — WHY RECOMMENDED", test_group_j_why_recommended),
        ("TEST GROUP K — HALLUCINATION DEFENSE", test_group_k_hallucination_guardrail),
        ("TEST GROUP L — OUT OF SCOPE REFUSAL", test_group_l_out_of_scope_guardrails),
        ("TEST GROUP M — FAKE DATA GUARDRAIL", test_group_m_fake_guaranteed_returns),
        ("TEST GROUP N — 5 LANGUAGES SYSTEM", test_group_n_multilingual_consistency),
        ("TEST GROUP O — CONTEXT-AWARE RECOMMENDATIONS", test_group_o_complex_natural_language_recommendation),
    ]

    passed = 0
    failed = 0
    failures = []

    for name, test_fn in tests:
        try:
            test_fn()
            print(f"✓ PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"✗ FAIL: {name} — Error: {e}")
            failed += 1
            failures.append((name, str(e)))

    print("--------------------------------------------------")
    print(f"RESULTS: {passed}/{len(tests)} Test Groups Passed ({failed} Failed)")
    if failures:
        print("Failures:")
        for fn, err in failures:
            print(f" - {fn}: {err}")
    print("==================================================")
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
