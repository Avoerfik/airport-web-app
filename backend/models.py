from sqlalchemy import Column, Integer, String
from database import Base

class AppUser(Base):
    __tablename__ = "app_users_pag8"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(20), nullable=False)
    full_name = Column(String(100), nullable=False)
    passenger_id = Column(Integer, nullable=True)
