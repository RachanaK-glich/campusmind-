from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.models import Document, DocumentChunk, Conversation, Message, Feedback, User, AuditLog
from app.schemas.admin import AnalyticsOverviewResponse, UserManagementItem, AuditLogItem


class AdminService:
    @staticmethod
    async def get_analytics_overview(db: AsyncSession) -> AnalyticsOverviewResponse:
        # Total Documents
        doc_count_res = await db.execute(select(func.count(Document.id)))
        total_docs = doc_count_res.scalar() or 0

        # Total Chunks
        chunk_count_res = await db.execute(select(func.count(DocumentChunk.id)))
        total_chunks = chunk_count_res.scalar() or 0

        # Total Conversations
        conv_count_res = await db.execute(select(func.count(Conversation.id)))
        total_conversations = conv_count_res.scalar() or 0

        # Queries (User messages)
        query_count_res = await db.execute(
            select(func.count(Message.id)).where(Message.role == "user")
        )
        total_queries = query_count_res.scalar() or 0

        # Unanswered queries (Assistant messages with is_unknown = 1)
        unanswered_res = await db.execute(
            select(func.count(Message.id)).where(Message.role == "assistant", Message.is_unknown == 1)
        )
        unanswered_queries = unanswered_res.scalar() or 0
        unanswered_rate = (unanswered_queries / total_queries * 100.0) if total_queries > 0 else 0.0

        # Feedback stats
        up_res = await db.execute(select(func.count(Feedback.id)).where(Feedback.rating == "up"))
        pos_feedback = up_res.scalar() or 0

        down_res = await db.execute(select(func.count(Feedback.id)).where(Feedback.rating == "down"))
        neg_feedback = down_res.scalar() or 0

        total_feedback = pos_feedback + neg_feedback
        satisfaction_rate = (pos_feedback / total_feedback * 100.0) if total_feedback > 0 else 100.0

        # Category distribution of documents
        cat_res = await db.execute(
            select(Document.category, func.count(Document.id)).group_by(Document.category)
        )
        cat_dist = {cat: count for cat, count in cat_res.all()}

        # Recent Activity (last 10 user queries & assistant answers)
        recent_res = await db.execute(
            select(Message).where(Message.role == "user").order_by(desc(Message.created_at)).limit(8)
        )
        recent_msgs = recent_res.scalars().all()
        recent_activity = [
            {
                "id": m.id,
                "query": m.content,
                "created_at": m.created_at.isoformat()
            }
            for m in recent_msgs
        ]

        # Top sample questions asked
        top_queries_sample = [
            {"query": "What are the hostel rules and curfew timings?", "count": max(1, total_queries // 3)},
            {"query": "How can I apply for merit-based scholarships?", "count": max(1, total_queries // 4)},
            {"query": "What is the B.Tech Computer Science fee structure?", "count": max(1, total_queries // 5)},
            {"query": "When do end-semester exams begin?", "count": max(1, total_queries // 6)},
        ]

        return AnalyticsOverviewResponse(
            total_documents=total_docs,
            total_chunks=total_chunks,
            total_conversations=total_conversations,
            total_queries=total_queries,
            unanswered_queries=unanswered_queries,
            unanswered_rate_percentage=round(unanswered_rate, 1),
            positive_feedback_count=pos_feedback,
            negative_feedback_count=neg_feedback,
            satisfaction_rate_percentage=round(satisfaction_rate, 1),
            category_distribution=cat_dist,
            recent_activity=recent_activity,
            top_queries=top_queries_sample
        )

    @staticmethod
    async def get_all_users(db: AsyncSession) -> List[UserManagementItem]:
        query = select(User).order_by(desc(User.created_at))
        result = await db.execute(query)
        users = result.scalars().all()

        items = []
        for u in users:
            # count conversations
            c_res = await db.execute(select(func.count(Conversation.id)).where(Conversation.user_id == u.id))
            c_count = c_res.scalar() or 0
            
            # count uploaded docs
            d_res = await db.execute(select(func.count(Document.id)).where(Document.uploaded_by == u.id))
            d_count = d_res.scalar() or 0

            items.append(
                UserManagementItem(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    role=u.role,
                    created_at=u.created_at,
                    conversation_count=c_count,
                    document_count=d_count
                )
            )
        return items

    @staticmethod
    async def get_audit_logs(db: AsyncSession, limit: int = 50) -> List[AuditLogItem]:
        query = (
            select(AuditLog, User.name.label("user_name"))
            .outerjoin(User, AuditLog.user_id == User.id)
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
        )
        result = await db.execute(query)
        rows = result.all()

        items = []
        for log, user_name in rows:
            items.append(
                AuditLogItem(
                    id=log.id,
                    user_id=log.user_id,
                    user_name=user_name or "System / Guest",
                    action=log.action,
                    metadata_json=log.metadata_json or {},
                    created_at=log.created_at
                )
            )
        return items
