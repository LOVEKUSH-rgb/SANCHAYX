import os
import json
from typing import List, Dict, Any, Tuple
from app.database import get_schemes_collection, get_db

MASTER_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "master_schemes.json")


def validate_scheme_record(record: Dict[str, Any]) -> Tuple[bool, str]:
    if not record.get("scheme_id"):
        return False, "Missing mandatory 'scheme_id'"
    if not record.get("name"):
        return False, "Missing mandatory 'name'"
    if not record.get("category"):
        return False, "Missing mandatory 'category'"
    return True, "Valid"


def seed_master_schemes(data_path: str = MASTER_DATA_PATH) -> Dict[str, Any]:
    """
    Repeatable, deterministic MongoDB seed script for the master scheme dataset.
    Uses 'scheme_id' for safe idempotent upsert.
    Preserves exact nulls and official source verification.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Master dataset file not found at: {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        master_records = json.load(f)

    col = get_schemes_collection()
    
    total_records = len(master_records)
    imported = 0
    duplicates = 0
    verified_count = 0
    review_required_count = 0
    active_count = 0
    pension_count = 0
    central_count = 0
    state_count = 0

    for item in master_records:
        scheme_id = item["scheme_id"]
        is_valid, msg = validate_scheme_record(item)
        if not is_valid:
            print(f"Skipping invalid record: {msg}")
            continue

        ver = item.get("verification", {})
        status_obj = item.get("status", {})
        ownership = item.get("ownership", {})
        cat = str(item.get("category", "")).upper()

        if ver.get("status") == "VERIFIED":
            verified_count += 1
        else:
            review_required_count += 1

        if status_obj.get("active", True):
            active_count += 1

        if cat == "PENSION":
            pension_count += 1

        if ownership.get("level") == "central" or not ownership.get("state"):
            central_count += 1
        else:
            state_count += 1

        # Check if already exists for reporting duplicate/update
        existing = col.find_one({"scheme_id": scheme_id})
        if existing:
            duplicates += 1

        # Upsert record safely
        col.update_one(
            {"scheme_id": scheme_id},
            {"$set": item},
            upsert=True
        )
        imported += 1

    summary = {
        "dataset_file_found": True,
        "total_records": total_records,
        "successfully_imported": imported,
        "duplicates": duplicates,
        "verified": verified_count,
        "review_required": review_required_count,
        "active": active_count,
        "pension": pension_count,
        "central": central_count,
        "state": state_count
    }

    print(f"SANCHAY Master Dataset Ingestion Complete: {summary}")
    return summary


if __name__ == "__main__":
    from typing import Tuple
    seed_master_schemes()
