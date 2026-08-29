import json
import uuid
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.models import Conversation, Message, Feedback, User
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse, SourceReference
from app.rag.retriever import retriever
from app.rag.llm_client import llm_client

logger = logging.getLogger("campusmind.rag_service")


class RAGService:
    @staticmethod
    async def query(
        db: AsyncSession,
        request: ChatQueryRequest,
        user: Optional[User] = None
    ) -> ChatQueryResponse:
        """Process chat query synchronously (non-streaming)."""
        conversation = await RAGService._get_or_create_conversation(
            db, request.conversation_id, request.query, user
        )

        # 1. Fetch recent conversation history
        history = await RAGService._get_conversation_history(db, conversation.id)

        # 2. Retrieve grounded context
        chunks, sources, max_score, conf_level, is_unknown = retriever.retrieve(
            query=request.query,
            category=request.category,
            department=request.department
        )

        # 3. Save User Message
        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=request.query,
            sources=[],
            created_at=datetime.now(timezone.utc)
        )
        db.add(user_msg)
        await db.commit()

        # 4. Generate LLM Answer
        answer = await llm_client.generate_response(
            query=request.query,
            retrieved_chunks=chunks,
            conversation_history=history,
            is_unknown=is_unknown
        )

        # 5. Save Assistant Message
        assistant_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
            sources=[s.model_dump() for s in sources],
            confidence_score=max_score,
            is_unknown=1 if is_unknown else 0,
            created_at=datetime.now(timezone.utc)
        )
        db.add(assistant_msg)
        
        # Touch conversation updated_at
        conversation.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return ChatQueryResponse(
            conversation_id=conversation.id,
            message_id=assistant_msg.id,
            answer=answer,
            sources=sources,
            confidence_score=max_score,
            confidence_level=conf_level,
            is_unknown=is_unknown,
            created_at=assistant_msg.created_at
        )

    @staticmethod
    async def query_stream(
        db: AsyncSession,
        request: ChatQueryRequest,
        user: Optional[User] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process chat query with Server-Sent Events (SSE) streaming.
        Emits JSON events:
        - event: start (metadata, sources, confidence)
        - event: token (chunk delta text)
        - event: done (completed message info)
        """
        conversation = await RAGService._get_or_create_conversation(
            db, request.conversation_id, request.query, user
        )

        # 1. Fetch recent history
        history = await RAGService._get_conversation_history(db, conversation.id)

        # 2. Retrieve chunks
        chunks, sources, max_score, conf_level, is_unknown = retriever.retrieve(
            query=request.query,
            category=request.category,
            department=request.department
        )

        # 3. Save User Message
        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=request.query,
            sources=[],
            created_at=datetime.now(timezone.utc)
        )
        db.add(user_msg)
        await db.commit()

        assistant_msg_id = str(uuid.uuid4())
        sources_payload = [s.model_dump() for s in sources]

        # Emit start event
        start_payload = {
            "conversation_id": conversation.id,
            "message_id": assistant_msg_id,
            "sources": sources_payload,
            "confidence_score": max_score,
            "confidence_level": conf_level,
            "is_unknown": is_unknown
        }
        yield f"event: start\ndata: {json.dumps(start_payload)}\n\n"

        # Stream tokens
        full_answer = []
        async for token in llm_client.generate_stream(
            query=request.query,
            retrieved_chunks=chunks,
            conversation_history=history,
            is_unknown=is_unknown
        ):
            full_answer.append(token)
            yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

        complete_text = "".join(full_answer).strip()

        # 4. Save Assistant Message
        assistant_msg = Message(
            id=assistant_msg_id,
            conversation_id=conversation.id,
            role="assistant",
            content=complete_text,
            sources=sources_payload,
            confidence_score=max_score,
            is_unknown=1 if is_unknown else 0,
            created_at=datetime.now(timezone.utc)
        )
        db.add(assistant_msg)
        conversation.updated_at = datetime.now(timezone.utc)
        await db.commit()

        # Emit completion
        yield f"event: done\ndata: {json.dumps({'status': 'completed', 'message_id': assistant_msg_id})}\n\n"

    @staticmethod
    async def _get_or_create_conversation(
        db: AsyncSession,
        conversation_id: Optional[str],
        first_query: str,
        user: Optional[User]
    ) -> Conversation:
        if conversation_id:
            query = select(Conversation).where(Conversation.id == conversation_id)
            result = await db.execute(query)
            conv = result.scalar_one_or_none()
            if conv:
                return conv

        # Generate friendly title (first 6-8 words)
        words = first_query.strip().split()
        title = " ".join(words[:6]) + ("..." if len(words) > 6 else "")
        title = title.capitalize()

        # If user is anonymous/guest, use default demo student or generate id
        user_id = user.id if user else "anonymous-guest"
        
        # Verify user exists in db or fallback to first user
        u_query = select(User).where(User.id == user_id)
        u_res = await db.execute(u_query)
        if not u_res.scalar_one_or_none():
            fallback_u = (await db.execute(select(User).limit(1))).scalar_one_or_none()
            if fallback_u:
                user_id = fallback_u.id

        new_conv = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_conv)
        await db.commit()
        await db.refresh(new_conv)
        return new_conv

    @staticmethod
    async def _get_conversation_history(db: AsyncSession, conversation_id: str) -> List[Dict[str, str]]:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(10)
        )
        result = await db.execute(query)
        messages = result.scalars().all()
        return [{"role": m.role, "content": m.content} for m in messages]
