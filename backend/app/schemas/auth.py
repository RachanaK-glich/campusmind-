from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "student"  # student, admin


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


TokenResponse.model_rebuild()
