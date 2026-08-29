import asyncio
import logging
import re
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.rag.prompt_templates import SYSTEM_RAG_PROMPT, UNKNOWN_ANSWER_FALLBACK, build_rag_user_prompt

logger = logging.getLogger("campusmind.llm")


class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.openai_api_key = settings.OPENAI_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None,
        is_unknown: bool = False
    ) -> str:
        """Generate complete LLM response text."""
        if is_unknown or not retrieved_chunks:
            return UNKNOWN_ANSWER_FALLBACK

        prompt = build_rag_user_prompt(query, retrieved_chunks, conversation_history)

        # Try OpenAI if configured
        if self.openai_api_key and (self.provider == "openai" or not self.gemini_api_key):
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.openai_api_key.strip())
                response = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_RAG_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=800
                )
                answer = response.choices[0].message.content or ""
                return answer.strip()
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Trying Gemini or local fallback.")

        # Try Gemini if configured
        if self.gemini_api_key:
            try:
                answer = await self._call_gemini_api(prompt)
                if answer:
                    return answer.strip()
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to local grounded generator.")

        # High-quality local grounded extractor/generator
        return self._generate_local_grounded_answer(query, retrieved_chunks)

    async def generate_stream(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None,
        is_unknown: bool = False
    ) -> AsyncGenerator[str, None]:
        """Generate response with token streaming."""
        if is_unknown or not retrieved_chunks:
            words = UNKNOWN_ANSWER_FALLBACK.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.02)
            return

        prompt = build_rag_user_prompt(query, retrieved_chunks, conversation_history)

        # Stream from OpenAI if available
        if self.openai_api_key and (self.provider == "openai" or not self.gemini_api_key):
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.openai_api_key.strip())
                stream = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_RAG_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=800,
                    stream=True
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
                return
            except Exception as e:
                logger.warning(f"OpenAI stream failed: {e}. Falling back to local generator stream.")

        # Fallback local generator stream
        full_text = await self.generate_response(query, retrieved_chunks, conversation_history, is_unknown)
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.02)

    async def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """Call Gemini REST API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{SYSTEM_RAG_PROMPT}\n\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                logger.error(f"Gemini API returned {resp.status_code}: {resp.text}")
                return None

    def _generate_local_grounded_answer(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> str:
        """
        Extracts key sentences and policies from retrieved chunks to construct
        a well-structured, formatted response with source citations.
        Used when no external LLM API key is present.
        """
        if not retrieved_chunks:
            return UNKNOWN_ANSWER_FALLBACK

        query_words = set(w.lower().strip("?,.!") for w in query.split() if len(w) > 3)
        relevant_points = []
        citations_used = []

        for chunk in retrieved_chunks[:3]:
            title = chunk.get("document_title", "Official Record")
            page = chunk.get("page_number", 1)
            text = chunk.get("text", "")
            
            # Split into sentences or lines
            sentences = [s.strip() for s in re.split(r"\n|(?<=[.!?])\s+", text) if len(s.strip()) > 20]
            
            matched_sentences = []
            for s in sentences:
                s_lower = s.lower()
                matches = sum(1 for qw in query_words if qw in s_lower)
                if matches > 0 or len(sentences) <= 3:
                    matched_sentences.append(s)

            if not matched_sentences and sentences:
                matched_sentences = sentences[:2]

            for s in matched_sentences[:3]:
                if s not in relevant_points:
                    relevant_points.append(s)

            citation_tag = f"[{title}, Page {page}]"
            if citation_tag not in citations_used:
                citations_used.append(citation_tag)

        if not relevant_points:
            # Fallback to chunk texts directly
            for chunk in retrieved_chunks[:2]:
                text = chunk.get("text", "").strip()
                relevant_points.append(text[:250] + "...")

        # Construct structured response
        response_lines = [
            f"Based on the official college records ({', '.join(citations_used)}):\n"
        ]
        for pt in relevant_points[:5]:
            response_lines.append(f"• {pt}")

        response_lines.append(
            f"\n*Source Reference:* {', '.join(citations_used)}"
        )
        return "\n".join(response_lines)


llm_client = LLMClient()
