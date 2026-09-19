import uvicorn
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.services.data_seeder import seed_database

def check_and_seed_db():
    db_path = Path("cloudoptix.db")
    # If DB doesn't exist, create it and seed
    if not db_path.exists():
        print("Database not found. Initializing and seeding demo database...")
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    else:
        # Preserve existing demo data while ensuring the schema and documented
        # administrator account are always available.
        print("Database found. Ensuring tables and demo administrator are up to date...")
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            from app.models.models import User
            from app.core.auth import get_password_hash

            demo_admin = db.query(User).filter(User.email == "admin@cloudoptix.com").first()
            if not demo_admin:
                db.add(User(
                    email="admin@cloudoptix.com",
                    hashed_password=get_password_hash("admin123"),
                    is_active=True,
                ))
                db.commit()
                print("Created default demo administrator account.")
        finally:
            db.close()

if __name__ == "__main__":
    check_and_seed_db()
    print("Starting CloudOptix FastAPI server on http://localhost:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
