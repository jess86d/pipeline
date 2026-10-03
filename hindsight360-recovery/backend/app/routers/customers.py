import io
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
    q: Optional[str] = Query(None, description="Search query by name, customer_key, or address"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if q:
        query = query.filter(
            (Customer.name.ilike(f"%{q}%")) |
            (Customer.customer_key.ilike(f"%{q}%")) |
            (Customer.address.ilike(f"%{q}%")) |
            (Customer.zip_code.ilike(f"%{q}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.customer_key == payload.customer_key).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with key '{payload.customer_key}' already exists")

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
    """Upload batch customer records from CSV or Excel (.xlsx) using pandas & openpyxl."""
    filename = file.filename.lower() if file.filename else ""
    contents = await file.read()
    
    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv or .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Standardize column headers (lowercase, stripped)
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    required_cols = ["customer_key", "name", "address", "zip_code"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns in header: {missing}")

    created_count = 0
    skipped_count = 0

    for _, row in df.iterrows():
        key = str(row["customer_key"]).strip()
        if not key or pd.isna(row["customer_key"]):
            continue

        if db.query(Customer).filter(Customer.customer_key == key).first():
            skipped_count += 1
            continue

        raw_name = str(row.get("name", "")).strip()
        raw_addr = str(row.get("address", "")).strip()
        raw_zip = str(row.get("zip_code", "")).strip()
        raw_phone = str(row.get("phone", "")).strip() if "phone" in df.columns and pd.notna(row.get("phone")) else None

        customer = Customer(
            customer_key=key,
            name=raw_name,
            normalized_name=normalize_name(raw_name),
            address=raw_addr,
            normalized_address=normalize_address(raw_addr),
            zip_code=raw_zip,
            normalized_zip=normalize_zip(raw_zip),
            phone=raw_phone,
            normalized_phone=normalize_phone(raw_phone) if raw_phone else None
        )
        db.add(customer)
        created_count += 1

    db.commit()
    return {
        "status": "success",
        "processed_records": len(df),
        "created_customers": created_count,
        "skipped_duplicates": skipped_count
    }

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"status": "success", "message": f"Customer {customer_id} deleted"}
