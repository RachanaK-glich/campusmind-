from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    TokenResponse,
    TokenRefreshRequest,
    UserResponse
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(request: UserSignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new student or staff user account."""
    return await AuthService.signup(db, request)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user with email and password, returning JWT access & refresh tokens."""
    token_resp = await AuthService.login(db, request)
    # Set httpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=token_resp.refresh_token,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax",
        secure=False  # Set to True in production HTTPS
    )
    return token_resp


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    body: TokenRefreshRequest = None,
    db: AsyncSession = Depends(get_db)
):
    """Refresh expired access token using refresh token from body or cookie."""
    token_str = (body.refresh_token if body and body.refresh_token else None) or request.cookies.get("refresh_token")
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required in request body or cookie"
        )
    return await AuthService.refresh_tokens(db, token_str)


@router.post("/logout")
async def logout(response: Response):
    """Clear session refresh token cookie."""
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the authenticated user's profile and assigned role."""
    return current_user
