from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class AircraftBase(BaseModel):
    model: str
    reg_number: str
    capacity: int

class AircraftResponse(AircraftBase):
    id: int
    class Config:
        from_attributes = True

class FlightBase(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    status: str
    aircraft_id: int

class FlightResponse(FlightBase):
    id: int
    aircraft: AircraftResponse
    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    flight_id: int
    passenger_id: int
    seat_number: str
    ticket_class: str
    price: float

class TicketResponse(TicketBase):
    id: int
    purchase_date: date
    class Config:
        from_attributes = True