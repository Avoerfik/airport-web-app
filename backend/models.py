from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Aircraft(Base):
    __tablename__ = "aircraft"
    id = Column(Integer, primary_key=True, index=True)
    model = Column(String(50), nullable=False)
    reg_number = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    
    flights = relationship("Flight", back_populates="aircraft")

class Passenger(Base):
    __tablename__ = "passenger"
    id = Column(Integer, primary_key=True, index=True)
    surname = Column(String(50), nullable=False)
    first_name = Column(String(50), nullable=False)
    patronymic = Column(String(50))
    passport = Column(String(20), unique=True, nullable=False)
    phone = Column(String(16))

    tickets = relationship("Ticket", back_populates="passenger")

class Flight(Base):
    __tablename__ = "flight"
    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String(10), nullable=False)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    status = Column(String(50), default='По расписанию')
    aircraft_id = Column(Integer, ForeignKey("aircraft.id"), nullable=False)

    aircraft = relationship("Aircraft", back_populates="flights")
    tickets = relationship("Ticket", back_populates="flight")

class Ticket(Base):
    __tablename__ = "ticket"
    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, ForeignKey("flight.id", ondelete="CASCADE"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("passenger.id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(String(5), nullable=False)
    ticket_class = Column(String(20), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    purchase_date = Column(Date, default=datetime.date.today)

    flight = relationship("Flight", back_populates="tickets")
    passenger = relationship("Passenger", back_populates="tickets")