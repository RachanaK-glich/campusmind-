import os
import shutil
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import init_db, AsyncSessionLocal
from app.db.models import User, Document, Conversation, Message, Feedback, AuditLog
from app.services.ingestion_service import IngestionService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("campusmind.seed")


async def seed_database():
    logger.info("Initializing database schema...")
    await init_db()
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.QDRANT_STORAGE_PATH, exist_ok=True)

    async with AsyncSessionLocal() as db:
        # 1. Seed Users
        users_to_seed = [
            {
                "email": "superadmin@campusmind.edu",
                "name": "Super Administrator",
                "role": "super_admin",
                "password": "Password123!"
            },
            {
                "email": "admin@campusmind.edu",
                "name": "Academic Registrar",
                "role": "admin",
                "password": "Password123!"
            },
            {
                "email": "student@campusmind.edu",
                "name": "Alex Rivera",
                "role": "student",
                "password": "Password123!"
            }
        ]

        seeded_users = {}
        for u_data in users_to_seed:
            q = select(User).where(User.email == u_data["email"])
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            if not existing:
                user = User(
                    id=str(uuid.uuid4()),
                    name=u_data["name"],
                    email=u_data["email"],
                    password_hash=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    created_at=datetime.now(timezone.utc)
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                seeded_users[user.role] = user
                logger.info(f"Seeded user: {user.email} ({user.role})")
            else:
                seeded_users[existing.role] = existing
                logger.info(f"User already exists: {existing.email}")

        admin_user = seeded_users.get("admin") or seeded_users.get("super_admin")
        admin_id = admin_user.id if admin_user else None

        # 2. Seed Sample Documents
        sample_docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_docs")
        if not os.path.exists(sample_docs_dir):
            # Check relative
            sample_docs_dir = "./sample_docs"

        doc_configs = [
            {
                "filename": "Admissions_Brochure_2026.txt",
                "title": "Admissions Guide 2026-2027",
                "category": "admissions",
                "department": "Admissions Cell"
            },
            {
                "filename": "Fee_Structure_and_Scholarships_2026.txt",
                "title": "Fee Structure & Scholarships 2026",
                "category": "fees",
                "department": "Finance & Accounts"
            },
            {
                "filename": "Hostel_Rules_and_Mess_Regulations_2026.txt",
                "title": "Hostel Rules & Mess Regulations 2026",
                "category": "hostel",
                "department": "Student Welfare"
            },
            {
                "filename": "Academic_Calendar_and_Examination_Policy_2026.txt",
                "title": "Academic Calendar & Exam Policies 2026",
                "category": "exams",
                "department": "Examination Branch"
            },
            {
                "filename": "Placement_Report_and_Recruitment_Guidelines_2026.txt",
                "title": "Placement Report & Guidelines 2026",
                "category": "placements",
                "department": "Training & Placement"
            },
        ]

        for cfg in doc_configs:
            source_file = os.path.join(sample_docs_dir, cfg["filename"])
            if not os.path.exists(source_file):
                logger.warning(f"Sample doc file not found: {source_file}")
                continue

            # Check if document already exists
            q = select(Document).where(Document.title == cfg["title"])
            res = await db.execute(q)
            existing_doc = res.scalar_one_or_none()

            if not existing_doc:
                doc_id = str(uuid.uuid4())
                dest_filename = f"{doc_id}_{cfg['filename']}"
                dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)
                shutil.copyfile(source_file, dest_path)
                file_size = os.path.getsize(dest_path)

                new_doc = Document(
                    id=doc_id,
                    title=cfg["title"],
                    file_name=cfg["filename"],
                    file_url=dest_path,
                    file_size=file_size,
                    category=cfg["category"],
                    department=cfg["department"],
                    version=1,
                    status="processing",
                    uploaded_by=admin_id,
                    uploaded_at=datetime.now(timezone.utc)
                )
                db.add(new_doc)
                await db.commit()
                await db.refresh(new_doc)

                logger.info(f"Ingesting sample document: '{new_doc.title}'...")
                await IngestionService.process_document(doc_id, db)
            else:
                logger.info(f"Document already indexed: '{cfg['title']}'")

        # 3. Seed Sample Conversation for Student
        student_user = seeded_users.get("student")
        if student_user:
            q_conv = select(Conversation).where(Conversation.user_id == student_user.id)
            c_res = await db.execute(q_conv)
            if not c_res.scalar_one_or_none():
                conv_id = str(uuid.uuid4())
                conv = Conversation(
                    id=conv_id,
                    user_id=student_user.id,
                    title="Tuition Fees and Merit Scholarships",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(conv)

                msg1 = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv_id,
                    role="user",
                    content="What is the tuition fee for B.Tech Computer Science and what scholarships are available?",
                    sources=[],
                    created_at=datetime.now(timezone.utc)
                )
                db.add(msg1)

                msg2_id = str(uuid.uuid4())
                msg2 = Message(
                    id=msg2_id,
                    conversation_id=conv_id,
                    role="assistant",
                    content=(
                        "According to the **Fee Structure & Scholarships 2026** official records:\n\n"
                        "• **B.Tech Computer Science (CSE) Annual Fee**: **$12,500** per academic year "
                        "(Tuition: $9,500, Laboratory/Tech Fee: $1,800, Campus Dev & Library: $700, Exam Fee: $500).\n\n"
                        "• **Scholarship Opportunities**:\n"
                        "  1. **President's Merit Scholarship**: 100% tuition waiver for top 1% JEE rankers or 98%+ in 10+2 [Page 3].\n"
                        "  2. **Dean's Academic Excellence Scholarship**: 50% tuition waiver for 92%-97.9% in 10+2 [Page 3].\n"
                        "  3. **Need-Based Aid**: Up to 75% aid for household incomes below $25,000/yr [Page 3].\n"
                        "  4. **Women in Engineering**: 25% waiver for female students in CSE/AI programs [Page 3].\n\n"
                        "*Source Reference: Fee Structure & Scholarships 2026, Pages 1 & 3*"
                    ),
                    sources=[
                        {
                            "document_id": "sample-fee-doc",
                            "document_title": "Fee Structure & Scholarships 2026",
                            "page": 1,
                            "snippet": "Annual B.Tech CSE Fee: $12,500 (Tuition: $9,500, Lab Fee: $1,800...)",
                            "score": 0.92,
                            "category": "fees",
                            "department": "Finance & Accounts"
                        },
                        {
                            "document_id": "sample-fee-doc",
                            "document_title": "Fee Structure & Scholarships 2026",
                            "page": 3,
                            "snippet": "President's Merit Scholarship: 100% Tuition Waiver. Dean's Scholarship: 50% waiver...",
                            "score": 0.88,
                            "category": "fees",
                            "department": "Finance & Accounts"
                        }
                    ],
                    confidence_score=0.92,
                    is_unknown=0,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(msg2)

                fb = Feedback(
                    id=str(uuid.uuid4()),
                    message_id=msg2_id,
                    user_id=student_user.id,
                    rating="up",
                    comment="Extremely clear and cited exact pages!",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(fb)

                # Add an audit log
                audit = AuditLog(
                    user_id=student_user.id,
                    action="sample_query_completed",
                    metadata_json={"query": "tuition fee and scholarships"},
                    created_at=datetime.now(timezone.utc)
                )
                db.add(audit)
                await db.commit()
                logger.info("Seeded sample conversation and feedback.")

    logger.info("Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
