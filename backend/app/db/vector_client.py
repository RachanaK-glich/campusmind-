import os
import uuid
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.core.config import settings

logger = logging.getLogger("campusmind.vector")


class VectorClient:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_dim = settings.VECTOR_DIMENSION
        self.client: Optional[QdrantClient] = None
        self._init_client()

    def _init_client(self):
        try:
            if settings.QDRANT_URL:
                logger.info(f"Connecting to remote Qdrant at {settings.QDRANT_URL}")
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY or None,
                    timeout=30.0
                )
            else:
                os.makedirs(settings.QDRANT_STORAGE_PATH, exist_ok=True)
                logger.info(f"Initializing local Qdrant at {settings.QDRANT_STORAGE_PATH}")
                self.client = QdrantClient(path=settings.QDRANT_STORAGE_PATH)
            
            self.ensure_collection(self.vector_dim)
        except Exception as e:
            logger.error(f"Error initializing Qdrant client: {e}. Falling back to in-memory mode.")
            self.client = QdrantClient(location=":memory:")
            self.ensure_collection(self.vector_dim)

    def ensure_collection(self, dimension: int = 1536):
        """Ensure the target collection exists with the specified dimension."""
        self.vector_dim = dimension
        if not self.client:
            return
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                logger.info(f"Creating Qdrant collection: {self.collection_name} with dim {dimension}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.warning(f"Collection check/creation note: {e}")

    def upsert_chunks(self, chunks_with_vectors: List[Dict[str, Any]]):
        """
        Upsert chunk points with vector and payload.
        Each item in chunks_with_vectors is:
        {
            "id": str (UUID),
            "vector": List[float],
            "document_id": str,
            "document_title": str,
            "category": str,
            "department": str,
            "page_number": int,
            "chunk_index": int,
            "text": str
        }
        """
        if not self.client or not chunks_with_vectors:
            return
        
        points = []
        for item in chunks_with_vectors:
            point_id = item.get("id") or str(uuid.uuid4())
            vector = item["vector"]
            payload = {
                "document_id": item["document_id"],
                "document_title": item.get("document_title", ""),
                "category": item.get("category", "other"),
                "department": item.get("department") or "general",
                "page_number": item.get("page_number", 1),
                "chunk_index": item.get("chunk_index", 0),
                "text": item.get("text", "")
            }
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )

        # Batch upsert
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info(f"Upserted {len(points)} chunks into Qdrant collection '{self.collection_name}'")

    def search(
        self,
        query_vector: List[float],
        top_k: int = 4,
        category: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for top_k similar chunks with optional metadata filtering.
        """
        if not self.client:
            return []

        filter_conditions = []
        if category and category != "all":
            filter_conditions.append(
                FieldCondition(key="category", match=MatchValue(value=category))
            )
        if department and department != "all":
            filter_conditions.append(
                FieldCondition(key="department", match=MatchValue(value=department))
            )

        query_filter = Filter(must=filter_conditions) if filter_conditions else None

        try:
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k,
                with_payload=True
            )
            
            results = []
            for hit in search_result:
                results.append({
                    "id": str(hit.id),
                    "score": float(hit.score),
                    "document_id": hit.payload.get("document_id"),
                    "document_title": hit.payload.get("document_title"),
                    "category": hit.payload.get("category"),
                    "department": hit.payload.get("department"),
                    "page_number": hit.payload.get("page_number", 1),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "text": hit.payload.get("text", "")
                })
            return results
        except Exception as e:
            logger.error(f"Error during Qdrant vector search: {e}")
            return []

    def delete_by_document_id(self, document_id: str):
        """Purge all chunks associated with a document."""
        if not self.client:
            return
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id)
                        )
                    ]
                )
            )
            logger.info(f"Purged vectors for document {document_id} from Qdrant")
        except Exception as e:
            logger.error(f"Error deleting vectors for document {document_id}: {e}")

    def count(self) -> int:
        """Count total vectors in collection."""
        if not self.client:
            return 0
        try:
            res = self.client.count(collection_name=self.collection_name)
            return res.count
        except Exception:
            return 0


vector_client = VectorClient()
