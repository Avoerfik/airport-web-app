import os
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
DB_NAME = os.getenv("POSTGRES_DB", "airport_pag8")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 1. ORM (используется ТОЛЬКО для авторизации и ролей пользователей согласно требованиям ТР)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_orm_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. DB-API (используется для вызова VIEW, хранимых процедур и функций)
def get_dbapi_conn():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor
    )
    try:
        yield conn
    finally:
        conn.close()

