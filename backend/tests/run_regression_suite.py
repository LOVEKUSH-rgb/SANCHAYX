import sys
import os
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import init_db, get_schemes_collection
from app.services.gemini_adapter import GeminiSakhiAdapter
from seed_master import seed_master_schemes, MASTER_DATA_PATH

def run_suite():
    print("=" * 70)
    print("RUNNING SAKHI REGRESSION TEST SUITE (12 TEST CASES)")
    print("=" * 70)

    # Initialize DB & Sync master schemes
    init_db()
    seed_master_schemes(MASTER_DATA_PATH)
    col = get_schemes_collection()
    print(f"Verified Active DB Scheme Count: {col.count_documents({})}")
    print("-" * 70)

    adapter = GeminiSakhiAdapter()

    test_queries = [
        (1, "I am 41 years old, can I open Atal Pension Yojana?", "en"),
        (2, "I am 59, a retired government employee who just got my retirement benefits, can I open SCSS?", "en"),
        (3, "My income is Rs 3 lakh, I'm SC, can I get the post-matric scholarship?", "en"),
        (4, "I am an NRI, can I open a PPF account?", "en"),
        (5, "My son is 8 years old, can I open Sukanya Samriddhi Yojana for him?", "en"),
        (6, "I am a 45-year-old widow, what pension can I get?", "en"),
        (7, "I am 70, disabled, unemployed, and want a business loan", "en"),
        (8, "I am a 25-year-old salaried professional. What schemes am I eligible for?", "en"),
        (8.1, "मैं 25 साल का नौकरीपेशा व्यक्ति हूँ। मैं किन योजनाओं के लिए पात्र हूँ?", "hi"),
        (9, "APY ke lie eligiblity kya h", "en"),
        (10, "I am 25 years old and also 65 years old", "en"),
        (11, "Tell me some scheme", "en"),
        (12, "Tell me about the XYZ Yojana", "en")
    ]

    results = []
    for test_num, query, lang in test_queries:
        print(f"\n>>> TEST CASE {test_num}: '{query}' (lang={lang})")
        resp = adapter.chat(message=query, language=lang)
        
        print(f"Intent: {resp.intent}")
        print(f"Eligibility Result: {resp.eligibility_result}")
        print(f"Guardrail: {resp.guardrail_applied}")
        print(f"Sources: {[s.scheme_name for s in resp.sources]}")
        print(f"Answer:\n{resp.answer}")
        print("=" * 70)

        results.append({
            "test_num": test_num,
            "query": query,
            "lang": lang,
            "intent": resp.intent,
            "eligibility_result": resp.eligibility_result,
            "guardrail_applied": resp.guardrail_applied,
            "sources": [s.scheme_name for s in resp.sources],
            "answer": resp.answer
        })

    with open(backend_dir / "regression_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nAll 12 test cases completed and saved to regression_results.json")

if __name__ == "__main__":
    run_suite()
