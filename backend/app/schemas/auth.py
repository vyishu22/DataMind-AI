"""Pydantic schemas for the auth module."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRegister(BaseModel):
    fullName: str  = Field(..., min_length=2, max_length=80, alias="fullName")
    email:    EmailStr
    password: str  = Field(..., min_length=8)
    # Legacy compat
    name: Optional[str] = None

    model_config = {"populate_by_name": True}

    @field_validator("fullName")
    @classmethod
    def name_no_special(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z\s\-'\.]+$", v):
            raise ValueError("Name contains invalid characters")
        return v.strip()


class UserLogin(BaseModel):
    email:       EmailStr
    password:    str
    remember_me: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token:        str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class VerifyEmailRequest(BaseModel):
    token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          dict


class MessageResponse(BaseModel):
    message: str
