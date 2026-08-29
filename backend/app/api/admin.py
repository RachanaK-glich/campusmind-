from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, AuditLog
from app.schemas.admin import (
    AnalyticsOverviewResponse,
    UserManagementItem,
    UserRoleUpdateRequest,
    AuditLogItem
)
from app.services.admin_service import AdminService
from app.core.dependencies import require_admin, require_super_admin

router = APIRouter(prefix="/api/admin", tags=["Admin & Analytics"])


@router.get("/analytics", response_model=AnalyticsOverviewResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve system-wide analytics, RAG query metrics, and satisfaction rates."""
    return await AdminService.get_analytics_overview(db)


@router.get("/users", response_model=List[UserManagementItem])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List registered users with activity metrics."""
    return await AdminService.get_all_users(db)


@router.patch("/users/{user_id}/role", response_model=UserManagementItem)
async def update_user_role(
    user_id: str,
    request: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Change a user's role (Requires Super Admin privileges)."""
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = request.role
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="user_role_changed",
        metadata_json={"target_user_id": user.id, "old_role": old_role, "new_role": request.role}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)

    return UserManagementItem(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        conversation_count=0,
        document_count=0
    )


@router.get("/audit-logs", response_model=List[AuditLogItem])
async def get_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve administrative audit logs."""
    return await AdminService.get_audit_logs(db, limit=limit)
