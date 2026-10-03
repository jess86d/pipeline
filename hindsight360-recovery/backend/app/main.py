import logging
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
            c3 = Customer(
                customer_key="CUST-3104",
                name="Katherine M. Vance-Smith",
                normalized_name=normalize_name("Katherine M. Vance-Smith"),
                address="450 Ocean View Drive",
                normalized_address=normalize_address("450 Ocean View Drive"),
                zip_code="92651",
                normalized_zip=normalize_zip("92651"),
                phone="949-555-8810"
            )
            db.add_all([c1, c2, c3])
            db.commit()

            # Sample Properties from State APIs and Permitted Feeds
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
            p2 = Property(
                parcel_id="APN-TX-88204-B",
                owner_name="ACME INDUSTRIAL HOLDINGS LLC",
                normalized_owner_name=normalize_name("ACME INDUSTRIAL HOLDINGS LLC"),
                property_address="1200 S INDUSTRIAL PKWY # 400",
                normalized_address=normalize_address("1200 S INDUSTRIAL PKWY # 400"),
                zip_code="78701-4402",
                normalized_zip=normalize_zip("78701-4402"),
                source_type=SourceType.PERMITTED_FEED,
                source_name="Travis County CAD GIS Permitted Feed"
            )
            p3 = Property(
                parcel_id="APN-CA-09412-A",
                owner_name="SMITH KATHERINE M TR",
                normalized_owner_name=normalize_name("SMITH KATHERINE M TR"),
                property_address="450 OCEAN VIEW DR",
                normalized_address=normalize_address("450 OCEAN VIEW DR"),
                zip_code="92651",
                normalized_zip=normalize_zip("92651"),
                source_type=SourceType.STATE_API,
                source_name="CA State Board of Equalization API"
            )
            db.add_all([p1, p2, p3])
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
    }
