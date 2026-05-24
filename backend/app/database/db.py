# app/database/db.py
# Sets up SQLite database connection using SQLAlchemy

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database file will be created in the backend folder
DATABASE_URL = "sqlite:///./movies.db"

# Create the database engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite only
)

# Each request gets its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()


# Dependency — gives a database session to each route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
