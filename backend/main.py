from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Airport API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/flights", response_model=List[schemas.FlightResponse])
def get_flights(db: Session = Depends(get_db)):
    return db.query(models.Flight).all()

@app.post("/tickets", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketBase, db: Session = Depends(get_db)):
    # Проверка, что место свободно
    existing = db.query(models.Ticket).filter(
        models.Ticket.flight_id == ticket.flight_id,
        models.Ticket.seat_number == ticket.seat_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Место уже занято")
        
    db_ticket = models.Ticket(**ticket.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket