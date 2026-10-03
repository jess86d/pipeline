import enum
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

    # Relationships
    matches = relationship("MatchRecord", back_populates="customer", cascade="all, delete-orphan")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. Assessor APN
    owner_name = Column(String(255), nullable=False, index=True)
    normalized_owner_name = Column(String(255), index=True)
    property_address = Column(String(255), nullable=False)
    normalized_address = Column(String(255), index=True)
    zip_code = Column(String(20), nullable=False, index=True)
    normalized_zip = Column(String(10), index=True)
    source_type = Column(Enum(SourceType), default=SourceType.STATE_API, nullable=False)
    source_name = Column(String(100), nullable=True) # e.g., 'CA Assessor Real-Time API'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
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
    property = relationship("Property", back_populates="matches")
