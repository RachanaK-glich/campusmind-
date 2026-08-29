from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.db.models import User, AuditLog
from app.schemas.auth import UserSignupRequest, UserLoginRequest, UserResponse, TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token


class AuthService:
    @staticmethod
    async def signup(db: AsyncSession, request: UserSignupRequest) -> TokenResponse:
        # Check if email exists
        query = select(User).where(User.email == request.email.lower().strip())
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists"
            )

        # Role restriction: self-signup is always student unless specified super_admin initializes
        role = request.role if request.role in ["student", "admin"] else "student"
        
        user = User(
            name=request.name.strip(),
            email=request.email.lower().strip(),
            password_hash=get_password_hash(request.password),
            role=role
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Create tokens
        token_data = {"sub": user.id, "email": user.email, "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Audit log
        audit = AuditLog(
            user_id=user.id,
            action="user_registered",
            metadata_json={"email": user.email, "role": user.role}
        )
        db.add(audit)
        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    async def login(db: AsyncSession, request: UserLoginRequest) -> TokenResponse:
        query = select(User).where(User.email == request.email.lower().strip())
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = {"sub": user.id, "email": user.email, "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Audit log
        audit = AuditLog(
            user_id=user.id,
            action="user_logged_in",
            metadata_json={"email": user.email}
        )
        db.add(audit)
        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    async def refresh_tokens(db: AsyncSession, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user_id = payload.get("sub")
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        token_data = {"sub": user.id, "email": user.email, "role": user.role}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
