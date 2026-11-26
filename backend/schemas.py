from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    role: str
    full_name: str
    passenger_id: Optional[int] = None

class PassengerRegisterRequest(BaseModel):
    username: str
    password: str
    surname: str
    name: str
    patronymic: Optional[str] = None
    birthdate: date
    passport: str
    phone: Optional[str] = None

class AdminUserCreateRequest(BaseModel):
    username: str
    password: str
    role: str
    full_name: str
    passenger_id: Optional[int] = None

class FlightCreate(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    aircraft_reg_number: str

class FlightStatusUpdate(BaseModel):
    status: str

class PassengerCreate(BaseModel):
    surname: str
    name: str
    patronymic: Optional[str] = None
    birthdate: date
    passport: str
    phone: Optional[str] = None

class TicketIssueRequest(BaseModel):
    passenger_id: Optional[int] = None
    flight_id: int
    seat_number: str
    ticket_class: str
    base_price: float
