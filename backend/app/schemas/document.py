from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str
    title: str
    file_name: str
    file_url: str
    file_size: int
    category: str
    department: Optional[str] = None
    version: int
    status: str
    error_message: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    chunk_count: Optional[int] = 0

    class Config:
        from_attributes = True


class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    department: Optional[str] = None


class DocumentListResponse(BaseModel):
    total: int
    items: List[DocumentResponse]
