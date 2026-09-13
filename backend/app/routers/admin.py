import os
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import List, Optional
from dotenv import load_dotenv
from app.database import get_schemes_collection
from app.schemas import SchemeSchema, SchemeImportBatch, AdminResponse
from app.services.scheme_ingestion import ingest_scheme_batch

load_dotenv()

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "sanchay_admin_secret_key_2026")

router = APIRouter(prefix="/admin", tags=["Admin & Scheme Data Management"])


def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    if not x_admin_key or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized: Valid X-Admin-Key header required for admin operations."
        )
    return True


@router.get("/schemes", response_model=List[SchemeSchema])
def admin_list_all_schemes(authenticated: bool = Depends(verify_admin_key)):
    """
    Lists ALL schemes in the database (including unverified, under review, and discontinued).
    """
    col = get_schemes_collection()
    docs = list(col.find({}))
    for d in docs:
        if "id" in d and "scheme_id" not in d:
            d["scheme_id"] = d["id"]
    return [SchemeSchema(**d) for d in docs]


@router.post("/schemes", response_model=AdminResponse)
def admin_create_scheme(scheme: SchemeSchema, authenticated: bool = Depends(verify_admin_key)):
    col = get_schemes_collection()
    existing = col.find_one({"scheme_id": scheme.scheme_id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Scheme with ID '{scheme.scheme_id}' already exists.")

    scheme_dict = scheme.model_dump()
    col.insert_one(scheme_dict)
    return AdminResponse(
        success=True,
        message=f"Scheme '{scheme.name}' (ID: {scheme.scheme_id}) created successfully.",
        data={"scheme_id": scheme.scheme_id}
    )


@router.put("/schemes/{scheme_id}", response_model=AdminResponse)
def admin_update_scheme(scheme_id: str, updates: SchemeSchema, authenticated: bool = Depends(verify_admin_key)):
    col = get_schemes_collection()
    existing = col.find_one({"$or": [{"scheme_id": scheme_id}, {"id": scheme_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Scheme with ID '{scheme_id}' not found.")

    update_dict = updates.model_dump()
    col.update_one({"$or": [{"scheme_id": scheme_id}, {"id": scheme_id}]}, {"$set": update_dict})
    return AdminResponse(
        success=True,
        message=f"Scheme '{scheme_id}' updated successfully.",
        data={"scheme_id": scheme_id}
    )


@router.delete("/schemes/{scheme_id}", response_model=AdminResponse)
def admin_delete_scheme(scheme_id: str, authenticated: bool = Depends(verify_admin_key)):
    col = get_schemes_collection()
    res = col.delete_one({"$or": [{"scheme_id": scheme_id}, {"id": scheme_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Scheme with ID '{scheme_id}' not found.")
    return AdminResponse(
        success=True,
        message=f"Scheme '{scheme_id}' deleted successfully."
    )


@router.post("/import-schemes", response_model=AdminResponse)
def admin_batch_import_schemes(batch: SchemeImportBatch, authenticated: bool = Depends(verify_admin_key)):
    """
    Batch import structured JSON schemes through the scheme ingestion pipeline.
    """
    raw_list = [s.model_dump() for s in batch.schemes]
    result = ingest_scheme_batch(raw_list, imported_by="admin_api")

    return AdminResponse(
        success=True,
        message=f"Batch ingestion complete: {result['ingested']} schemes stored ({result['verified_count']} verified).",
        data=result
    )
