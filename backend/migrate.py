from app.database.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE collections ADD COLUMN is_public BOOLEAN DEFAULT 0"))
        conn.commit()
        print("is_public column added to collections table")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("is_public column already exists - skipping")
        else:
            raise e