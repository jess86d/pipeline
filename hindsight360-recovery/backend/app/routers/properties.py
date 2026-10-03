from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Property, SourceType
from ..schemas import PropertyCreate, PropertyResponse
from ..matching import normalize_name, normalize_address, normalize_zip

router = APIRouter(prefix="/api/properties", tags=["Properties"])

@router.get("/", response_model=List[PropertyResponse])
def list_properties(
    q: Optional[str] = Query(None, description="Search query by parcel_id, owner, or address"),
    source_type: Optional[str] = Query(None, description="Filter by 'state_api' or 'permitted_feed'"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if source_type:
        query = query.filter(Property.source_type == source_type)
    if q:
        query = query.filter(
            (Property.owner_name.ilike(f"%{q}%")) |
            (Property.parcel_id.ilike(f"%{q}%")) |
            (Property.property_address.ilike(f"%{q}%")) |
            (Property.zip_code.ilike(f"%{q}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=PropertyResponse)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db)):
    existing = db.query(Property).filter(Property.parcel_id == payload.parcel_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Property with parcel_id '{payload.parcel_id}' already exists")

    st = SourceType.STATE_API if payload.source_type == "state_api" else SourceType.PERMITTED_FEED
    prop = Property(
        parcel_id=payload.parcel_id,
        owner_name=payload.owner_name,
        normalized_owner_name=normalize_name(payload.owner_name),
        property_address=payload.property_address,
        normalized_address=normalize_address(payload.property_address),
        zip_code=payload.zip_code,
        normalized_zip=normalize_zip(payload.zip_code),
        source_type=st,
        source_name=payload.source_name
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

@router.post("/simulate-ingest")
def simulate_ingestion(db: Session = Depends(get_db)):
    """Simulates an incoming feed batch from State APIs and Permitted Feeds."""
    sample_deeds = [
        {
            "parcel_id": "APN-912-384-01",
            "owner_name": "JOHNATHAN D DOE TRUSTEE",
            "property_address": "742 EVERGREEN TER",
            "zip_code": "97477-1234",
            "source_type": SourceType.STATE_API,
            "source_name": "Oregon Real-Time State Assessor API"
        },
        {
            "parcel_id": "APN-118-203-88",
            "owner_name": "ACME INDUSTRIAL HOLDINGS LLC",
            "property_address": "1200 S INDUSTRIAL PKWY STE 400",
            "zip_code": "78701-4402",
            "source_type": SourceType.PERMITTED_FEED,
            "source_name": "Texas County CAD Permitted GIS Feed"
        }
    ]

    added = 0
    for deed in sample_deeds:
        if not db.query(Property).filter(Property.parcel_id == deed["parcel_id"]).first():
            prop = Property(
                parcel_id=deed["parcel_id"],
                owner_name=deed["owner_name"],
                normalized_owner_name=normalize_name(deed["owner_name"]),
                property_address=deed["property_address"],
                normalized_address=normalize_address(deed["property_address"]),
                zip_code=deed["zip_code"],
                normalized_zip=normalize_zip(deed["zip_code"]),
                source_type=deed["source_type"],
                source_name=deed["source_name"]
            )
            db.add(prop)
            added += 1

    db.commit()
    return {"status": "success", "ingested_records": added}
