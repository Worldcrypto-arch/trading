import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import models, database, security
from sqlalchemy.orm import Session

def seed_admin():
    db = database.SessionLocal()
    try:
        # Create users table if it doesn't exist
        models.Base.metadata.create_all(bind=database.engine)
        
        # Check if Josue10 exists
        admin = db.query(models.User).filter(models.User.username == "Josue10").first()
        if not admin:
            admin = models.User(
                username="Josue10",
                hashed_password=security.get_password_hash("Josue1020."),
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("Admin user Josue10 created successfully.")
        else:
            admin.hashed_password = security.get_password_hash("Josue1020.")
            admin.is_admin = True
            db.commit()
            print("Admin user Josue10 password updated.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
