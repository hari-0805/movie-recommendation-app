"""
Run this once to add is_admin column to existing users table.
Usage: python migrate_admin.py
"""
from app.database.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
        conn.commit()
        print("✅ is_admin column added to users table")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("ℹ️  is_admin column already exists — skipping")
        else:
            raise e
