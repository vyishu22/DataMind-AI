"""
Authentication routes — complete module.
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
POST /api/auth/resend-verification
GET  /api/auth/me
"""
from fastapi import APIRouter, Depends, Request, status

from app.middleware.rate_limit import auth_rate_limit
from app.core.security import get_current_user
from app.services.auth_service import (
    register_user, login_user, refresh_tokens, logout_user,
    forgot_password, reset_password, verify_email, resend_verification,
    get_current_user_service,
)
from app.schemas.auth import (
    UserRegister, UserLogin, RefreshRequest, ForgotPasswordRequest,
    ResetPasswordRequest, VerifyEmailRequest, LogoutRequest,
    TokenResponse, MessageResponse,
)

router = APIRouter()
_rl = Depends(auth_rate_limit)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, dependencies=[_rl])
async def register(body: UserRegister, request: Request):
    name = body.fullName or body.name or ""
    return await register_user(name, body.email, body.password, request)


@router.post("/login", response_model=TokenResponse, dependencies=[_rl])
async def login(body: UserLogin, request: Request):
    return await login_user(body.email, body.password, body.remember_me, request)


@router.post("/refresh", dependencies=[_rl])
async def refresh(body: RefreshRequest):
    return await refresh_tokens(body.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(body: LogoutRequest, current_user=Depends(get_current_user)):
    await logout_user(str(current_user["_id"]), body.refresh_token)
    return {"message": "Logged out successfully"}


@router.post("/forgot-password", response_model=MessageResponse, dependencies=[_rl])
async def forgot_pwd(body: ForgotPasswordRequest):
    return await forgot_password(body.email)


@router.post("/reset-password", response_model=MessageResponse, dependencies=[_rl])
async def reset_pwd(body: ResetPasswordRequest):
    return await reset_password(body.token, body.new_password)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_route(body: VerifyEmailRequest):
    return await verify_email(body.token)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verify(current_user=Depends(get_current_user)):
    return await resend_verification(str(current_user["_id"]))


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return await get_current_user_service(str(current_user["_id"]))
