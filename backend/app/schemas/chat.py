from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    document_id: str
    document_title: str
    page: int
    snippet: str
    score: float
    category: Optional[str] = None
    department: Optional[str] = None


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    category: Optional[str] = None  # filter by category e.g., fees, admissions
    department: Optional[str] = None  # filter by department
    stream: bool = False


class ChatQueryResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    sources: List[SourceReference] = []
    confidence_score: Optional[float] = None
    confidence_level: Optional[str] = "High"  # High, Medium, Low, None
    is_unknown: bool = False
    created_at: datetime


class MessageItem(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sources: List[Dict[str, Any]] = []
    confidence_score: Optional[float] = None
    is_unknown: bool = False
    created_at: datetime
    feedback: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageItem] = []

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    message_id: str
    rating: str = Field(..., pattern="^(up|down)$")
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    message_id: str
    rating: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
