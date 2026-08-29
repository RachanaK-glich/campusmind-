import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.config import settings
from app.db.session import get_db
from app.db.models import Document, DocumentChunk, User, AuditLog
from app.schemas.document import DocumentResponse, DocumentUpdateRequest, DocumentListResponse
from app.services.ingestion_service import IngestionService
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/documents", tags=["Document Management"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category: str = Form("other"),
    department: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Upload official college document (PDF, DOCX, TXT) and trigger RAG ingestion.
    """
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".pdf", ".docx", ".doc", ".txt", ".md"]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(allowed_extensions)}"
        )

    # 2. Generate secure unique filename
    doc_id = str(uuid.uuid4())
    clean_orig_name = os.path.basename(file.filename).replace(" ", "_")
    saved_filename = f"{doc_id}_{clean_orig_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    # 3. Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_size = 0
    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while content := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(content)
                if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                    )
                await out_file.write(content)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 4. Create Document record
    doc_title = (title.strip() if title and title.strip() else os.path.splitext(file.filename)[0].replace("_", " ").title())
    user_id = current_user.id if current_user else None

    new_doc = Document(
        id=doc_id,
        title=doc_title,
        file_name=file.filename,
        file_url=file_path,
        file_size=file_size,
        category=category.lower(),
        department=department.strip() if department else None,
        version=1,
        status="processing",
        uploaded_by=user_id
    )
    db.add(new_doc)
    
    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="document_uploaded",
        metadata_json={"title": doc_title, "file_name": file.filename, "category": category}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_doc)

    # 5. Ingest in background or synchronously for instant availability
    # Run ingestion directly so student can query immediately
    await IngestionService.process_document(doc_id, db)
    await db.refresh(new_doc)

    # Count chunks
    c_res = await db.execute(select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc_id))
    chunk_count = c_res.scalar() or 0

    return DocumentResponse(
        id=new_doc.id,
        title=new_doc.title,
        file_name=new_doc.file_name,
        file_url=new_doc.file_url,
        file_size=new_doc.file_size,
        category=new_doc.category,
        department=new_doc.department,
        version=new_doc.version,
        status=new_doc.status,
        error_message=new_doc.error_message,
        uploaded_by=new_doc.uploaded_by,
        uploaded_at=new_doc.uploaded_at,
        chunk_count=chunk_count
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all ingested college documents with metadata and chunk counts."""
    query = select(Document).order_by(desc(Document.uploaded_at))
    
    if category and category != "all":
        query = query.where(Document.category == category)
    if status_filter and status_filter != "all":
        query = query.where(Document.status == status_filter)
    if department and department != "all":
        query = query.where(Document.department == department)
    if search:
        query = query.where(Document.title.ilike(f"%{search}%"))

    result = await db.execute(query)
    docs = result.scalars().all()

    items = []
    for d in docs:
        c_res = await db.execute(select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == d.id))
        chunk_count = c_res.scalar() or 0
        items.append(
            DocumentResponse(
                id=d.id,
                title=d.title,
                file_name=d.file_name,
                file_url=d.file_url,
                file_size=d.file_size,
                category=d.category,
                department=d.department,
                version=d.version,
                status=d.status,
                error_message=d.error_message,
                uploaded_by=d.uploaded_by,
                uploaded_at=d.uploaded_at,
                chunk_count=chunk_count
            )
        )

    return DocumentListResponse(total=len(items), items=items)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Get single document details and processing status."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    c_res = await db.execute(select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc.id))
    chunk_count = c_res.scalar() or 0

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        file_url=doc.file_url,
        file_size=doc.file_size,
        category=doc.category,
        department=doc.department,
        version=doc.version,
        status=doc.status,
        error_message=doc.error_message,
        uploaded_by=doc.uploaded_by,
        uploaded_at=doc.uploaded_at,
        chunk_count=chunk_count
    )


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    request: DocumentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update document metadata (title, category, department)."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if request.title is not None:
        doc.title = request.title.strip()
    if request.category is not None:
        doc.category = request.category.strip().lower()
    if request.department is not None:
        doc.department = request.department.strip() if request.department else None

    # Version increment
    doc.version += 1
    await db.commit()

    # Re-run ingestion to update vector payload tags
    await IngestionService.process_document(doc.id, db)
    await db.refresh(doc)

    c_res = await db.execute(select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc.id))
    chunk_count = c_res.scalar() or 0

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        file_url=doc.file_url,
        file_size=doc.file_size,
        category=doc.category,
        department=doc.department,
        version=doc.version,
        status=doc.status,
        error_message=doc.error_message,
        uploaded_by=doc.uploaded_by,
        uploaded_at=doc.uploaded_at,
        chunk_count=chunk_count
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete document, its chunks, purge vectors from Qdrant, and delete file."""
    success = await IngestionService.delete_document(document_id, db, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return {"message": "Document successfully deleted and vectors purged", "id": document_id}


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Re-run extraction, chunking, and embedding pipeline for a document."""
    success = await IngestionService.process_document(document_id, db)
    if not success:
        raise HTTPException(status_code=500, detail="Document reprocessing failed")

    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    c_res = await db.execute(select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc.id))
    chunk_count = c_res.scalar() or 0

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        file_url=doc.file_url,
        file_size=doc.file_size,
        category=doc.category,
        department=doc.department,
        version=doc.version,
        status=doc.status,
        error_message=doc.error_message,
        uploaded_by=doc.uploaded_by,
        uploaded_at=doc.uploaded_at,
        chunk_count=chunk_count
    )


@router.get("/{document_id}/download")
async def download_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Download/preview original document file."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc or not os.path.exists(doc.file_url):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")

    return FileResponse(
        path=doc.file_url,
        filename=doc.file_name,
        media_type="application/octet-stream"
    )
