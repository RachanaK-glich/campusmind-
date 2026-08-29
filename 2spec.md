1. Project Overview
Project Name: CampusMind — AI College Information Assistant

Problem Statement: Students repeatedly ask the same questions about admissions, fees, exams, hostel rules, and placements across emails, notice boards, and offices. Staff time is spent answering repetitive queries, and information is scattered across PDFs, circulars, and web pages that students rarely read in full.

Solution: A Retrieval-Augmented Generation chatbot that ingests official college documents (admission brochures, fee structures, exam notices, hostel rules, academic calendars, placement reports, etc.), indexes them in a vector database, and answers student questions with grounded, source-cited responses — refusing to hallucinate when no relevant document exists.

Target Users:

User Type	Needs
Students / Prospective applicants	Ask questions, get cited answers, view chat history
Faculty / Department staff	Ask department-specific queries
Admin (registrar/IT staff)	Upload, version, and delete documents; monitor usage
Super Admin	Manage admins, view analytics, configure knowledge bases
Scope (v1): Single institution, English-first, text-based PDFs/DOCX/notices, web chat interface, admin document management, deployed publicly.

Out of scope (v1): Multi-institution SaaS, payment processing, voice-first UX (bonus, phase 2+).

2. Tech Stack
Layer	Choice	Reasoning
Frontend	Next.js (React) + TypeScript + Tailwind CSS	SSR for fast load, easy deployment on Vercel
Backend	FastAPI (Python)	Native async support, best ecosystem for LangChain/embeddings
RAG Orchestration	LangChain / LlamaIndex	Chunking, retrieval chains, prompt templates
LLM	OpenAI GPT-4o-mini (or Gemini 1.5 / Claude Haiku as fallback)	Cost/quality balance; swappable via abstraction layer
Embeddings	OpenAI text-embedding-3-small (or all-MiniLM-L6-v2 via Sentence-Transformers for cost-free option)	Semantic search quality
Vector Database	Qdrant (self-hosted or Qdrant Cloud) / Pinecone	Metadata filtering, hybrid search support
Relational DB	PostgreSQL	Users, documents metadata, conversations, feedback
File Storage	AWS S3 / Cloudflare R2 / Supabase Storage	Store original PDFs for reference/download
Auth	JWT (access + refresh tokens) via FastAPI + passlib/bcrypt	Stateless, scalable
Background Jobs	Celery + Redis (or FastAPI BackgroundTasks for v1)	Async document processing/embedding
OCR (bonus)	Tesseract / AWS Textract	Scanned document support
Deployment	Frontend: Vercel · Backend: Render/Railway · Vector DB: Qdrant Cloud · DB: Supabase/Neon Postgres	Managed, low-ops deployment
Monitoring	Sentry (errors) + basic logging (Loguru)	Production observability
3. Core Features
Must-Have (Mapped to Requirements)
Feature	Description
Chat Interface	Real-time Q&A UI with streaming responses
User Authentication	Signup/login for students, role-based access for admins
Document Upload	Admin uploads PDF/DOCX; validated and queued for processing
Text Extraction & Chunking	PyMuPDF/pdfplumber extraction → recursive character/token-based chunking
Embedding Generation	Chunks converted to vectors on ingestion
Vector Search	Top-k semantic similarity search per query
RAG Pipeline	Retrieve → construct prompt with context → LLM generates grounded answer
Source Display	Each answer shows document name, page number, and snippet
Unknown-Question Handling	If similarity score below threshold, respond "I don't have this information in the college records" instead of guessing
Chat History	Persistent conversations per user, used as context for follow-ups
Admin Document Management	Upload, replace, delete, tag documents by category/department
Storage Integration	Postgres + S3 + vector DB working together
Deployed App	Publicly accessible URL, frontend and backend connected
Bonus (Phase 2+)
Department-wise collections, admin analytics dashboard, confidence scores, 👍/👎 feedback, streaming responses, hybrid keyword+semantic search, re-ranking, OCR, multilingual support, voice I/O, suggested questions, conversation export, AI-generated FAQs, role-based access tiers, document versioning.

4. Authentication
Roles:

Role	Permissions
Student	Chat, view own history, give feedback
Admin	All student permissions + upload/edit/delete documents, view own uploads' analytics
Super Admin	All admin permissions + manage admin accounts, global analytics, system config
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL

    U->>F: Enter email/password
    F->>B: POST /auth/login
    B->>DB: Verify hashed password
    DB-->>B: User + role
    B-->>F: JWT access token (15min) + refresh token (7d, httpOnly cookie)
    F->>F: Store access token in memory
    F->>B: Authenticated requests (Bearer token)
    B->>B: Verify JWT, extract role
