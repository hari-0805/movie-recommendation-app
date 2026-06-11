from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class ProfileResponse(BaseModel):
    id:       int
    username: str
    email:    str

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email:    Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password:     str = Field(..., min_length=6, description="Min 6 characters")
    confirm_password: str = Field(..., min_length=1)
