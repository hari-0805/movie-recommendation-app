import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

import urllib.parse

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./movies.db")

def sanitize_db_url(url: str) -> str:
    if not url or url.startswith("sqlite"):
        return url
    
    # SQLAlchemy 1.4+ deprecated the postgres:// prefix in favor of postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    try:
        if '@' in url and "://" in url:
            left, right = url.rsplit('@', 1)
            scheme, rest = left.split('://', 1)
            if ':' in rest:
                username, password = rest.split(':', 1)
                username = urllib.parse.unquote(username)
                password = urllib.parse.unquote(password)
                if password.startswith('[') and password.endswith(']'):
                    password = password[1:-1]
                username_encoded = urllib.parse.quote_plus(username)
                password_encoded = urllib.parse.quote_plus(password)
                return f"{scheme}://{username_encoded}:{password_encoded}@{right}"
    except Exception:
        pass
    return url

DATABASE_URL = sanitize_db_url(DATABASE_URL)

# Configure SQLite check_same_thread or connect directly for other databases like PostgreSQL
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()