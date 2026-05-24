# app/schemas/user.py
# Pydantic models — used to validate request and response data

from pydantic import BaseModel, EmailStr


# Used when registering a new user
class UserRegister(BaseModel):
    username: str
    email: EmailStr        # pydantic validates email format automatically
    password: str


# Used when logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Returned after successful login
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Safe user info to return (never return password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True  # allows reading from SQLAlchemy model
