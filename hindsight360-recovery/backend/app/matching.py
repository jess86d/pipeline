import re
from typing import Dict, Any, Tuple
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from .models import Customer, Property, MatchRecord, MatchStatus

# Canonical Normalization Rules
def normalize_name(name: str) -> str:
    """Uppercase, strip punctuation, clean extra whitespace."""
    if not name:
        return ""
    cleaned = re.sub(r"[^\w\s]", "", str(name).upper())
    return " ".join(cleaned.split())

def normalize_address(address: str) -> str:
    """Canonicalize street abbreviations (STREET -> ST, AVENUE -> AVE, etc.)."""
    if not address:
        return ""
    addr = str(address).upper()
    replacements = {
        r"\bSTREET\b": "ST",
        r"\bAVENUE\b": "AVE",
        r"\bBOULEVARD\b": "BLVD",
        r"\bROAD\b": "RD",
        r"\bDRIVE\b": "DR",
        r"\bLANE\b": "LN",
        r"\bCOURT\b": "CT",
        r"\bSUITE\b": "STE",
        r"\bAPARTMENT\b": "APT",
        r"\bUNIT\b": "#",
        r"\bNORTH\b": "N",
        r"\bSOUTH\b": "S",
        r"\bEAST\b": "E",
        r"\bWEST\b": "W",
    }
    for pattern, repl in replacements.items():
        addr = re.sub(pattern, repl, addr)
    addr = re.sub(r"[^\w\s#]", "", addr)
    return " ".join(addr.split())

def normalize_zip(zip_code: str) -> str:
    """Extract standard 5-digit postal code."""
    if not zip_code:
        return ""
    digits = "".join(filter(str.isdigit, str(zip_code)))
    return digits[:5]

def normalize_phone(phone: str) -> str:
    """Extract last 10 digits of phone number."""
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, str(phone)))
    return digits[-10:] if len(digits) >= 10 else digits

def calculate_location_score(zip1: str, zip2: str) -> float:
    """
    Geographic location scoring based on ZIP code hierarchy:
    - 100.0: Exact 5-digit ZIP match
    - 70.0: Sectional center match (first 3 digits)
    - 0.0: Complete divergence
    """
    z1 = normalize_zip(zip1)
    z2 = normalize_zip(zip2)
    if not z1 or not z2:
        return 50.0  # neutral penalty if unknown
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
    """
    Calculates weighted composite match score between customer and public deed record:
    Composite = (name_score * 0.45) + (address_score * 0.35) + (location_score * 0.20)
    """
    # 1. Fuzzy Name Score (token_set_ratio handles reordered names & corporate suffixes)
    c_name_norm = normalize_name(customer_name)
    p_owner_norm = normalize_name(property_owner)
    name_score = float(fuzz.token_set_ratio(c_name_norm, p_owner_norm))

    # 2. Fuzzy Address Score (token_set_ratio handles abbreviations & suite variances)
    c_addr_norm = normalize_address(customer_address)
    p_addr_norm = normalize_address(property_address)
    address_score = float(fuzz.token_set_ratio(c_addr_norm, p_addr_norm))

    # 3. Location Score
    location_score = calculate_location_score(customer_zip, property_zip)

    # 4. Composite weighted linkage
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
    """
    Executes cross-entity matching between Customer Database and Property Sources.
    Creates or updates MatchRecord entries categorized into High Confidence vs Review Queue.
    """
    customers = db.query(Customer).all()
    properties = db.query(Property).all()
    
    match_count = 0

    for customer in customers:
        for prop in properties:
            scores = calculate_composite_match(
                customer_name=customer.name,
                property_owner=prop.owner_name,
                customer_address=customer.address,
                property_address=prop.property_address,
                customer_zip=customer.zip_code,
                property_zip=prop.zip_code,
                name_weight=name_weight,
                address_weight=address_weight,
                location_weight=location_weight
            )

            composite = scores["composite_score"]

            # Only track potential candidate pairs (>= review threshold)
            if composite >= threshold_review:
                existing_match = db.query(MatchRecord).filter(
                    MatchRecord.customer_id == customer.id,
                    MatchRecord.property_id == prop.id
                ).first()

                # Determine initial status
                status = MatchStatus.HIGH_CONFIDENCE if composite >= threshold_high else MatchStatus.PENDING_REVIEW

                if existing_match:
                    # Only auto-update status if it hasn't been manually audited
                    if existing_match.status in [MatchStatus.HIGH_CONFIDENCE, MatchStatus.PENDING_REVIEW]:
                        existing_match.status = status
                    existing_match.name_score = scores["name_score"]
                    existing_match.address_score = scores["address_score"]
                    existing_match.location_score = scores["location_score"]
                    existing_match.composite_score = composite
                else:
                    new_record = MatchRecord(
                        customer_id=customer.id,
                        property_id=prop.id,
                        name_score=scores["name_score"],
                        address_score=scores["address_score"],
                        location_score=scores["location_score"],
                        composite_score=composite,
                        status=status,
                        audit_notes=f"Auto-generated link score: {composite}%"
                    )
                    db.add(new_record)
                    match_count += 1

    db.commit()
    return match_count
