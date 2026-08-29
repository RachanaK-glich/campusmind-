import logging
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
from app.db.vector_client import vector_client
from app.services.embedding_service import embedding_service
from app.schemas.chat import SourceReference

logger = logging.getLogger("campusmind.retriever")


class Retriever:
    def __init__(
        self,
        top_k: int = settings.RAG_TOP_K,
        similarity_threshold: float = settings.RAG_SIMILARITY_THRESHOLD
    ):
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold

    def retrieve(
        self,
        query: str,
        category: Optional[str] = None,
        department: Optional[str] = None,
        top_k: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], List[SourceReference], float, str, bool]:
        """
        Retrieve relevant chunks from vector store.
        Returns:
            (raw_chunks, sources, max_score, confidence_level, is_unknown)
        """
        k = top_k or self.top_k
        query_vector = embedding_service.get_embedding(query)

        results = vector_client.search(
            query_vector=query_vector,
            top_k=k,
            category=category,
            department=department
        )

        if not results:
            logger.info(f"No vector matches for query: '{query}'")
            return [], [], 0.0, "None", True

        max_score = max(r.get("score", 0.0) for r in results)
        
        # Check relevance threshold
        if max_score < self.similarity_threshold:
            logger.info(f"Top score {max_score:.3f} below threshold {self.similarity_threshold} for query: '{query}'")
            return [], [], max_score, "Low", True

        # Filter out chunks that are significantly below the top score or threshold
        valid_chunks = [
            r for r in results 
            if r.get("score", 0.0) >= max(self.similarity_threshold, max_score * 0.60)
        ]

        # Determine confidence level
        if max_score >= 0.70:
            confidence_level = "High"
        elif max_score >= 0.50:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"

        # Build SourceReference list
        sources: List[SourceReference] = []
        seen_pages = set()

        for c in valid_chunks:
            doc_id = c.get("document_id") or ""
            page_no = c.get("page_number", 1)
            key = (doc_id, page_no)
            
            # Avoid duplicate citations of the exact same page if snippet is similar
            if key in seen_pages:
                continue
            seen_pages.add(key)

            snippet = c.get("text", "")
            if len(snippet) > 280:
                snippet = snippet[:280] + "..."

            sources.append(
                SourceReference(
                    document_id=doc_id,
                    document_title=c.get("document_title") or "College Document",
                    page=page_no,
                    snippet=snippet,
                    score=round(float(c.get("score", 0.0)), 3),
                    category=c.get("category"),
                    department=c.get("department")
                )
            )

        return valid_chunks, sources, max_score, confidence_level, False


retriever = Retriever()
