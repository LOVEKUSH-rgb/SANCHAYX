import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import get_free_benefits_collection
from app.free_benefits_engine import (
    FreeBenefitUserProfile,
    evaluate_single_free_benefit,
    evaluate_all_free_benefits
)
from app.services.sakhi_free_benefits_handler import (
    handle_free_benefits_chat,
    is_free_benefits_query
)
from app.services.sakhi_lic_handler import detect_query_domain

client = TestClient(app)


def test_free_benefits_database_loading():
    col = get_free_benefits_collection()
    docs = list(col.find({}))
    assert len(docs) == 22, f"Expected 22 unique Free Benefits records after import/merge, got {len(docs)}"
    
    # Check that no duplicate benefit_id exists
    ids = [d["benefit_id"] for d in docs]
    assert len(ids) == len(set(ids)), f"Duplicate IDs detected: {len(ids)} vs {len(set(ids))}"

    # Verify 5 new IDs are present
    new_ids = [
        "CENTRAL-PMJAY-FREE-HEALTH",
        "CENTRAL-ESDP",
        "CENTRAL-PMKVY-FREE-SKILL",
        "ASSAM-FREE-HEART-SURGERY",
        "CENTRAL-PM-SURYA-GHAR"
    ]
    for nid in new_ids:
        assert nid in ids, f"Missing new benefit ID: {nid}"

    # Check essential fields on every record
    for doc in docs:
        assert "benefit_id" in doc
        assert "name" in doc
        assert "level" in doc
        assert "state" in doc
        assert "category" in doc
        assert "benefit_type" in doc
        assert "status" in doc
        assert "benefit" in doc
        assert "eligibility_text" in doc
        assert "application_mode" in doc
        assert "official_source" in doc
        assert "last_verified" in doc


def test_free_benefits_api_endpoints():
    # 1. List all 22
    res = client.get("/api/v1/free-benefits")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 22

    # 2. Filter by State (Assam)
    res_as = client.get("/api/v1/free-benefits?state=Assam")
    assert res_as.status_code == 200
    as_data = res_as.json()
    assert any(d["benefit_id"] == "ASSAM-FREE-HEART-SURGERY" for d in as_data)

    # 3. Filter by Category (health)
    res_hlth = client.get("/api/v1/free-benefits?category=health")
    assert res_hlth.status_code == 200
    hlth_data = res_hlth.json()
    assert any(d["benefit_id"] == "CENTRAL-PMJAY-FREE-HEALTH" for d in hlth_data)
    assert any(d["benefit_id"] == "ASSAM-FREE-HEART-SURGERY" for d in hlth_data)

    # 4. Verified URLs
    res_pmjay = client.get("/api/v1/free-benefits/CENTRAL-PMJAY-FREE-HEALTH")
    assert res_pmjay.status_code == 200
    assert res_pmjay.json()["application_url"] == "https://pmjay.gov.in/"

    res_surya = client.get("/api/v1/free-benefits/CENTRAL-PM-SURYA-GHAR")
    assert res_surya.status_code == 200
    assert res_surya.json()["benefit_type"] == "subsidy"
    assert res_surya.json()["application_url"] == "https://pmsuryaghar.gov.in/"

    # 5. Null application_url on non-portal schemes
    res_esdp = client.get("/api/v1/free-benefits/CENTRAL-ESDP")
    assert res_esdp.status_code == 200
    assert res_esdp.json()["application_url"] is None
    assert "msme.gov.in" in res_esdp.json()["official_source"]

    res_assam = client.get("/api/v1/free-benefits/ASSAM-FREE-HEART-SURGERY")
    assert res_assam.status_code == 200
    assert res_assam.json()["application_url"] is None


def test_deterministic_eligibility_engine_cases():
    col = get_free_benefits_collection()
    
    # 1. PM-JAY Case
    pmjay_doc = col.find_one({"benefit_id": "CENTRAL-PMJAY-FREE-HEALTH"})
    assert pmjay_doc is not None

    p_pmjay_eligible = FreeBenefitUserProfile(
        has_ration_card=True,
        ration_card_type="PHH",
        state="Bihar"
    )
    res_pmjay = evaluate_single_free_benefit(pmjay_doc, p_pmjay_eligible)
    assert res_pmjay.status == "ELIGIBLE"

    p_pmjay_missing = FreeBenefitUserProfile(state="Uttar Pradesh")
    res_pmjay_m = evaluate_single_free_benefit(pmjay_doc, p_pmjay_missing)
    assert res_pmjay_m.status == "ADDITIONAL_INFORMATION_REQUIRED"

    # 2. Assam Free Heart Surgery Case
    assam_doc = col.find_one({"benefit_id": "ASSAM-FREE-HEART-SURGERY"})
    assert assam_doc is not None

    p_assam_eligible = FreeBenefitUserProfile(
        state="Assam",
        age=8
    )
    res_as = evaluate_single_free_benefit(assam_doc, p_assam_eligible)
    assert res_as.status == "ELIGIBLE"

    p_assam_ineligible = FreeBenefitUserProfile(
        state="Haryana",
        age=8
    )
    res_as_in = evaluate_single_free_benefit(assam_doc, p_assam_ineligible)
    assert res_as_in.status == "INELIGIBLE"

    # 3. PM Surya Ghar Case (Subsidy)
    surya_doc = col.find_one({"benefit_id": "CENTRAL-PM-SURYA-GHAR"})
    assert surya_doc is not None
    assert surya_doc["benefit_type"] == "subsidy"


def test_sakhi_free_benefits_retrieval():
    # Test Sakhi question on PM-JAY
    chat_pmjay = handle_free_benefits_chat("PM-JAY kya hai?")
    assert "CENTRAL-PMJAY-FREE-HEALTH" in [c.source_id for c in chat_pmjay.source_citations] or "Ayushman" in chat_pmjay.response

    # Test Sakhi question on PM Surya Ghar free hai?
    chat_surya = handle_free_benefits_chat("PM Surya Ghar free hai?")
    assert "subsidy" in chat_surya.response.lower()
    assert "free installation" in chat_surya.response.lower()

    # Test Sakhi question on Assam child heart surgery
    chat_assam = handle_free_benefits_chat("Assam me bachche ke liye free heart surgery hai?")
    assert "ASSAM-FREE-HEART-SURGERY" in [c.source_id for c in chat_assam.source_citations] or "Assam" in chat_assam.response


if __name__ == "__main__":
    test_free_benefits_database_loading()
    test_free_benefits_api_endpoints()
    test_deterministic_eligibility_engine_cases()
    test_sakhi_free_benefits_retrieval()
    print("All 22 Free Benefits expansion tests passed successfully!")
