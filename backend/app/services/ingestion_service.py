import os
import uuid
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.models import Document, DocumentChunk, AuditLog
from app.rag.extractor import DocumentExtractor
from app.rag.chunker import RecursiveCharacterChunker
from app.services.embedding_service import embedding_service
from app.db.vector_client import vector_client

logger = logging.getLogger("campusmind.ingestion")


class IngestionService:
    @staticmethod
    async def process_document(document_id: str, db: AsyncSession) -> bool:
        """
        Run end-to-end ingestion pipeline:
        1. Extract text from file
        2. Chunk text preserving page numbers
        3. Generate embeddings
        4. Upsert vectors to Qdrant
        5. Persist chunks in database
        6. Update document status to 'indexed'
        """
        # Fetch document
        query = select(Document).where(Document.id == document_id)
        result = await db.execute(query)
        doc = result.scalar_one_or_none()

        if not doc:
            logger.error(f"Document {document_id} not found for ingestion")
            return False

        try:
            doc.status = "processing"
            doc.error_message = None
            await db.commit()

            file_path = doc.file_url
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Source file not found on disk at: {file_path}")

            # 1. Extraction
            logger.info(f"Extracting text from: {file_path}")
            pages = DocumentExtractor.extract_from_file(file_path)
            if not pages:
                raise ValueError("No text content could be extracted from document.")

            # 2. Chunking
            logger.info(f"Chunking {len(pages)} pages for document: {doc.title}")
            chunker = RecursiveCharacterChunker()
            raw_chunks = chunker.chunk_pages(pages)
            if not raw_chunks:
                raise ValueError("Chunking produced 0 chunks. Document may be empty.")

            # 3. Clean old chunks in DB & Vector DB if reprocessing
            await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
            vector_client.delete_by_document_id(doc.id)

            # 4. Generate Embeddings & Prepare Vector Points
            logger.info(f"Generating embeddings for {len(raw_chunks)} chunks...")
            chunk_texts = [c.text for c in raw_chunks]
            embeddings = embedding_service.get_embeddings(chunk_texts)

            vector_points = []
            db_chunks = []

            for i, (chunk, vector) in enumerate(zip(raw_chunks, embeddings)):
                chunk_id = str(uuid.uuid4())
                
                # DB model
                db_chunk = DocumentChunk(
                    id=chunk_id,
                    document_id=doc.id,
                    chunk_text=chunk.text,
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index
                )
                db_chunks.append(db_chunk)

                # Vector payload
                vector_points.append({
                    "id": chunk_id,
                    "vector": vector,
                    "document_id": doc.id,
                    "document_title": doc.title,
                    "category": doc.category,
                    "department": doc.department,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text
                })

            # 5. Upsert to Qdrant
            vector_client.upsert_chunks(vector_points)

            # 6. Save chunks to Postgres / SQLite
            db.add_all(db_chunks)
            
            # 7. Update status to indexed
            doc.status = "indexed"
            await db.commit()

            logger.info(f"Successfully indexed document '{doc.title}' ({len(db_chunks)} chunks).")
            return True

        except Exception as e:
            logger.error(f"Ingestion failed for document {document_id}: {str(e)}", exc_info=True)
            doc.status = "failed"
            doc.error_message = str(e)
            await db.commit()
            return False

    @staticmethod
    async def delete_document(document_id: str, db: AsyncSession, user_id: Optional[str] = None) -> bool:
        """Delete document from DB, remove chunks, purge vectors, and remove file."""
        query = select(Document).where(Document.id == document_id)
        result = await db.execute(query)
        doc = result.scalar_one_or_none()

        if not doc:
            return False

        # 1. Purge vectors from Qdrant
        vector_client.delete_by_document_id(doc.id)

        # 2. Remove physical file if present
        if doc.file_url and os.path.exists(doc.file_url):
            try:
                os.remove(doc.file_url)
            except Exception as e:
                logger.warning(f"Failed to remove file from disk: {e}")

        # 3. Log audit
        audit = AuditLog(
            user_id=user_id,
            action="document_deleted",
            metadata_json={"document_id": doc.id, "title": doc.title, "category": doc.category}
        )
        db.add(audit)

        # 4. Delete document (cascades chunks)
        await db.delete(doc)
        await db.commit()
        return True