Passwords hashed with bcrypt (cost factor 12).
Access tokens short-lived (15 min); refresh tokens stored as httpOnly, secure cookies.
Optional: Google OAuth for student sign-in (bonus).
Role-based route guards enforced both on frontend (UI hiding) and backend (middleware — never trust the client).
Email verification for new accounts (optional v1.1).
Rate-limited login endpoint to prevent brute force.
Frontend Pages
Page	Route	Description
Landing Page	/	Intro, "Ask about admissions, fees, exams..." CTA to chat
Login / Signup	/login, /signup	Auth forms
Chat Interface	/chat	Main chatbot UI, message input, streaming answers, source cards
Chat History Sidebar	within /chat	List of past conversations, searchable
Document Viewer Modal	within /chat	Shows the cited PDF snippet/page on source click
Admin Dashboard	/admin	Overview: total docs, queries, feedback stats (bonus: charts)
Document Management	/admin/documents	Upload, list, tag by department/category, delete, reprocess
Document Upload Modal	within /admin/documents	Drag-drop upload, category/department selector, progress bar
User Management	/admin/users	(Super Admin) manage admin roles
Profile / Settings	/profile	Change password, view account info
404 / Error Page	*	Friendly fallback
6. Backend Architecture
flowchart TD
    A[Client - Next.js] -->|REST/JWT| B[FastAPI Gateway]
    B --> C[Auth Service]
    B --> D[Chat Service]
    B --> E[Document Service]
    E --> F[Ingestion Pipeline]
    F --> F1[Text Extraction]
    F1 --> F2[Chunking]
    F2 --> F3[Embedding Generation]
    F3 --> G[(Vector DB - Qdrant)]
    E --> H[(File Storage - S3)]
    D --> I[Retriever]
    I --> G
    I --> J[Context Builder]
    J --> K[LLM Service]
    K --> L[Response + Source Formatter]
    L --> A
    C --> M[(PostgreSQL)]
    D --> M
    E --> M
Layers:

API Layer — FastAPI routers per domain (auth, chat, documents, admin, feedback).
Service Layer — Business logic isolated from routes (auth_service, rag_service, document_service).
Ingestion Pipeline — Async worker: extract → chunk → embed → upsert to vector DB → store metadata in Postgres.
RAG Pipeline — Query embedding → vector similarity search (top-k, with metadata filters e.g. department) → relevance threshold check → prompt assembly → LLM call → post-process (attach sources).
LLM Abstraction Layer — Interface allowing swap between OpenAI/Gemini/Claude without touching business logic.
Data Access Layer — SQLAlchemy models + repository pattern for Postgres; Qdrant client wrapper for vector ops.
7. Database Collections / Schema
PostgreSQL Tables
users

Field	Type	Notes
id	UUID (PK)	
name	varchar	
email	varchar (unique)	
password_hash	varchar	
role	enum(student, admin, super_admin)	
created_at	timestamp	
documents

Field	Type	Notes
id	UUID (PK)	
title	varchar	
file_url	varchar	S3 path
category	enum(admissions, fees, exams, hostel, library, placements, scholarships, policies, events, other)	
department	varchar (nullable)	for department-wise KB
version	int	default 1
status	enum(processing, indexed, failed)	
uploaded_by	UUID (FK → users)	
uploaded_at	timestamp	
document_chunks (metadata mirror; vectors live in Qdrant)

Field	Type	Notes
id	UUID (PK)	matches vector ID in Qdrant
document_id	UUID (FK)	
chunk_text	text	for source display
page_number	int	
chunk_index	int	
conversations

Field	Type	Notes
id	UUID (PK)	
user_id	UUID (FK)	
title	varchar	auto-generated from first message
created_at	timestamp	
messages

Field	Type	Notes
id	UUID (PK)	
conversation_id	UUID (FK)	
role	enum(user, assistant)	
content	text	
sources	jsonb	array of {document_id, page, snippet, score}
created_at	timestamp	
feedback

Field	Type	Notes
id	UUID (PK)	
message_id	UUID (FK)	
rating	enum(up, down)	
comment	text (nullable)	
audit_logs (security)

Field	Type	Notes
id	UUID (PK)	
user_id	UUID (FK)	
action	varchar	e.g. "document_deleted"
metadata	jsonb	
created_at	timestamp	
Vector Database (Qdrant) Collection
json


{
  "collection": "college_docs",
  "vector_size": 1536,
  "distance": "Cosine",
  "payload": {
    "document_id": "uuid",
    "chunk_id": "uuid",
    "category": "fees",
    "department": "computer_science | null",
    "page_number": 12,
    "text": "chunk content..."
  }
}
Department-wise collections (bonus) can be separate Qdrant collections (college_docs_cse, college_docs_admin) or a single collection filtered by department payload field.

