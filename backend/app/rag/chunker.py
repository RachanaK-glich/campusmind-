from typing import List, Dict, Any
from app.rag.extractor import DocumentPage
from app.core.config import settings


class TextChunk:
    def __init__(self, text: str, page_number: int, chunk_index: int):
        self.text = text
        self.page_number = page_number
        self.chunk_index = chunk_index

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index
        }


class RecursiveCharacterChunker:
    def __init__(
        self,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "; ", ", ", " "]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """Recursively split text using separators hierarchy."""
        final_chunks: List[str] = []
        if not separators:
            # Base case: split by character length
            for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
                chunk = text[i:i + self.chunk_size].strip()
                if chunk:
                    final_chunks.append(chunk)
            return final_chunks

        separator = separators[0]
        sub_separators = separators[1:]

        if separator in text:
            splits = text.split(separator)
        else:
            return self._split_text(text, sub_separators)

        accumulated = []
        accumulated_len = 0

        for s in splits:
            s_clean = s.strip()
            if not s_clean:
                continue

            if accumulated_len + len(s_clean) + len(separator) <= self.chunk_size:
                accumulated.append(s_clean)
                accumulated_len += len(s_clean) + len(separator)
            else:
                if accumulated:
                    combined = separator.join(accumulated).strip()
                    if combined:
                        final_chunks.append(combined)
                    
                    # Compute overlap from end of accumulated
                    overlap_buffer = []
                    curr_overlap_len = 0
                    for prev_part in reversed(accumulated):
                        if curr_overlap_len + len(prev_part) <= self.chunk_overlap:
                            overlap_buffer.insert(0, prev_part)
                            curr_overlap_len += len(prev_part) + len(separator)
                        else:
                            break
                    accumulated = overlap_buffer
                    accumulated_len = sum(len(p) for p in accumulated) + len(separator) * max(0, len(accumulated) - 1)

                if len(s_clean) > self.chunk_size:
                    # Recursive split on this large part
                    sub_chunks = self._split_text(s_clean, sub_separators)
                    final_chunks.extend(sub_chunks)
                else:
                    accumulated.append(s_clean)
                    accumulated_len += len(s_clean)

        if accumulated:
            combined = separator.join(accumulated).strip()
            if combined:
                final_chunks.append(combined)

        return final_chunks

    def chunk_pages(self, pages: List[DocumentPage]) -> List[TextChunk]:
        """Chunk a list of DocumentPages, preserving page numbers."""
        all_chunks: List[TextChunk] = []
        global_index = 0

        for page in pages:
            page_text = page.text.strip()
            if not page_text:
                continue

            raw_chunks = self._split_text(page_text, self.separators)
            for chunk_str in raw_chunks:
                clean_chunk = chunk_str.strip()
                if len(clean_chunk) >= 20:  # Minimum informative chunk length
                    all_chunks.append(
                        TextChunk(
                            text=clean_chunk,
                            page_number=page.page_number,
                            chunk_index=global_index
                        )
                    )
                    global_index += 1

        return all_chunks
