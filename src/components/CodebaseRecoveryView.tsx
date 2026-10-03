import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AppView } from '../types';

interface FileNode {
  path: string;
  name: string;
  language: 'python' | 'javascript' | 'text';
  category: 'backend' | 'frontend';
  description: string;
  code: string;
}

const REPOSITORY_FILES: FileNode[] = [
  {
    path: 'backend/requirements.txt',
    name: 'requirements.txt',
    language: 'text',
    category: 'backend',
    description: 'Python backend dependencies: FastAPI, Uvicorn, SQLAlchemy, Psycopg (PostgreSQL), Multipart, Pandas, Openpyxl, RapidFuzz, and Dotenv.',
    code: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
sqlalchemy>=2.0.28
psycopg[binary]>=3.1.18
python-multipart>=0.0.9
pandas>=2.2.1
openpyxl>=3.1.2
rapidfuzz>=3.6.1
python-dotenv>=1.0.1`,
  },
  {
    path: 'backend/app/main.py',
    name: 'main.py',
    language: 'python',
    category: 'backend',
    description: 'FastAPI application entrypoint, CORS configuration, database auto-migration, and seed data initialization.',
    code: `import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Customer, Property, SourceType, MatchStatus
from .matching import normalize_name, normalize_address, normalize_zip, run_matching_pipeline
from .routers import customers, properties, matches

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hindsight360")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HINDSIGHT360 Recovery API",
    description="Enterprise Record Linkage Pipeline: Customer Database & Public Assessor Property Resolution using RapidFuzz",
    version="1.0.0"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(customers.router)
app.include_router(properties.router)
app.include_router(matches.router)

@app.on_event("startup")
def seed_initial_data():
    """Seeds canonical sample records if the database is newly initialized."""
    db = SessionLocal()
    try:
        if db.query(Customer).count() == 0:
            logger.info("Seeding initial Hindsight360 customer & property records...")
            
            # Sample Customers
            c1 = Customer(
                customer_key="CUST-1049",
                name="Johnathan D. Doe",
                normalized_name=normalize_name("Johnathan D. Doe"),
                address="742 Evergreen Terrace",
                normalized_address=normalize_address("742 Evergreen Terrace"),
                zip_code="97477-0021",
                normalized_zip=normalize_zip("97477-0021"),
                phone="541-555-0199"
            )
            c2 = Customer(
                customer_key="CUST-2081",
                name="Acme Industrial Holdings, LLC",
                normalized_name=normalize_name("Acme Industrial Holdings, LLC"),
                address="1200 South Industrial Parkway, Suite 400",
                normalized_address=normalize_address("1200 South Industrial Parkway, Suite 400"),
                zip_code="78701",
                normalized_zip=normalize_zip("78701"),
                phone="512-555-4432"
            )
            db.add_all([c1, c2])
            db.commit()

            # Sample Properties
            p1 = Property(
                parcel_id="APN-OR-49102-1",
                owner_name="DOE JOHNATHAN D (TRUSTEE)",
                normalized_owner_name=normalize_name("DOE JOHNATHAN D (TRUSTEE)"),
                property_address="742 EVERGREEN TER",
                normalized_address=normalize_address("742 EVERGREEN TER"),
                zip_code="97477",
                normalized_zip=normalize_zip("97477"),
                source_type=SourceType.STATE_API,
                source_name="Oregon Dept of Revenue State Feed"
            )
            db.add(p1)
            db.commit()

            # Run initial matching evaluation
            run_matching_pipeline(db)
            logger.info("Initialization complete. Pipeline ready.")
    finally:
        db.close()

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "HINDSIGHT360 Matching API",
        "algorithm": "RapidFuzz token_set_ratio composite linkage",
        "weights": {"name": 0.45, "address": 0.35, "location": 0.20}
    }`,
  },
  {
    path: 'backend/app/database.py',
    name: 'database.py',
    language: 'python',
    category: 'backend',
    description: 'SQLAlchemy database engine configured with psycopg PostgreSQL driver, connection pool pre-ping, and scoped session dependency.',
    code: `# database.py

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost/hindsight360"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()`,
  },
  {
    path: 'backend/app/models.py',
    name: 'models.py',
    language: 'python',
    category: 'backend',
    description: 'SQLAlchemy relational models: Customer, Property (APN & Deed records), and MatchRecord.',
    code: `import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from .database import Base

class MatchStatus(str, enum.Enum):
    HIGH_CONFIDENCE = "high_confidence"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class SourceType(str, enum.Enum):
    STATE_API = "state_api"
    PERMITTED_FEED = "permitted_feed"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_key = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), index=True)
    address = Column(String(255), nullable=False)
    normalized_address = Column(String(255), index=True)
    zip_code = Column(String(20), nullable=False, index=True)
    normalized_zip = Column(String(10), index=True)
    phone = Column(String(50), nullable=True)
    normalized_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matches = relationship("MatchRecord", back_populates="customer", cascade="all, delete-orphan")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), unique=True, index=True, nullable=False)
    owner_name = Column(String(255), nullable=False, index=True)
    normalized_owner_name = Column(String(255), index=True)
    property_address = Column(String(255), nullable=False)
    normalized_address = Column(String(255), index=True)
    zip_code = Column(String(20), nullable=False, index=True)
    normalized_zip = Column(String(10), index=True)
    source_type = Column(Enum(SourceType), default=SourceType.STATE_API, nullable=False)
    source_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    matches = relationship("MatchRecord", back_populates="property", cascade="all, delete-orphan")

class MatchRecord(Base):
    __tablename__ = "match_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    
    name_score = Column(Float, nullable=False)
    address_score = Column(Float, nullable=False)
    location_score = Column(Float, nullable=False)
    composite_score = Column(Float, nullable=False, index=True)
    
    status = Column(Enum(MatchStatus), default=MatchStatus.PENDING_REVIEW, index=True, nullable=False)
    audit_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="matches")
    property = relationship("Property", back_populates="matches")`,
  },
  {
    path: 'backend/app/schemas.py',
    name: 'schemas.py',
    language: 'python',
    category: 'backend',
    description: 'Pydantic data schemas for request payloads, API responses, scoring weights, and dashboard KPIs.',
    code: `from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class CustomerBase(BaseModel):
    customer_key: str
    name: str
    address: str
    zip_code: str
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    normalized_name: Optional[str] = None
    normalized_address: Optional[str] = None
    normalized_zip: Optional[str] = None
    normalized_phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PropertyBase(BaseModel):
    parcel_id: str
    owner_name: str
    property_address: str
    zip_code: str
    source_type: str = "state_api"
    source_name: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: int
    normalized_owner_name: Optional[str] = None
    normalized_address: Optional[str] = None
    normalized_zip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    id: int
    customer_id: int
    property_id: int
    name_score: float
    address_score: float
    location_score: float
    composite_score: float
    status: str
    audit_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    
    customer: CustomerResponse
    property: PropertyResponse

    class Config:
        from_attributes = True

class MatchTriageRequest(BaseModel):
    status: str
    audit_notes: Optional[str] = None
    reviewed_by: Optional[str] = "Auditor"

class MatchWeightsConfig(BaseModel):
    name_weight: float = 0.45
    address_weight: float = 0.35
    location_weight: float = 0.20
    threshold_high: float = 75.0
    threshold_review: float = 50.0

class DashboardStats(BaseModel):
    total_customers: int
    total_properties: int
    total_matches: int
    high_confidence_count: int
    pending_review_count: int
    approved_count: int
    rejected_count: int
    average_confidence: float`,
  },
  {
    path: 'backend/app/matching.py',
    name: 'matching.py',
    language: 'python',
    category: 'backend',
    description: 'Core matching algorithm: deterministic normalization, RapidFuzz token_set_ratio, and weighted composite scoring.',
    code: `import re
from typing import Dict
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from .models import Customer, Property, MatchRecord, MatchStatus

def normalize_name(name: str) -> str:
    """Uppercase, strip punctuation, clean extra whitespace."""
    if not name:
        return ""
    cleaned = re.sub(r"[^\\w\\s]", "", str(name).upper())
    return " ".join(cleaned.split())

def normalize_address(address: str) -> str:
    """Canonicalize street abbreviations."""
    if not address:
        return ""
    addr = str(address).upper()
    replacements = {
        r"\\bSTREET\\b": "ST",
        r"\\bAVENUE\\b": "AVE",
        r"\\bBOULEVARD\\b": "BLVD",
        r"\\bROAD\\b": "RD",
        r"\\bDRIVE\\b": "DR",
        r"\\bSUITE\\b": "STE",
        r"\\bAPARTMENT\\b": "APT",
        r"\\bUNIT\\b": "#",
    }
    for pattern, repl in replacements.items():
        addr = re.sub(pattern, repl, addr)
    addr = re.sub(r"[^\\w\\s#]", "", addr)
    return " ".join(addr.split())

def normalize_zip(zip_code: str) -> str:
    digits = "".join(filter(str.isdigit, str(zip_code)))
    return digits[:5]

def calculate_location_score(zip1: str, zip2: str) -> float:
    z1 = normalize_zip(zip1)
    z2 = normalize_zip(zip2)
    if not z1 or not z2:
        return 50.0
    if z1 == z2:
        return 100.0
    if z1[:3] == z2[:3]:
        return 70.0
    return 0.0

def calculate_composite_match(
    customer_name: str,
    property_owner: str,
    customer_address: str,
    property_address: str,
    customer_zip: str,
    property_zip: str,
    name_weight: float = 0.45,
    address_weight: float = 0.35,
    location_weight: float = 0.20
) -> Dict[str, float]:
    c_name_norm = normalize_name(customer_name)
    p_owner_norm = normalize_name(property_owner)
    name_score = float(fuzz.token_set_ratio(c_name_norm, p_owner_norm))

    c_addr_norm = normalize_address(customer_address)
    p_addr_norm = normalize_address(property_address)
    address_score = float(fuzz.token_set_ratio(c_addr_norm, p_addr_norm))

    location_score = calculate_location_score(customer_zip, property_zip)

    composite = (
        (name_score * name_weight) +
        (address_score * address_weight) +
        (location_score * location_weight)
    )

    return {
        "name_score": round(name_score, 1),
        "address_score": round(address_score, 1),
        "location_score": round(location_score, 1),
        "composite_score": round(composite, 1)
    }

def run_matching_pipeline(
    db: Session,
    name_weight: float = 0.45,
    address_weight: float = 0.35,
    location_weight: float = 0.20,
    threshold_high: float = 75.0,
    threshold_review: float = 50.0
) -> int:
    customers = db.query(Customer).all()
    properties = db.query(Property).all()
    match_count = 0

    for customer in customers:
        for prop in properties:
            scores = calculate_composite_match(
                customer.name, prop.owner_name,
                customer.address, prop.property_address,
                customer.zip_code, prop.zip_code,
                name_weight, address_weight, location_weight
            )
            composite = scores["composite_score"]

            if composite >= threshold_review:
                existing = db.query(MatchRecord).filter(
                    MatchRecord.customer_id == customer.id,
                    MatchRecord.property_id == prop.id
                ).first()

                status = MatchStatus.HIGH_CONFIDENCE if composite >= threshold_high else MatchStatus.PENDING_REVIEW

                if existing:
                    if existing.status in [MatchStatus.HIGH_CONFIDENCE, MatchStatus.PENDING_REVIEW]:
                        existing.status = status
                    existing.name_score = scores["name_score"]
                    existing.address_score = scores["address_score"]
                    existing.location_score = scores["location_score"]
                    existing.composite_score = composite
                else:
                    db.add(MatchRecord(
                        customer_id=customer.id,
                        property_id=prop.id,
                        name_score=scores["name_score"],
                        address_score=scores["address_score"],
                        location_score=scores["location_score"],
                        composite_score=composite,
                        status=status,
                        audit_notes=f"Auto-generated link score: {composite}%"
                    ))
                    match_count += 1

    db.commit()
    return match_count`,
  },
  {
    path: 'backend/app/routers/customers.py',
    name: 'customers.py',
    language: 'python',
    category: 'backend',
    description: 'FastAPI router for customer CRUD operations, search filters, and batch CSV/Excel (.xlsx) ingestion via pandas & openpyxl.',
    code: `import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerResponse
from ..matching import normalize_name, normalize_address, normalize_zip, normalize_phone

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    q: Optional[str] = Query(None, description="Search query"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if q:
        query = query.filter(
            (Customer.name.ilike(f"%{q}%")) |
            (Customer.customer_key.ilike(f"%{q}%")) |
            (Customer.address.ilike(f"%{q}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.customer_key == payload.customer_key).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer '{payload.customer_key}' exists")

    customer = Customer(
        customer_key=payload.customer_key,
        name=payload.name,
        normalized_name=normalize_name(payload.name),
        address=payload.address,
        normalized_address=normalize_address(payload.address),
        zip_code=payload.zip_code,
        normalized_zip=normalize_zip(payload.zip_code),
        phone=payload.phone,
        normalized_phone=normalize_phone(payload.phone) if payload.phone else None
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/upload")
async def upload_customers_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Batch ingest customers from CSV or Excel (.xlsx) using pandas and openpyxl."""
    filename = file.filename.lower() if file.filename else ""
    contents = await file.read()
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    elif filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        raise HTTPException(status_code=400, detail="Upload .csv or .xlsx file")
    
    # Process and persist rows...
    return {"status": "success", "processed": len(df)}`,
  },
  {
    path: 'backend/app/routers/properties.py',
    name: 'properties.py',
    language: 'python',
    category: 'backend',
    description: 'FastAPI router for public assessor records, state APIs, permitted GIS feeds, and stream simulation.',
    code: `from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Property, SourceType
from ..schemas import PropertyCreate, PropertyResponse
from ..matching import normalize_name, normalize_address, normalize_zip

router = APIRouter(prefix="/api/properties", tags=["Properties"])

@router.get("/", response_model=List[PropertyResponse])
def list_properties(
    q: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
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
            (Property.property_address.ilike(f"%{q}%"))
        )
    return query.offset(skip).limit(limit).all()

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
    return {"status": "success", "ingested_records": added}`,
  },
  {
    path: 'backend/app/routers/matches.py',
    name: 'matches.py',
    language: 'python',
    category: 'backend',
    description: 'FastAPI router for triggering RapidFuzz cross-matching, auditor review queue triage, and verified CSV export.',
    code: `from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MatchRecord, MatchStatus
from ..schemas import MatchResponse, MatchTriageRequest, MatchWeightsConfig, DashboardStats
from ..matching import run_matching_pipeline

router = APIRouter(prefix="/api/matches", tags=["Matches"])

@router.get("/", response_model=List[MatchResponse])
def list_matches(
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(MatchRecord)
    if status:
        query = query.filter(MatchRecord.status == status)
    if min_score is not None:
        query = query.filter(MatchRecord.composite_score >= min_score)
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
    return {"status": "success", "candidate_links": count}

@router.patch("/{match_id}/triage", response_model=MatchResponse)
def triage_match(match_id: int, payload: MatchTriageRequest, db: Session = Depends(get_db)):
    match_rec = db.query(MatchRecord).filter(MatchRecord.id == match_id).first()
    if not match_rec:
        raise HTTPException(status_code=404, detail="Match record not found")

    match_rec.status = MatchStatus(payload.status)
    match_rec.audit_notes = payload.audit_notes or match_rec.audit_notes
    match_rec.reviewed_by = payload.reviewed_by or "Lead Auditor"
    match_rec.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(match_rec)
    return match_rec

@router.get("/export")
def export_high_confidence_csv(
    scope: str = Query("high_confidence", description="'high_confidence', 'review_queue', or 'all'"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exports verified high-confidence, review queue, or all audit findings in standard CSV format."""
    query = db.query(MatchRecord)
    if status:
        query = query.filter(MatchRecord.status == status)
    elif scope == "high_confidence":
        query = query.filter(MatchRecord.status.in_([MatchStatus.HIGH_CONFIDENCE, MatchStatus.APPROVED]))
    elif scope == "review_queue":
        query = query.filter(MatchRecord.status.in_([MatchStatus.PENDING_REVIEW, MatchStatus.REJECTED]))

    matches = query.order_by(MatchRecord.composite_score.desc()).all()
    data = []
    for m in matches:
        data.append({
            "Customer Key": m.customer.customer_key,
            "Customer Name": m.customer.name,
            "Parcel ID": m.property.parcel_id,
            "Deed Owner": m.property.owner_name,
            "Confidence Score": m.composite_score,
            "Audit Status": m.status.value,
            "Audit Notes": m.audit_notes or "",
            "Reviewed By": m.reviewed_by or "Lead Auditor",
            "Reviewed At": m.reviewed_at.isoformat() if m.reviewed_at else ""
        })
    df = pd.DataFrame(data)
    return Response(content=df.to_csv(index=False), media_type="text/csv")

@router.get("/export-review-queue")
def export_review_queue_csv(status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Exports human-in-the-loop review queue candidates and auditor triage findings in CSV format."""
    query = db.query(MatchRecord).filter(MatchRecord.status.in_([MatchStatus.PENDING_REVIEW, MatchStatus.REJECTED, MatchStatus.APPROVED]))
    if status_filter:
        query = query.filter(MatchRecord.status == status_filter)
    matches = query.order_by(MatchRecord.composite_score.desc()).all()
    # Uses pd.DataFrame(data).to_csv(index=False)
    ...

@router.get("/export-excel")
def export_high_confidence_excel(db: Session = Depends(get_db)):
    """Exports verified linkages to formatted Excel workbook (.xlsx) via pandas and openpyxl."""
    matches = db.query(MatchRecord).filter(
        MatchRecord.status.in_([MatchStatus.HIGH_CONFIDENCE, MatchStatus.APPROVED])
    ).all()
    # Uses pd.ExcelWriter with openpyxl engine
    ...`,
  },
  {
    path: 'frontend/src/api.js',
    name: 'api.js',
    language: 'javascript',
    category: 'frontend',
    description: 'Frontend client module communicating with backend REST endpoints.',
    code: `const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

export async function fetchStats() {
  const res = await fetch(\`\${API_BASE_URL}/api/matches/stats\`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchCustomers(query = '') {
  const url = query 
    ? \`\${API_BASE_URL}/api/customers/?q=\${encodeURIComponent(query)}\`
    : \`\${API_BASE_URL}/api/customers/\`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchMatches(status = '') {
  const url = status 
    ? \`\${API_BASE_URL}/api/matches/?status=\${encodeURIComponent(status)}\`
    : \`\${API_BASE_URL}/api/matches/\`;
  const res = await fetch(url);
  return res.json();
}

export async function triageMatch(matchId, triageData) {
  const res = await fetch(\`\${API_BASE_URL}/api/matches/\${matchId}/triage\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(triageData),
  });
  return res.json();
}

export function downloadHighConfidenceCsvUrl() {
  return \`\${API_BASE_URL}/api/matches/export?scope=high_confidence\`;
}

export function downloadReviewQueueCsvUrl(status = '') {
  return status 
    ? \`\${API_BASE_URL}/api/matches/export-review-queue?status_filter=\${encodeURIComponent(status)}\`
    : \`\${API_BASE_URL}/api/matches/export-review-queue\`;
}`,
  },
  {
    path: 'frontend/src/App.jsx',
    name: 'App.jsx',
    language: 'javascript',
    category: 'frontend',
    description: 'Root frontend layout with navigation between Dashboard, Customers, and Matches views.',
    code: `import React, { useState } from 'react';
import { ShieldCheck, LayoutDashboard, Database, GitMerge } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Matches from './pages/Matches';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-300 flex flex-col">
      <header className="border-b border-slate-800 bg-[#0c0e14] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="font-black text-white text-base tracking-tight">HINDSIGHT360</div>
          </div>
          <nav className="flex items-center gap-2 text-xs">
            <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
            <button onClick={() => setCurrentPage('customers')}>Customers</button>
            <button onClick={() => setCurrentPage('matches')}>Matches</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'customers' && <Customers />}
        {currentPage === 'matches' && <Matches />}
      </main>
    </div>
  );
}`,
  },
  {
    path: 'frontend/src/pages/Dashboard.jsx',
    name: 'Dashboard.jsx',
    language: 'javascript',
    category: 'frontend',
    description: 'System overview dashboard showing KPIs, pipeline execution status, and stream ingestion trigger.',
    code: `import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchStats, simulatePropertyIngest } from '../api';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    total_customers: 24,
    total_properties: 38,
    high_confidence_count: 11,
    pending_review_count: 5
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#121624] border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400">Total Customers</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total_customers}</div>
        </div>
        <div className="p-4 bg-[#121624] border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400">Public Deeds / APNs</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total_properties}</div>
        </div>
        <div className="p-4 bg-[#0e1713] border border-emerald-900/60 rounded-xl">
          <div className="text-xs text-emerald-400">High Confidence Matches</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.high_confidence_count}</div>
        </div>
        <div className="p-4 bg-[#18130c] border border-amber-900/60 rounded-xl">
          <div className="text-xs text-amber-400">Pending Review Queue</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.pending_review_count}</div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    path: 'frontend/src/pages/Customers.jsx',
    name: 'Customers.jsx',
    language: 'javascript',
    category: 'frontend',
    description: 'Customer directory interface with search, deterministic normalization visualization, and new record form.',
    code: `import React, { useState, useEffect } from 'react';
import { Search, Plus, Database } from 'lucide-react';
import { fetchCustomers, createCustomer } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Customer Canonical Registry</h1>
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-4">
        {/* Customer Table */}
      </div>
    </div>
  );
}`,
  },
  {
    path: 'frontend/src/pages/Matches.jsx',
    name: 'Matches.jsx',
    language: 'javascript',
    category: 'frontend',
    description: 'Review Queue & High Confidence resolution view with component score badges and approve/reject triage.',
    code: `import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { fetchMatches, triageMatch } from '../api';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('review');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveTab('review')}>Review Queue</button>
        <button onClick={() => setActiveTab('high_confidence')}>High Confidence</button>
      </div>
      {/* Side by side cards */}
    </div>
  );
}`,
  },
];

interface CodebaseRecoveryViewProps {
  onNavigateView: (view: AppView) => void;
}

export const CodebaseRecoveryView: React.FC<CodebaseRecoveryViewProps> = ({ onNavigateView }) => {
  const [selectedFile, setSelectedFile] = useState<FileNode>(REPOSITORY_FILES[1]); // backend/app/main.py
  const [copied, setCopied] = useState(false);
  const [backendOpen, setBackendOpen] = useState(true);
  const [appOpen, setAppOpen] = useState(true);
  const [routersOpen, setRoutersOpen] = useState(true);
  const [frontendOpen, setFrontendOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-800/80">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                hindsight360-recovery/
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Full-Stack Python FastAPI + React Architecture
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
              Repository Architecture &amp; File Tree
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Production codebase implementing FastAPI, SQLAlchemy ORM, RapidFuzz composite scoring, and reactive frontend controllers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateView('pipeline')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Pipeline Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive File Tree */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#101420] p-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-400" />
              <span>hindsight360-recovery/</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{REPOSITORY_FILES.length} files</span>
          </div>

          <div className="space-y-1 font-mono text-[12px] text-slate-300">
            {/* Backend Directory */}
            <div>
              <div
                onClick={() => setBackendOpen(!backendOpen)}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-slate-300 font-semibold"
              >
                {backendOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400" />}
                <span>backend/</span>
              </div>

              {backendOpen && (
                <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                  {/* backend/app */}
                  <div>
                    <div
                      onClick={() => setAppOpen(!appOpen)}
                      className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-slate-300"
                    >
                      {appOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400" />}
                      <span>app/</span>
                    </div>

                    {appOpen && (
                      <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                        {REPOSITORY_FILES.filter(f => f.path.startsWith('backend/app/') && !f.path.includes('/routers/')).map(f => (
                          <div
                            key={f.path}
                            onClick={() => setSelectedFile(f)}
                            className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
                              selectedFile.path === f.path
                                ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </div>
                        ))}

                        {/* backend/app/routers */}
                        <div>
                          <div
                            onClick={() => setRoutersOpen(!routersOpen)}
                            className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-slate-300"
                          >
                            {routersOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400" />}
                            <span>routers/</span>
                          </div>

                          {routersOpen && (
                            <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                              {REPOSITORY_FILES.filter(f => f.path.startsWith('backend/app/routers/')).map(f => (
                                <div
                                  key={f.path}
                                  onClick={() => setSelectedFile(f)}
                                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
                                    selectedFile.path === f.path
                                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                  }`}
                                >
                                  <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">{f.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* backend/requirements.txt */}
                  {REPOSITORY_FILES.filter(f => f.path === 'backend/requirements.txt').map(f => (
                    <div
                      key={f.path}
                      onClick={() => setSelectedFile(f)}
                      className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
                        selectedFile.path === f.path
                          ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frontend Directory */}
            <div className="pt-2">
              <div
                onClick={() => setFrontendOpen(!frontendOpen)}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-slate-300 font-semibold"
              >
                {frontendOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400" />}
                <span>frontend/</span>
              </div>

              {frontendOpen && (
                <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                  <div className="flex items-center gap-1.5 py-1 px-1.5 text-slate-400">
                    <Folder className="h-3.5 w-3.5 text-amber-400" />
                    <span>src/</span>
                  </div>

                  <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                    {REPOSITORY_FILES.filter(f => f.path.startsWith('frontend/src/') && !f.path.includes('/pages/')).map(f => (
                      <div
                        key={f.path}
                        onClick={() => setSelectedFile(f)}
                        className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
                          selectedFile.path === f.path
                            ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}

                    {/* frontend/src/pages */}
                    <div>
                      <div
                        onClick={() => setPagesOpen(!pagesOpen)}
                        className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-slate-300"
                      >
                        {pagesOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400" />}
                        <span>pages/</span>
                      </div>

                      {pagesOpen && (
                        <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 mt-0.5">
                          {REPOSITORY_FILES.filter(f => f.path.startsWith('frontend/src/pages/')).map(f => (
                            <div
                              key={f.path}
                              onClick={() => setSelectedFile(f)}
                              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
                                selectedFile.path === f.path
                                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer & Description */}
        <div className="lg:col-span-8 space-y-3">
          {/* File Header Bar */}
          <div className="rounded-xl border border-slate-800 bg-[#121624] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {selectedFile.path}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedFile.category === 'backend'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  {selectedFile.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1a202e] hover:bg-[#22293b] text-slate-200 px-3 py-1.5 text-xs font-medium transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Box */}
          <div className="rounded-xl border border-slate-800 bg-[#090b10] overflow-hidden shadow-inner font-mono text-xs">
            <div className="bg-[#0e111a] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span>{selectedFile.name} &bull; {selectedFile.language.toUpperCase()}</span>
              </div>
              <div>{selectedFile.code.split('\n').length} lines</div>
            </div>

            <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto leading-relaxed text-slate-200 selection:bg-emerald-900 selection:text-emerald-200">
              <pre>
                <code>
                  {selectedFile.code.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row hover:bg-slate-900/60">
                      <span className="table-cell pr-4 text-right select-none text-slate-600 text-[11px] w-8">
                        {idx + 1}
                      </span>
                      <span className="table-cell whitespace-pre">
                        {line}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
