from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import uvicorn
import os
from datetime import datetime, timedelta

from . import models, database, security

app = FastAPI(title="ImpactNews FX Pro API")

# CORS and Database init stayed same...
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

@app.on_event("startup")
async def startup_event():
    db = database.SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "Josue10").first()
        if not admin_user:
            admin_user = models.User(
                username="Josue10",
                hashed_password=security.get_password_hash("Josue1020."),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

# --- Rutas de la Web ---
# Montamos la carpeta static
static_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/static"))
app.mount("/static", StaticFiles(directory=static_path), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(static_path, "index.html"))

# --- Endpoints de Datos ---
from pydantic import BaseModel
from typing import List

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class PasswordChange(BaseModel):
    username: str
    new_password: str

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.username})
    
    # Track the active session
    new_session = models.UserSession(
        username=user.username,
        login_time=datetime.utcnow(),
        token=access_token
    )
    db.add(new_session)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer", "is_admin": user.is_admin}

# --- Admin Endpoints ---
@app.get("/admin/sessions")
async def list_sessions(admin: models.User = Depends(security.get_current_admin), db: Session = Depends(database.get_db)):
    sessions = db.query(models.UserSession).all()
    return [{
        "id": s.id,
        "username": s.username,
        "login_time": s.login_time,
        "is_me": False # Reserved for future frontend logic
    } for s in sessions]

@app.delete("/admin/sessions/{session_id}")
async def delete_session(session_id: int, admin: models.User = Depends(security.get_current_admin), db: Session = Depends(database.get_db)):
    session = db.query(models.UserSession).filter(models.UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Session terminated successfully"}

# --- Public Endpoints ---
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def public_register(user_in: UserCreate, db: Session = Depends(database.get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Force is_admin to False for public registration
    new_user = models.User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        is_admin=False
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

# --- Admin Endpoints ---
@app.post("/admin/users", status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, admin: models.User = Depends(security.get_current_admin), db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        is_admin=user_in.is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "username": new_user.username}

@app.get("/admin/users")
async def list_users(admin: models.User = Depends(security.get_current_admin), db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return [{"username": u.username, "is_admin": u.is_admin} for u in users]

@app.post("/admin/change-password")
async def change_password(data: PasswordChange, admin: models.User = Depends(security.get_current_admin), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"message": f"Password updated for user {data.username}"}

# --- News Endpoints ---
@app.get("/news/history")
async def get_news_history(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    now = datetime.utcnow()
    weekday = now.weekday()
    if weekday >= 5:
        db.query(models.NewsEvent).delete()
        db.commit()
        return []
    days_since_monday = weekday
    monday_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    db.query(models.NewsEvent).filter(models.NewsEvent.date_time < monday_start).delete()
    db.commit()
    return db.query(models.NewsEvent).filter(models.NewsEvent.date_time >= monday_start).order_by(models.NewsEvent.date_time.desc()).all()

@app.get("/news/today")
async def get_today_news(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.query(models.NewsEvent).filter(models.NewsEvent.date_time >= today_start).all()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
