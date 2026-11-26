import os
import hashlib
import jwt
import psycopg2
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import engine, get_orm_db, get_dbapi_conn, SessionLocal

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_mei_pag8_key_2026")

# Создаём только таблицу пользователей через ORM
models.Base.metadata.create_all(bind=engine)

def hash_pwd(pwd: str) -> str:
    return hashlib.sha256(pwd.encode("utf-8")).hexdigest()

# Инициализация тестовых учётных записей для защиты (логин / пароль)
def init_users():
    db = SessionLocal()
    try:
        if db.query(models.AppUser).count() == 0:
            users = [
                models.AppUser(username="admin", password_hash=hash_pwd("admin123"), role="admin", full_name="Администратор Системы"),
                models.AppUser(username="cashier", password_hash=hash_pwd("cashier123"), role="cashier", full_name="Сидоров А. В. (Кассир)"),
                models.AppUser(username="passenger", password_hash=hash_pwd("pass123"), role="passenger", full_name="Иванов П. С. (Пассажир)"),
            ]
            db.add_all(users)
            db.commit()
    finally:
        db.close()

init_users()

app = FastAPI(title="Airport IS _PAG8")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

def require_roles(allowed_roles: list):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Недостаточно прав для выполнения операции")
        return user
    return checker

# --- АВТОРИЗАЦИЯ (ORM) ---
@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_orm_db)):
    user = db.query(models.AppUser).filter(models.AppUser.username == req.username).first()
    if not user or user.password_hash != hash_pwd(req.password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    token = jwt.encode({"sub": user.username, "role": user.role, "full_name": user.full_name}, JWT_SECRET, algorithm="HS256")
    return {"access_token": token, "role": user.role, "full_name": user.full_name}

# --- ЧТЕНИЕ ДАННЫХ ТОЛЬКО ЧЕРЕЗ VIEW И ФУНКЦИИ (DB-API) ---
@app.get("/schedule")
def get_schedule(origin: Optional[str] = None, destination: Optional[str] = None, conn=Depends(get_dbapi_conn)):
    with conn.cursor() as cur:
        query = "SELECT * FROM v_public_schedule_PAG8 WHERE 1=1"
        params = []
        if origin:
            query += " AND origin ILIKE %s"
            params.append(f"%{origin}%")
        if destination:
            query += " AND destination ILIKE %s"
            params.append(f"%{destination}%")
        query += " ORDER BY departure_time"
        cur.execute(query, params)
        return cur.fetchall()

@app.get("/tickets")
def get_tickets(user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM v_tickets_registry_PAG8 ORDER BY ticket_id DESC")
        return cur.fetchall()

@app.get("/references")
def get_references(user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM v_passengers_list_PAG8 ORDER BY surname")
        passengers = cur.fetchall()
        cur.execute("SELECT * FROM v_aircrafts_list_PAG8 ORDER BY model")
        aircrafts = cur.fetchall()
        return {"passengers": passengers, "aircrafts": aircrafts}

@app.get("/analytics")
def get_analytics(user=Depends(require_roles(["admin"])), conn=Depends(get_dbapi_conn)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM fn_flights_analytics_PAG8()")
        analytics = cur.fetchall()
        cur.execute("SELECT * FROM v_audit_log_PAG8")
        logs = cur.fetchall()
        return {"analytics": analytics, "logs": logs}

# --- ИЗМЕНЕНИЕ ДАННЫХ ТОЛЬКО ЧЕРЕЗ ХРАНИМЫЕ ПРОЦЕДУРЫ (DB-API) ---
@app.post("/flights")
def create_flight(data: schemas.FlightCreate, user=Depends(require_roles(["admin"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute(
                "CALL sp_create_flight_PAG8(%s, %s, %s, %s, %s, %s)",
                (data.flight_number, data.origin, data.destination, data.departure_time, data.arrival_time, data.aircraft_reg_number)
            )
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

@app.patch("/flights/{flight_id}/status")
def update_flight_status(flight_id: int, data: schemas.FlightStatusUpdate, user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute("CALL sp_update_flight_status_PAG8(%s, %s)", (flight_id, data.status))
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

@app.delete("/flights/{flight_id}")
def delete_flight(flight_id: int, user=Depends(require_roles(["admin"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute("CALL sp_delete_flight_PAG8(%s)", (flight_id,))
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

@app.post("/passengers")
def register_passenger(data: schemas.PassengerCreate, user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute(
                "CALL sp_register_passenger_PAG8(%s, %s, %s, %s, %s, %s)",
                (data.surname, data.name, data.patronymic, data.birthdate, data.passport, data.phone)
            )
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

@app.post("/tickets")
def issue_ticket(data: schemas.TicketIssueRequest, user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute(
                "CALL sp_issue_ticket_PAG8(%s, %s, %s, %s, %s, %s)",
                (data.passenger_id, data.flight_id, 1, data.seat_number, data.ticket_class, data.base_price)
            )
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

@app.patch("/tickets/{ticket_id}/cancel")
def cancel_ticket(ticket_id: int, user=Depends(require_roles(["admin", "cashier"])), conn=Depends(get_dbapi_conn)):
    try:
        with conn.cursor() as cur:
            cur.execute("CALL sp_cancel_ticket_PAG8(%s)", (ticket_id,))
        conn.commit()
        return {"status": "ok"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=e.pgerror.split("\n")[0])

