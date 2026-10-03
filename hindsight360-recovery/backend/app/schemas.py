from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# --- Customer Schemas ---
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

# --- Property Schemas ---
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

# --- Match Schemas ---
class MatchScoreBreakdown(BaseModel):
    name_score: float
    address_score: float
    location_score: float
    composite_score: float

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
    status: str # "approved", "rejected", "pending_review"
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
    average_confidence: float