8. API Endpoints
Auth
Method	Endpoint	Description
POST	/api/auth/signup	Create student account
POST	/api/auth/login	Returns JWT tokens
POST	/api/auth/refresh	Refresh access token
POST	/api/auth/logout	Invalidate refresh token
Chat
Method	Endpoint	Description
POST	/api/chat/query	Submit question, returns streamed answer + sources
GET	/api/chat/conversations	List user's conversations
GET	/api/chat/conversations/{id}	Get full message history
DELETE	/api/chat/conversations/{id}	Delete conversation
POST	/api/chat/feedback	Submit 👍/👎 on a message
Documents (Admin)
Method	Endpoint	Description
POST	/api/documents/upload	Upload PDF/DOCX + category/department metadata
GET	/api/documents	List all documents (filter by category/status)
GET	/api/documents/{id}	Document details + processing status
PUT	/api/documents/{id}	Update metadata / replace file (new version)
DELETE	/api/documents/{id}	Delete document + purge vectors
POST	/api/documents/{id}/reprocess	Re-run ingestion pipeline
Admin
Method	Endpoint	Description
GET	/api/admin/analytics	Query volume, top questions, unanswered rate
GET	/api/admin/users	List users (super admin)
PATCH	/api/admin/users/{id}/role	Change user role
9. Folder Structure


campusmind/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── admin/documents/page.tsx
│   │   ├── admin/dashboard/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── chat/MessageBubble.tsx
│   │   ├── chat/SourceCard.tsx
│   │   ├── chat/ChatInput.tsx
│   │   ├── admin/DocumentUploader.tsx
│   │   └── shared/Navbar.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── hooks/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── documents.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── rag_service.py
│   │   │   ├── ingestion_service.py
│   │   │   └── embedding_service.py
│   │   ├── rag/
│   │   │   ├── extractor.py       # PDF/DOCX text extraction
│   │   │   ├── chunker.py
│   │   │   ├── retriever.py
│   │   │   ├── prompt_templates.py
│   │   │   └── llm_client.py
│   │   ├── db/
│   │   │   ├── models.py          # SQLAlchemy models
│   │   │   ├── session.py
│   │   │   └── vector_client.py   # Qdrant wrapper
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   └── schemas/                # Pydantic models
│   ├── workers/
│   │   └── ingestion_worker.py     # Celery task
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   └── spec.md   (this document)
├── docker-compose.yml
└── README.md
11. UI and UX Requirements
Chat interface: message bubbles distinguishing user vs. assistant; assistant responses stream token-by-token for perceived speed.
Source cards: below each answer, collapsible cards showing document title, page number, and highlighted snippet; clicking opens the source PDF at that page.
Confidence indicator (bonus): small badge (High/Medium/Low) based on retrieval similarity score.
Unknown-answer state: visually distinct message style (e.g., muted color, info icon) saying information isn't available, with a suggestion to contact the relevant department.
Empty states: chat with no history shows suggested starter questions ("What are the hostel fees?", "When do exams start?").
Loading states: typing indicator during retrieval + generation; upload progress bar for admin document ingestion (extracting → chunking → embedding → done).
Responsive design: mobile-first chat layout; admin dashboard optimized for desktop but usable on tablet.
Accessibility: semantic HTML, ARIA labels on interactive elements, sufficient color contrast, keyboard-navigable chat input.
Dark/light mode toggle.
Error handling UX: toast notifications for failed uploads, network errors, or LLM timeouts, with retry action.
12. Security Requirements
Password security: bcrypt hashing, minimum password policy, never log plaintext passwords.
Transport security: HTTPS enforced everywhere; secure, httpOnly, SameSite cookies for refresh tokens.
Authorization: server-side role checks on every admin/document endpoint — never rely solely on frontend route guards.
File upload validation: restrict to PDF/DOCX/TXT, enforce max file size (e.g., 20MB), scan filenames for path traversal, store with generated UUID filenames in S3 (not user-controlled names).
Prompt injection mitigation: treat retrieved document text as data, not instructions; system prompt explicitly restricts the LLM to answering only from provided context and ignoring embedded instructions within documents.
Rate limiting: per-IP and per-user limits on /auth/login and /chat/query to prevent abuse and cost overruns.
Input sanitization: validate/escape all user input; parameterized queries via SQLAlchemy ORM (no raw SQL string concatenation).
Secrets management: API keys (LLM, S3, Qdrant) stored in environment variables/secret managers, never committed to source control.
Audit logging: log document uploads/deletions and role changes with actor ID and timestamp.
CORS policy: restrict allowed origins to the deployed frontend domain.
Data privacy: chat history tied to user accounts, deletable by the user; no PII sent to third-party LLM beyond what's necessary for the query.
Dependency hygiene: regular updates of libraries (FastAPI, LangChain) to patch known vulnerabilities.
13. Final Expected Outcome
A publicly deployed, full-stack web application where:

A student logs in, asks a natural-language question like "What is the last date to apply for the merit scholarship?", and receives a grounded answer generated only from uploaded college documents, with the exact source PDF and page cited beneath it.
If no relevant document exists, the assistant clearly states it doesn't have that information rather than fabricating an answer.
Chat history persists across sessions and informs follow-up questions within the same conversation.
An admin can log into a separate dashboard, upload a new fee-structure PDF, watch it move through processing status (extracting → chunking → embedding → indexed), and have it become searchable within minutes.
Admins can delete or replace outdated documents, immediately removing them from retrieval.
The system is resilient to irrelevant or adversarial input, respects role-based permissions, and runs on a real deployed URL usable by anyone with a browser — demonstrating a genuine retrieval pipeline (vector DB + similarity search), not just an LLM wrapper.