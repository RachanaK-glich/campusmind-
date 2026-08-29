import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, Conversation, Message, Feedback
from app.schemas.chat import (
    ChatQueryRequest,
    ChatQueryResponse,
    ConversationSummary,
    ConversationDetail,
    MessageItem,
    FeedbackRequest,
    FeedbackResponse
)
from app.services.rag_service import RAGService
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat & RAG"])


@router.post("/query")
async def chat_query(
    request: ChatQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Submit student question.
    Returns either full JSON response or SSE token stream based on request.stream flag.
    """
    if request.stream:
        return StreamingResponse(
            RAGService.query_stream(db, request, current_user),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    else:
        return await RAGService.query(db, request, current_user)


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List recent conversations for user (or all recent for guest)."""
    user_id = current_user.id if current_user else None
    
    if user_id:
        query = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
        )
    else:
        query = select(Conversation).order_by(desc(Conversation.updated_at)).limit(20)

    result = await db.execute(query)
    conversations = result.scalars().all()
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get conversation details with all message history and citations."""
    query = (
        select(Conversation)
        .options(selectinload(Conversation.messages).selectinload(Message.feedback))
        .where(Conversation.id == conversation_id)
    )
    result = await db.execute(query)
    conv = result.scalar_one_or_none()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Format messages
    messages_out = []
    for msg in conv.messages:
        feedback_data = None
        if msg.feedback:
            feedback_data = {
                "id": msg.feedback.id,
                "rating": msg.feedback.rating,
                "comment": msg.feedback.comment
            }
        messages_out.append(
            MessageItem(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                sources=msg.sources or [],
                confidence_score=msg.confidence_score,
                is_unknown=bool(msg.is_unknown),
                created_at=msg.created_at,
                feedback=feedback_data
            )
        )

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_out
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a conversation and its messages."""
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(query)
    conv = result.scalar_one_or_none()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    await db.delete(conv)
    await db.commit()
    return {"message": "Conversation successfully deleted", "id": conversation_id}


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Submit thumbs up/down rating and optional comment for an assistant answer."""
    # Verify message exists
    m_res = await db.execute(select(Message).where(Message.id == request.message_id))
    msg = m_res.scalar_one_or_none()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Check existing feedback
    f_res = await db.execute(select(Feedback).where(Feedback.message_id == request.message_id))
    existing_fb = f_res.scalar_one_or_none()

    user_id = current_user.id if current_user else "anonymous-guest"
    
    # Ensure user_id exists in users table
    u_chk = await db.execute(select(User).where(User.id == user_id))
    if not u_chk.scalar_one_or_none():
        first_u = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if first_u:
            user_id = first_u.id

    if existing_fb:
        existing_fb.rating = request.rating
        existing_fb.comment = request.comment
        existing_fb.created_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing_fb)
        return existing_fb

    feedback = Feedback(
        id=str(uuid.uuid4()),
        message_id=request.message_id,
        user_id=user_id,
        rating=request.rating,
        comment=request.comment,
        created_at=datetime.now(timezone.utc)
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback
