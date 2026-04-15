"""
text_knowledge_store.py

Simple indexed-text knowledge store for the Lamla AI chatbot.
Loads all platform knowledge from embeddings.json (content format),
indexes every chunk by keywords and word tokens, and retrieves
the best-matching chunks for a given query using word-overlap scoring.

No mathematical embeddings — just clean text matching.
"""

import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"[a-z0-9]{2,}")
_KB_FILE = Path(__file__).resolve().parent / "platform_kb" / "text_embeddings.json"

# Phrase bonuses: if any of these phrases appear in the query, boost the given chunk keyword
_PHRASE_HINTS = {
    "url": ["url", "website", "link", "address", "web address"],
    "website": ["url", "website", "link", "address"],
    "link": ["url", "website", "link"],
    "login": ["sign up", "login", "signup", "account", "authentication"],
    "signup": ["sign up", "login", "signup", "account", "authentication"],
    "password": ["password", "login", "account"],
    "quiz": ["quiz", "quiz generator", "test", "exam"],
    "flashcard": ["flashcard", "deck", "spaced repetition"],
    "dashboard": ["dashboard", "progress", "stats"],
    "contact": ["contact", "support", "email", "whatsapp"],
    "support": ["contact", "support", "email", "whatsapp"],
    "upload": ["upload", "file", "pdf", "docx"],
    "chat": ["ai tutor", "chat", "chatbot", "assistant"],
    "tutor": ["ai tutor", "chat", "chatbot", "assistant"],
    "material": ["materials", "library", "community", "shared"],
    "model": ["ai models", "model routing", "providers"],
    # Weak areas / performance
    "weak": ["weak areas", "weak topics", "struggling", "performance tracking"],
    "struggling": ["weak areas", "weak topics", "low score"],
    "performance": ["weak areas", "progress", "stats", "topic accuracy"],
    "progress": ["dashboard", "progress", "weak areas", "stats"],
    "improve": ["weak areas", "study recommendation", "practice"],
    # Spaced scheduling
    "due": ["due for review", "spaced quiz", "next review", "schedule"],
    "review": ["spaced repetition", "due for review", "flashcard", "quiz schedule"],
    "schedule": ["spaced quiz", "due for review", "spaced repetition"],
    "study today": ["due for review", "weak areas", "what to study"],
    "study plan": ["weak areas", "due for review", "recommendation"],
    "what to study": ["weak areas", "due for review", "study recommendation"],
    # Quiz history
    "history": ["quiz history", "past quizzes", "previous quizzes"],
    "past": ["quiz history", "past quizzes", "previous quizzes"],
    # AI tutor awareness
    "how am i doing": ["weak areas", "performance", "progress", "ai tutor performance"],
    "ready": ["weak areas", "performance", "exam", "study recommendation"],
}


class TextKnowledgeStore:
    """
    Loads platform knowledge from embeddings.json (content format) and
    provides fast keyword-based retrieval. No vector math — pure text indexing.
    """

    def __init__(self) -> None:
        self._chunks: Dict[str, dict] = {}          # chunk_id -> raw data dict
        self._token_index: Dict[str, List[str]] = {}  # token -> [chunk_ids]
        self._loaded = False
        self._load()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search(self, query: str, top_k: int = 5) -> List[dict]:
        """
        Return up to top_k chunks most relevant to the query.
        Each result dict has: heading, source_file, keywords, text, score.
        """
        if not self._loaded or not self._chunks:
            return []

        query_l = query.lower()
        query_tokens = self._tokenize(query_l)

        scores: Dict[str, float] = {}

        for token in query_tokens:
            for chunk_id in self._token_index.get(token, []):
                scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0

        # Bonus: exact keyword phrase match
        for chunk_id, data in self._chunks.items():
            chunk_keywords = [kw.lower() for kw in data.get("keywords", [])]
            for kw in chunk_keywords:
                if kw in query_l:
                    scores[chunk_id] = scores.get(chunk_id, 0.0) + 3.0

            # Bonus: query substring found in chunk text
            if query_l in data.get("text", "").lower():
                scores[chunk_id] = scores.get(chunk_id, 0.0) + 2.5

            # Bonus: any query token found in chunk heading
            heading_l = data.get("heading", "").lower()
            if any(tok in heading_l for tok in query_tokens):
                scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.5

        if not scores:
            return []

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        results = []
        for chunk_id, score in ranked[:top_k]:
            data = self._chunks[chunk_id]
            results.append({
                "chunk_id": chunk_id,
                "heading": data.get("heading", ""),
                "source_file": data.get("source_file", ""),
                "keywords": data.get("keywords", []),
                "text": data.get("text", ""),
                "score": round(score, 2),
            })
        return results

    def get_context(self, query: str, top_k: int = 5, max_chars: int = 4000) -> str:
        """
        Return a formatted context string of the top matching chunks.
        Safe to inject directly into a system prompt.
        """
        results = self.search(query, top_k=top_k)
        if not results:
            return ""

        parts: List[str] = []
        total = 0
        for r in results:
            block = f"[{r['source_file']} > {r['heading']}]\n{r['text'].strip()}"
            if parts and total + len(block) > max_chars:
                break
            parts.append(block)
            total += len(block)

        return "\n\n".join(parts)

    def get_all_context(self) -> str:
        """Return every chunk concatenated — use for full platform knowledge injection."""
        parts = []
        for chunk_id, data in self._chunks.items():
            parts.append(f"[{data.get('source_file', '')} > {data.get('heading', '')}]\n{data.get('text', '').strip()}")
        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Internal loading and indexing
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if not _KB_FILE.exists():
            logger.warning("text_knowledge_store: embeddings.json not found at %s", _KB_FILE)
            return

        try:
            raw = json.loads(_KB_FILE.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("text_knowledge_store: failed to load embeddings.json")
            return

        chunks: Dict[str, dict] = {}
        for chunk_id, value in raw.items():
            if chunk_id.startswith("_") or not isinstance(value, dict) or "text" not in value:
                continue
            chunks[chunk_id] = value

        if not chunks:
            logger.warning("text_knowledge_store: no content chunks found in embeddings.json")
            return

        self._chunks = chunks
        self._build_index()
        self._loaded = True
        logger.info("text_knowledge_store: loaded %d chunks from embeddings.json", len(chunks))

    def _build_index(self) -> None:
        index: Dict[str, List[str]] = {}
        for chunk_id, data in self._chunks.items():
            text = data.get("text", "")
            heading = data.get("heading", "")
            keywords = data.get("keywords", [])

            token_set = set(self._tokenize(text + " " + heading))
            for kw in keywords:
                token_set.update(self._tokenize(kw))

            for token in token_set:
                index.setdefault(token, []).append(chunk_id)

        self._token_index = index

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return _WORD_RE.findall(text.lower())


# Module-level singleton
knowledge_store = TextKnowledgeStore()
