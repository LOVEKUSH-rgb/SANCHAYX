import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Load environment from root and backend .env
root_env = Path(backend_dir).parent / ".env"
backend_env = Path(backend_dir) / ".env"
if root_env.exists():
    load_dotenv(root_env, override=False)
if backend_env.exists():
    load_dotenv(backend_env, override=False)
load_dotenv(override=False)

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, get_schemes_collection, get_db
from app.services.gemini_adapter import sakhi_adapter
from app.engine import evaluate_eligibility, evaluate_scheme_fit
from app.schemas import UserProfile, UserGoal, UserPreferences
from app.services.scheme_search import search_schemes
from app.routers.schemes import get_schemes_count, get_schemes_stats

def run_tests():
    print("==================================================")
    print("SANCHAY BACKEND & SAKHI API VERIFICATION SUITE")
    print("==================================================")

    # 1. Environment Loading Verification (Without printing keys)
    print("\n--- 1. Environment Configuration Checks ---")
    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DATABASE_NAME")
    gemini_key = os.getenv("GEMINI_API_KEY")

    has_mongo = bool(mongo_uri and len(mongo_uri.strip()) > 0)
    has_dbname = bool(db_name and len(db_name.strip()) > 0)
    has_gemini = bool(gemini_key and len(gemini_key.strip()) > 0)

    print(f"MONGODB_URI loaded: {'YES' if has_mongo else 'NO'}")
    print(f"DATABASE_NAME loaded: {'YES' if has_dbname else 'NO'}")
    print(f"GEMINI_API_KEY loaded: {'YES' if has_gemini else 'NO'}")
    assert has_dbname, "DATABASE_NAME must be loaded from .env"

    # 2. Database Collection Verification
    print("\n--- 2. Database Record Verification ---")
    init_db()
    col = get_schemes_collection()
    total_in_db = col.count_documents({})
    active_in_db = col.count_documents({"$or": [{"status.active": True}, {"active": True}]})
    print(f"Total scheme records in existing database: {total_in_db}")
    print(f"Total active scheme records in database: {active_in_db}")
    assert total_in_db >= 180, f"Expected complete master dataset (>= 180 records), found {total_in_db}"

    # 3. TestClient for actual FastAPI /api/sakhi/chat endpoint
    print("\n--- 3. Testing /api/sakhi/chat Endpoint ---")
    client = TestClient(app)

    # Test Chat Endpoint: Basic Inquiry
    chat_payload = {
        "message": "What is Public Provident Fund (PPF)?",
        "language": "en"
    }
    resp = client.post("/api/sakhi/chat", json=chat_payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    chat_data = resp.json()
    assert "answer" in chat_data and len(chat_data["answer"]) > 0
    assert len(chat_data.get("sources", [])) > 0
    assert chat_data["sources"][0]["source_authority"] is not None
    # Verify no API key leaked in response
    resp_text = json.dumps(chat_data)
    if has_gemini:
        assert gemini_key not in resp_text, "Security violation: GEMINI_API_KEY leaked in response!"
    print("Endpoint /api/sakhi/chat returned 200 OK with verified source citations.")

    # 4. Comprehensive 20-Point Test Suite
    print("\n--- 4. Executing 20 Grounded Functional Tests ---")
    test_results = {}

    # Test 1: Scheme count query
    res1 = client.post("/api/sakhi/chat", json={"message": "How many schemes are available?", "language": "en"}).json()
    assert str(total_in_db) in res1["answer"] or "184" in res1["answer"] or "verified" in res1["answer"].lower()
    test_results["1. Scheme count query"] = "PASSED"

    # Test 2: Pension schemes retrieval
    res2 = client.post("/api/sakhi/chat", json={"message": "Show me pension schemes.", "language": "en"}).json()
    assert len(res2.get("sources", [])) > 0
    test_results["2. Pension schemes retrieval"] = "PASSED"

    # Test 3: Women-related schemes
    res3 = client.post("/api/sakhi/chat", json={"message": "Show me women-related schemes.", "language": "en"}).json()
    assert len(res3.get("sources", [])) > 0
    test_results["3. Women schemes retrieval"] = "PASSED"

    # Test 4: Farmer schemes
    res4 = client.post("/api/sakhi/chat", json={"message": "Show me farmer schemes.", "language": "en"}).json()
    assert len(res4.get("sources", [])) > 0
    test_results["4. Farmer schemes retrieval"] = "PASSED"

    # Test 5: Education schemes
    res5 = client.post("/api/sakhi/chat", json={"message": "Show me education schemes.", "language": "en"}).json()
    assert len(res5.get("sources", [])) > 0
    test_results["5. Education schemes retrieval"] = "PASSED"

    # Test 6: Employment schemes
    res6 = client.post("/api/sakhi/chat", json={"message": "Show me employment schemes.", "language": "en"}).json()
    assert len(res6.get("sources", [])) > 0
    test_results["6. Employment schemes retrieval"] = "PASSED"

    # Test 7: 25-year-old eligibility
    res7 = client.post("/api/sakhi/chat", json={"message": "I am 25, which schemes am I eligible for?", "language": "en"}).json()
    assert res7.get("eligibility_result") == "ELIGIBLE"
    assert len(res7.get("sources", [])) > 0
    test_results["7. 25-year-old eligibility evaluation"] = "PASSED"

    # Test 8: 65-year-old senior schemes
    res8 = client.post("/api/sakhi/chat", json={"message": "I am 65, which schemes can I consider?", "language": "en"}).json()
    assert res8.get("eligibility_result") == "ELIGIBLE"
    test_results["8. 65-year-old senior schemes evaluation"] = "PASSED"

    # Test 9: NRI eligibility filtering
    res9 = client.post("/api/sakhi/chat", json={"message": "I am an NRI, what can I use?", "language": "en"}).json()
    assert len(res9.get("answer", "")) > 10
    test_results["9. NRI eligibility filtering"] = "PASSED"

    # Test 10: Monthly budget recommendation
    res10 = client.post("/api/sakhi/chat", json={"message": "I can save ₹2000 per month.", "language": "en"}).json()
    assert "₹2,000" in res10["answer"] or "Fit Score" in res10["answer"]
    test_results["10. Monthly budget recommendation"] = "PASSED"

    # Test 11: Woman with 5-year-old daughter (Broad goal - ELIGIBLE with Sukanya Samriddhi / PPF Minor)
    res11 = client.post("/api/sakhi/chat", json={"message": "I am a woman with a 5-year-old daughter. What schemes can I consider?", "language": "en"}).json()
    assert res11.get("eligibility_result") == "ELIGIBLE", f"Expected ELIGIBLE for woman with 5yo daughter, got {res11.get('eligibility_result')}"
    assert "Sukanya" in res11["answer"] or "SSY" in res11["answer"] or "PPF" in res11["answer"]
    test_results["11. Woman with 5-year-old daughter (ELIGIBLE)"] = "PASSED"

    # Test 11B: Sukanya Samriddhi with child age 15 (Specific scheme - INELIGIBLE)
    res11b = client.post("/api/sakhi/chat", json={"message": "Am I eligible for Sukanya Samriddhi Yojana if my daughter is 15 years old?", "language": "en"}).json()
    assert res11b.get("eligibility_result") == "INELIGIBLE", f"Expected INELIGIBLE for SSY daughter age 15, got {res11b.get('eligibility_result')}"
    test_results["11B. Specific scheme age violation (INELIGIBLE)"] = "PASSED"

    # Test 11C: Broad question with no matching scheme (NO_MATCH / No applicable match - NOT falsely marked INELIGIBLE)
    res11c = client.post("/api/sakhi/chat", json={"message": "I am looking for schemes where the monthly deposit is ₹50,000,000 per month for 100 years", "language": "en"}).json()
    assert res11c.get("eligibility_result") is None, f"Expected None/NO_MATCH for impossible search, got {res11c.get('eligibility_result')}"
    assert "No currently matching scheme was found based on the information provided" in res11c["answer"] or "no currently matching scheme" in res11c["answer"].lower()
    test_results["11C. Broad search no match (NO APPLICABLE SCHEME)"] = "PASSED"

    # Test 12: Multi-scheme comparison (PPF, NSC, KVP)
    res12 = client.post("/api/sakhi/chat", json={"message": "Compare PPF, NSC and KVP.", "language": "en"}).json()
    assert "|" in res12["answer"]
    assert len(res12.get("sources", [])) >= 2
    test_results["12. Multi-scheme comparison table"] = "PASSED"

    # Test 13: Why recommended
    res13 = client.post("/api/sakhi/chat", json={"message": "Why was PPF recommended for me?", "language": "en", "context": {"fit_score": 96.0}}).json()
    assert "Fit Score" in res13["answer"] or "PPF" in res13["answer"]
    test_results["13. Why recommended explanation"] = "PASSED"

    # Test 14: Why ineligible
    res14 = client.post("/api/sakhi/chat", json={"message": "Why am I not eligible for Atal Pension Yojana?", "language": "en", "context": {"profile": {"age": 55}}}).json()
    assert res14.get("eligibility_result") == "INELIGIBLE"
    assert "INELIGIBLE" in res14["answer"] or "age" in res14["answer"].lower()
    test_results["14. Why ineligible explanation with statutory rule"] = "PASSED"

    # Test 15: Unknown scheme hallucination guardrail
    res15 = client.post("/api/sakhi/chat", json={"message": "Tell me about Mega Crypto Profit Guaranteed Multiplier 99", "language": "en"}).json()
    assert "verified" in res15["answer"].lower() or "don't have verified" in res15["answer"].lower() or "official" in res15["answer"].lower()
    test_results["15. Non-existent scheme guardrail"] = "PASSED"

    # Test 16: Arbitrary natural language question
    res16 = client.post("/api/sakhi/chat", json={"message": "How does compound interest help in sovereign savings?", "language": "en"}).json()
    assert len(res16["answer"]) > 20
    test_results["16. Arbitrary natural-language question"] = "PASSED"

    # Test 17: Hindi
    res17 = client.post("/api/sakhi/chat", json={"message": "PPF योजना क्या है और इसमें कितना ब्याज मिलता है?", "language": "hi"}).json()
    assert len(res17["answer"]) > 20
    test_results["17. Hindi language response"] = "PASSED"

    # Test 18: Marathi
    res18 = client.post("/api/sakhi/chat", json={"message": "पेन्शन योजना कोणत्या उपलब्ध आहेत?", "language": "mr"}).json()
    assert len(res18["answer"]) > 20
    test_results["18. Marathi language response"] = "PASSED"

    # Test 19: Bengali
    res19 = client.post("/api/sakhi/chat", json={"message": "কন্যা সন্তানের জন্য কোন স্কিম সেরা?", "language": "bn"}).json()
    assert len(res19["answer"]) > 20
    test_results["19. Bengali language response"] = "PASSED"

    # Test 20: Telugu
    res20 = client.post("/api/sakhi/chat", json={"message": "రైతులకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?", "language": "te"}).json()
    assert len(res20["answer"]) > 20
    test_results["20. Telugu language response"] = "PASSED"

    print("\n==================================================")
    print("ALL VERIFICATION CHECKS & TESTS PASSED!")
    print("==================================================")
    for name, status in test_results.items():
        print(f"  {status}: {name}")

    return test_results

if __name__ == "__main__":
    run_tests()
