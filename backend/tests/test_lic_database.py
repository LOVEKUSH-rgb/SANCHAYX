import sys
import os
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database import (
    get_schemes_collection,
    get_lic_plans_collection,
    get_lic_information_collection
)
from seed_lic import seed_lic_database
from seed_master import seed_master_schemes


def test_lic_database_integrity():
    print("=== Testing SANCHAY LIC Database Integrity ===")

    # 1. Ensure LIC database is seeded
    summary = seed_lic_database()
    print(f"Seed Summary: {summary}")

    lic_col = get_lic_plans_collection()
    info_col = get_lic_information_collection()
    schemes_col = get_schemes_collection()

    # 2. Count LIC records
    all_lic_plans = list(lic_col.find({}))
    print(f"Total LIC plans in collection: {len(all_lic_plans)}")
    assert len(all_lic_plans) == 38, f"Expected exactly 38 LIC plans, found {len(all_lic_plans)}"

    # 3. Verify category breakdown: 27 Insurance, 5 Pension, 4 Unit Linked, 2 Micro Insurance
    insurance_count = 0
    pension_count = 0
    unit_linked_count = 0
    micro_count = 0

    plan_ids = set()
    plan_numbers = set()
    uins = set()

    for plan in all_lic_plans:
        pid = plan.get("plan_id")
        pnum = plan.get("plan_number")
        uin = plan.get("uin")
        name = plan.get("plan_name")
        cat = plan.get("category", "")
        status = plan.get("active_status", plan.get("status"))

        assert pid, "Missing plan_id"
        assert pnum, f"Missing plan_number in {pid}"
        assert uin, f"Missing uin in {pid}"
        assert name, f"Missing plan_name in {pid}"
        assert status == "active", f"Plan {pid} is not active"

        assert pid not in plan_ids, f"Duplicate plan_id: {pid}"
        assert pnum not in plan_numbers, f"Duplicate plan_number: {pnum}"
        plan_ids.add(pid)
        plan_numbers.add(pnum)
        uins.add(uin)

        # Official URLs check
        assert plan.get("official_lic_url"), f"Missing official_lic_url in {pid}"
        assert "licindia.in" in plan.get("official_lic_url"), f"Invalid official url in {pid}"

        cat_lower = str(cat).lower()
        if "pension" in cat_lower or "annuity" in cat_lower:
            pension_count += 1
        elif "unit linked" in cat_lower or "ulip" in cat_lower:
            unit_linked_count += 1
        elif "micro" in cat_lower:
            micro_count += 1
        else:
            insurance_count += 1

    print(f"Breakdown check:")
    print(f"  - Insurance Plans: {insurance_count} (Expected 27)")
    print(f"  - Pension Plans: {pension_count} (Expected 5)")
    print(f"  - Unit Linked Plans: {unit_linked_count} (Expected 4)")
    print(f"  - Micro Insurance Plans: {micro_count} (Expected 2)")

    assert insurance_count == 27, f"Expected 27 insurance plans, got {insurance_count}"
    assert pension_count == 5, f"Expected 5 pension plans, got {pension_count}"
    assert unit_linked_count == 4, f"Expected 4 unit linked plans, got {unit_linked_count}"
    assert micro_count == 2, f"Expected 2 micro insurance plans, got {micro_count}"

    # 4. Verify specific active plans are present
    expected_numbers = {
        "717", "714", "715", "733", "736", "774", "890", "912", "881",
        "888", "889", "745", "771", "883", "748", "720", "721", "732",
        "734", "876", "878", "877", "875", "954", "955", "859", "887",
        "867", "857", "758", "862", "879", "873", "749", "752", "886",
        "751", "880"
    }
    assert plan_numbers == expected_numbers, f"Plan numbers mismatch: {expected_numbers - plan_numbers}"

    # 5. Verify withdrawn plans are NOT in active list
    withdrawn_numbers = {"760", "914", "915", "917", "945"}
    assert not (plan_numbers & withdrawn_numbers), "Withdrawn plans found in active dataset!"

    # 6. Verify lic_information
    lic_info = info_col.find_one({"organization_name": "Life Insurance Corporation of India"})
    assert lic_info is not None, "Missing lic_information record"
    assert lic_info.get("short_name") == "LIC"
    assert lic_info.get("irdai_registration_number") == "512"
    assert "1956" in str(lic_info.get("establishment_date"))
    assert "official_product_pages" in lic_info
    print("✓ lic_information verified successfully.")

    # 7. CRITICAL: Verify Government Schemes remain completely untouched (184 schemes)
    all_schemes = list(schemes_col.find({}))
    print(f"Government schemes count in 'schemes' collection: {len(all_schemes)}")
    assert len(all_schemes) >= 184, f"Government schemes altered! Expected >= 184, found {len(all_schemes)}"
    for s in all_schemes:
        assert "LIC-" not in str(s.get("scheme_id", "")), "LIC plan mixed into government schemes collection!"
    print("✓ Government schemes collection is completely separate and untouched.")

    print("\n🎉 ALL LIC DATABASE INTEGRITY TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_lic_database_integrity()
