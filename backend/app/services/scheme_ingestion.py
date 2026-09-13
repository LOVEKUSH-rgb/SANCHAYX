import datetime
from typing import List, Dict, Any, Tuple
from app.database import get_schemes_collection, get_db
from app.services.scheme_normalizer import normalize_scheme_record
from app.services.scheme_verifier import verify_scheme_compliance


def ingest_scheme_batch(raw_schemes: List[Dict[str, Any]], imported_by: str = "admin") -> Dict[str, Any]:
    """
    Ingests a list of raw scheme objects, normalizes them, verifies compliance,
    and upserts them into the MongoDB schemes collection.
    """
    col = get_schemes_collection()
    ingested = 0
    verified_count = 0
    unverified_count = 0
    errors = []
    
    for raw in raw_schemes:
        try:
            norm = normalize_scheme_record(raw)
            is_verified, msg, final_scheme = verify_scheme_compliance(norm)
            
            if is_verified:
                verified_count += 1
            else:
                unverified_count += 1

            col.update_one(
                {"scheme_id": final_scheme["scheme_id"]},
                {"$set": final_scheme},
                upsert=True
            )
            ingested += 1
        except Exception as e:
            errors.append(f"Scheme '{raw.get('name', 'unknown')}': {str(e)}")

    # Record Ingestion Log in DB
    try:
        db = get_db()
        logs_col = db.get_collection("ingestion_logs")
        logs_col.insert_one({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "imported_by": imported_by,
            "total_submitted": len(raw_schemes),
            "ingested": ingested,
            "verified_count": verified_count,
            "unverified_count": unverified_count,
            "errors": errors
        })
    except Exception as log_err:
        print(f"Notice: Ingestion logging error: {log_err}")

    return {
        "status": "success",
        "total_submitted": len(raw_schemes),
        "ingested": ingested,
        "verified_count": verified_count,
        "unverified_count": unverified_count,
        "errors": errors
    }
