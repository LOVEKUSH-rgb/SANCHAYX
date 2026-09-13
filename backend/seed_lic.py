import os
import json
from typing import List, Dict, Any, Tuple
from app.database import get_lic_plans_collection, get_lic_information_collection, get_db

LIC_MASTER_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "lic_master_plans.json")
LIC_INFO_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "lic_information.json")
BASE_RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "SANCHAY_LIC_38_master_dataset.json")


def validate_lic_record(record: Dict[str, Any]) -> Tuple[bool, str]:
    if not record.get("plan_id"):
        return False, "Missing mandatory 'plan_id'"
    if not record.get("plan_name"):
        return False, "Missing mandatory 'plan_name'"
    if not record.get("plan_number"):
        return False, "Missing mandatory 'plan_number'"
    if not record.get("uin"):
        return False, "Missing mandatory 'uin'"
    if not record.get("category"):
        return False, "Missing mandatory 'category'"
    return True, "Valid"


def seed_lic_database(
    plans_path: str = LIC_MASTER_DATA_PATH,
    info_path: str = LIC_INFO_DATA_PATH
) -> Dict[str, Any]:
    """
    Deterministic, idempotent seeder for the dedicated LIC database.
    Populates:
    - 'lic_plans' collection (38 active LIC plans)
    - 'lic_information' collection (LIC corporate, statutory and official URLs)
    Never touches government schemes or existing collections.
    """
    if not os.path.exists(plans_path):
        raise FileNotFoundError(f"LIC master plans dataset not found at: {plans_path}")

    with open(plans_path, "r", encoding="utf-8") as f:
        lic_records = json.load(f)

    # 1. Seed lic_plans collection
    col_plans = get_lic_plans_collection()

    total_records = len(lic_records)
    imported = 0
    duplicates = 0
    insurance_count = 0
    pension_count = 0
    unit_linked_count = 0
    micro_count = 0
    verified_count = 0
    verification_required_count = 0

    for item in lic_records:
        plan_id = item["plan_id"]
        is_valid, msg = validate_lic_record(item)
        if not is_valid:
            print(f"Skipping invalid LIC record: {msg}")
            continue

        cat = str(item.get("category", "")).lower()
        if "pension" in cat or "annuity" in cat:
            pension_count += 1
        elif "unit linked" in cat or "ulip" in cat:
            unit_linked_count += 1
        elif "micro" in cat:
            micro_count += 1
        else:
            insurance_count += 1

        if item.get("verification_required") is False:
            verified_count += 1
        else:
            verification_required_count += 1

        existing = col_plans.find_one({"plan_id": plan_id})
        if existing:
            duplicates += 1

        # Upsert safely using unique plan_id
        col_plans.update_one(
            {"plan_id": plan_id},
            {"$set": item},
            upsert=True
        )
        imported += 1

    # 2. Seed lic_information collection
    col_info = get_lic_information_collection()
    info_saved = False
    if os.path.exists(info_path):
        with open(info_path, "r", encoding="utf-8") as f:
            lic_info = json.load(f)
        col_info.update_one(
            {"organization_name": lic_info.get("organization_name", "Life Insurance Corporation of India")},
            {"$set": lic_info},
            upsert=True
        )
        info_saved = True

    summary = {
        "dataset_name": "SANCHAY LIC Master Dataset",
        "total_records": total_records,
        "successfully_imported": imported,
        "duplicates": duplicates,
        "insurance_plans_count": insurance_count,
        "pension_plans_count": pension_count,
        "unit_linked_plans_count": unit_linked_count,
        "micro_insurance_plans_count": micro_count,
        "verified_count": verified_count,
        "verification_required_count": verification_required_count,
        "lic_information_seeded": info_saved,
        "source": "LIC Official Website"
    }

    print(f"SANCHAY LIC Database Ingestion Complete: {summary}")
    return summary


if __name__ == "__main__":
    seed_lic_database()
