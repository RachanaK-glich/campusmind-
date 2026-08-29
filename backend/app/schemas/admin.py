from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AnalyticsOverviewResponse(BaseModel):
    total_documents: int
    total_chunks: int
    total_conversations: int
    total_queries: int
    unanswered_queries: int
    unanswered_rate_percentage: float
    positive_feedback_count: int
    negative_feedback_count: int
    satisfaction_rate_percentage: float
    category_distribution: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    top_queries: List[Dict[str, Any]]


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(student|admin|super_admin)$")


class UserManagementItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime
    conversation_count: int = 0
    document_count: int = 0

    class Config:
        from_attributes = True


class AuditLogItem(BaseModel):
    id: str
    user_id: Optional[str]
    user_name: Optional[str]
    action: str
    metadata_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
