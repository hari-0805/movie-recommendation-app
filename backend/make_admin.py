"""
Make a user admin by email.
Usage: python make_admin.py
"""
from app.database.db import SessionLocal
from app.models.user import User

db = SessionLocal()
# Change this email to your account email
email = input("Enter your account email to grant admin: ").strip()
user = db.query(User).filter(User.email == email).first()
if not user:
    print(f"❌ No user found with email: {email}")
else:
    user.is_admin = True
    db.commit()
    print(f"✅ {user.username} is now an admin!")
db.close()
