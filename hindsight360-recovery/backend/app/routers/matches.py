import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
import pandas as pd
from ..database import get_db
from ..models import MatchRecord, MatchStatus, Customer, Property
from ..schemas import MatchResponse, MatchTriageRequest, MatchWeightsConfig, DashboardStats
from ..matching import run_matching_pipeline

router = APIRouter(prefix="/api/matches", tags=["Matches"])

@router.get("/", response_model=List[MatchResponse])
def list_matches(
    status: Optional[str] = Query(None, description="Filter by 'high_confidence', 'pending_review', 'approved', 'rejected'"),
    min_score: Optional[float] = Query(None, description="Minimum composite score"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(MatchRecord)
    if status:
        query = query.filter(MatchRecord.status == status)
    if min_score is not None:
        query = query.filter(MatchRecord.composite_score >= min_score)
    
    # Sort by composite score descending
    query = query.order_by(MatchRecord.composite_score.desc())
    return query.offset(skip).limit(limit).all()

@router.post("/run")
def trigger_matching_run(config: Optional[MatchWeightsConfig] = None, db: Session = Depends(get_db)):
    cfg = config or MatchWeightsConfig()
    count = run_matching_pipeline(
        db=db,
        name_weight=cfg.name_weight,
        address_weight=cfg.address_weight,
        location_weight=cfg.location_weight,
        threshold_high=cfg.threshold_high,
        threshold_review=cfg.threshold_review
    )
    return {
        "status": "success",
        "message": f"Matching engine evaluated pairs and generated/updated {count} candidate links.",
        "config_applied": cfg.dict()
    }

@router.patch("/{match_id}/triage", response_model=MatchResponse)
def triage_match(match_id: int, payload: MatchTriageRequest, db: Session = Depends(get_db)):
    match_rec = db.query(MatchRecord).filter(MatchRecord.id == match_id).first()
    if not match_rec:
        raise HTTPException(status_code=404, detail="Match record not found")

    valid_statuses = [s.value for s in MatchStatus]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    match_rec.status = MatchStatus(payload.status)
    match_rec.audit_notes = payload.audit_notes or match_rec.audit_notes
    match_rec.reviewed_by = payload.reviewed_by or "Lead Auditor"
    match_rec.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(match_rec)
    return match_rec

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_properties = db.query(Property).count()
    total_matches = db.query(MatchRecord).count()

    high_confidence_count = db.query(MatchRecord).filter(MatchRecord.status == MatchStatus.HIGH_CONFIDENCE).count()
    pending_review_count = db.query(MatchRecord).filter(MatchRecord.status == MatchStatus.PENDING_REVIEW).count()
    approved_count = db.query(MatchRecord).filter(MatchRecord.status == MatchStatus.APPROVED).count()
    rejected_count = db.query(MatchRecord).filter(MatchRecord.status == MatchStatus.REJECTED).count()

    matches = db.query(MatchRecord.composite_score).all()
    avg_score = round(sum([m[0] for m in matches]) / len(matches), 1) if matches else 0.0

    return DashboardStats(
        total_customers=total_customers,
        total_properties=total_properties,
        total_matches=total_matches,
        high_confidence_count=high_confidence_count,
        pending_review_count=pending_review_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        average_confidence=avg_score
    )

@router.get("/export")
def export_high_confidence_csv(
    scope: str = Query("high_confidence", description="Export scope: 'high_confidence', 'review_queue', or 'all'"),
    status: Optional[str] = Query(None, description="Specific status filter: 'high_confidence', 'pending_review', 'approved', 'rejected'"),
    db: Session = Depends(get_db)
):
    """Exports verified high-confidence, review queue, or all audit findings in standard CSV format using pandas."""
    query = db.query(MatchRecord)
    
    if status:
        query = query.filter(MatchRecord.status == status)
    elif scope == "high_confidence":
        query = query.filter(MatchRecord.status.in_([MatchStatus.HIGH_CONFIDENCE, MatchStatus.APPROVED]))
    elif scope == "review_queue":
        query = query.filter(MatchRecord.status.in_([MatchStatus.PENDING_REVIEW, MatchStatus.REJECTED]))
    # if scope == 'all', returns all records

    matches = query.order_by(MatchRecord.composite_score.desc()).all()

    data = []
    for m in matches:
        data.append({
            "Match ID": m.id,
            "Customer Key": m.customer.customer_key if m.customer else "",
            "Customer Name": m.customer.name if m.customer else "",
            "Customer Address": m.customer.address if m.customer else "",
            "Customer ZIP": m.customer.zip_code if m.customer else "",
            "Customer Phone": m.customer.phone if (m.customer and m.customer.phone) else "",
            "Parcel ID / APN": m.property.parcel_id if m.property else "",
            "Deed Owner Name": m.property.owner_name if m.property else "",
            "Property Address": m.property.property_address if m.property else "",
            "Property ZIP": m.property.zip_code if m.property else "",
            "Source Type": m.property.source_type.value if m.property else "",
            "Source Provider": m.property.source_name if (m.property and m.property.source_name) else "Public Assessor Feed",
            "Name Match Score (%)": m.name_score,
            "Address Match Score (%)": m.address_score,
            "Location Match Score (%)": m.location_score,
            "Composite RapidFuzz Score (%)": m.composite_score,
            "Audit Status": m.status.value,
            "Auditor Notes / Findings": m.audit_notes or "",
            "Reviewed By": m.reviewed_by or ("Unreviewed" if m.status == MatchStatus.PENDING_REVIEW else "System Pipeline"),
            "Reviewed At": m.reviewed_at.isoformat() if m.reviewed_at else "",
            "Generated At": m.created_at.isoformat() if m.created_at else ""
        })

    df = pd.DataFrame(data)
    csv_bytes = df.to_csv(index=False)
    filename = f"hindsight360_{scope}_matches.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export-review-queue")
def export_review_queue_csv(
    status_filter: Optional[str] = Query(None, description="Optional filter: 'pending_review', 'approved', 'rejected'"),
    db: Session = Depends(get_db)
):
    """Exports human-in-the-loop review queue candidates and auditor triage findings in CSV format."""
    query = db.query(MatchRecord)
    if status_filter:
        query = query.filter(MatchRecord.status == status_filter)
    else:
        # Default to review queue records: pending review or audited from queue
        query = query.filter(MatchRecord.status.in_([
            MatchStatus.PENDING_REVIEW,
            MatchStatus.REJECTED,
            MatchStatus.APPROVED
        ]))

    matches = query.order_by(MatchRecord.composite_score.desc()).all()

    data = []
    for m in matches:
        data.append({
            "Match ID": m.id,
            "Customer Key": m.customer.customer_key if m.customer else "",
            "Customer Name": m.customer.name if m.customer else "",
            "Customer Address": m.customer.address if m.customer else "",
            "Customer ZIP": m.customer.zip_code if m.customer else "",
            "Customer Phone": m.customer.phone if (m.customer and m.customer.phone) else "",
            "Parcel ID / APN": m.property.parcel_id if m.property else "",
            "Deed Owner Name": m.property.owner_name if m.property else "",
            "Property Address": m.property.property_address if m.property else "",
            "Property ZIP": m.property.zip_code if m.property else "",
            "Source Type": m.property.source_type.value if m.property else "",
            "Source Provider": m.property.source_name if (m.property and m.property.source_name) else "Public Assessor Feed",
            "Name Match Score (%)": m.name_score,
            "Address Match Score (%)": m.address_score,
            "Location Match Score (%)": m.location_score,
            "Composite RapidFuzz Score (%)": m.composite_score,
            "Audit Status": m.status.value,
            "Auditor Notes / Findings": m.audit_notes or "",
            "Reviewed By": m.reviewed_by or "Pending Auditor Review",
            "Reviewed At": m.reviewed_at.isoformat() if m.reviewed_at else "N/A",
            "Generated At": m.created_at.isoformat() if m.created_at else ""
        })

    df = pd.DataFrame(data)
    csv_bytes = df.to_csv(index=False)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hindsight360_review_queue_findings.csv"}
    )

@router.get("/export-excel")
def export_high_confidence_excel(db: Session = Depends(get_db)):
    """Exports verified linkages to formatted Excel workbook (.xlsx) via pandas and openpyxl."""
    matches = db.query(MatchRecord).filter(
        MatchRecord.status.in_([MatchStatus.HIGH_CONFIDENCE, MatchStatus.APPROVED])
    ).all()

    data = []
    for m in matches:
        data.append({
            "Customer Key": m.customer.customer_key,
            "Customer Name": m.customer.name,
            "Customer Address": m.customer.address,
            "Customer ZIP": m.customer.zip_code,
            "Parcel ID": m.property.parcel_id,
            "Deed Owner": m.property.owner_name,
            "Property Address": m.property.property_address,
            "Property ZIP": m.property.zip_code,
            "Source Type": m.property.source_type.value,
            "Name Score": m.name_score,
            "Address Score": m.address_score,
            "Location Score": m.location_score,
            "Confidence Score": m.composite_score,
            "Status": m.status.value
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Verified Linkages")
    output.seek(0)

    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=hindsight360_verified_matches.xlsx"}
    )
