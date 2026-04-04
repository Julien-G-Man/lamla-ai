import json
import logging
import math
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TOKEN_RE = re.compile(r"[a-z0-9]{2,}")
HEADING_RE = re.compile(r"^#{1,3}\s+(.+)$")


@dataclass
class KnowledgeChunk:
    chunk_id: str
    source_file: str
    heading: str
    text: str
    keywords: set[str] = field(default_factory=set)
    tokens: List[str] = field(default_factory=list)


class PlatformKnowledgeRetriever:
    """
    File-based retriever for platform/user-facing content.

    Modes:
    - keyword: fast lexical retrieval
    - hybrid: keyword retrieval with embedding bonus when embeddings are available
    - embeddings: embedding-first (falls back to keyword when unavailable)
    """

    def __init__(self) -> None:
        self.kb_dir = Path(__file__).resolve().parent / "platform_kb"
        self.embeddings_file = self.kb_dir / "vector_embeddings.json"

        self.mode = getattr(settings, "CHATBOT_RETRIEVAL_MODE", "keyword").lower().strip()
        self.max_chunks = int(getattr(settings, "CHATBOT_RETRIEVAL_MAX_CHUNKS", 4))
        self.max_context_chars = int(getattr(settings, "CHATBOT_RETRIEVAL_MAX_CONTEXT_CHARS", 2800))
        self.reload_interval_seconds = int(getattr(settings, "CHATBOT_RETRIEVAL_RELOAD_SECONDS", 30))

        self.embedding_provider = getattr(settings, "CHATBOT_EMBEDDING_PROVIDER", "none")
        self.embedding_model = getattr(settings, "CHATBOT_EMBEDDING_MODEL", "text-embedding-3-small")

        self._chunks: List[KnowledgeChunk] = []
        self._df: Dict[str, int] = {}
        self._inverted: Dict[str, set[str]] = {}
        self._chunk_by_id: Dict[str, KnowledgeChunk] = {}
        self._embeddings_by_chunk: Dict[str, List[float]] = {}
        self._query_embedding_cache: Dict[str, List[float]] = {}

        self._last_checked_at = 0.0
        self._last_snapshot: Dict[str, float] = {}

        self._load_corpus(force=True)

    def get_full_context(self) -> str:
        """
        Return ALL platform KB content concatenated.
        Use this when you want the AI to always have complete platform knowledge
        rather than relying on query-dependent retrieval.
        """
        self._load_corpus_if_stale()
        if not self._chunks:
            return ""
        parts = []
        for chunk in self._chunks:
            parts.append(f"[{chunk.source_file} > {chunk.heading}]\n{chunk.text.strip()}")
        return "\n\n".join(parts)

    def retrieve_context(self, query: str) -> Tuple[str, List[str], str]:
        """
        Returns: (context_text, source_labels, mode_used)
        """
        self._load_corpus_if_stale()

        query = (query or "").strip()
        if not query:
            return "", [], self.mode

        keyword_scores = self._keyword_scores(query)
        embedding_scores = self._embedding_scores(query)

        mode_used = self.mode
        merged = self._merge_scores(keyword_scores, embedding_scores)

        if not merged and keyword_scores:
            merged = keyword_scores
            mode_used = "keyword-fallback"
        elif not merged:
            return "", [], mode_used

        ranked_ids = [cid for cid, _ in sorted(merged.items(), key=lambda x: x[1], reverse=True)]
        selected_ids = ranked_ids[: self.max_chunks]

        context_parts: List[str] = []
        sources: List[str] = []
        total_chars = 0

        for cid in selected_ids:
            chunk = self._chunk_by_id.get(cid)
            if not chunk:
                continue
            block = f"[{chunk.source_file} > {chunk.heading}]\n{chunk.text.strip()}"
            block_len = len(block)
            if context_parts and (total_chars + block_len) > self.max_context_chars:
                break
            context_parts.append(block)
            total_chars += block_len
            sources.append(f"{chunk.source_file}:{chunk.heading}")

        return "\n\n".join(context_parts), sources, mode_used

    def _load_corpus_if_stale(self) -> None:
        now = time.time()
        if now - self._last_checked_at < self.reload_interval_seconds:
            return
        self._last_checked_at = now
        self._load_corpus(force=False)

    def _load_corpus(self, force: bool) -> None:
        if not self.kb_dir.exists():
            logger.warning("Platform KB directory does not exist: %s", self.kb_dir)
            self._chunks = []
            self._chunk_by_id = {}
            self._df = {}
            self._inverted = {}
            return

        files = sorted(self.kb_dir.glob("*.md"))
        snapshot = {str(p): p.stat().st_mtime for p in files}

        if not force and snapshot == self._last_snapshot:
            return

        chunks: List[KnowledgeChunk] = []
        for md_file in files:
            try:
                raw = md_file.read_text(encoding="utf-8")
            except Exception:
                logger.exception("Failed reading KB file: %s", md_file)
                continue
            chunks.extend(self._parse_markdown(md_file.name, raw))

        self._chunks = chunks
        self._chunk_by_id = {c.chunk_id: c for c in chunks}
        self._build_indexes(chunks)
        self._load_embeddings()

        self._last_snapshot = snapshot
        self._query_embedding_cache.clear()

        logger.info("Platform KB loaded: %s chunks from %s files", len(chunks), len(files))

    def _parse_markdown(self, file_name: str, raw: str) -> List[KnowledgeChunk]:
        lines = raw.splitlines()
        sections: List[Tuple[str, List[str]]] = []

        current_heading = "Overview"
        current_lines: List[str] = []

        for line in lines:
            heading_match = HEADING_RE.match(line.strip())
            if heading_match:
                if current_lines:
                    sections.append((current_heading, current_lines))
                current_heading = heading_match.group(1).strip()
                current_lines = []
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_heading, current_lines))

        parsed: List[KnowledgeChunk] = []
        section_index = 0
        for heading, section_lines in sections:
            text = "\n".join(section_lines).strip()
            if not text:
                continue

            section_index += 1
            chunk_id = f"{file_name}::s{section_index}"

            keywords = self._extract_keywords(text)
            tokens = self._tokenize(text + " " + heading)

            parsed.append(
                KnowledgeChunk(
                    chunk_id=chunk_id,
                    source_file=file_name,
                    heading=heading,
                    text=text,
                    keywords=keywords,
                    tokens=tokens,
                )
            )

        return parsed

    def _extract_keywords(self, text: str) -> set[str]:
        lines = [ln.strip() for ln in text.splitlines()]
        kw_prefix = "keywords:"
        for line in lines[:5]:
            if line.lower().startswith(kw_prefix):
                csv_values = line[len(kw_prefix):].strip()
                values = [v.strip().lower() for v in csv_values.split(",") if v.strip()]
                return set(values)
        return set()

    def _tokenize(self, text: str) -> List[str]:
        return TOKEN_RE.findall((text or "").lower())

    def _build_indexes(self, chunks: List[KnowledgeChunk]) -> None:
        df: Dict[str, int] = {}
        inverted: Dict[str, set[str]] = {}

        for chunk in chunks:
            unique = set(chunk.tokens) | chunk.keywords
            for token in unique:
                df[token] = df.get(token, 0) + 1
                inverted.setdefault(token, set()).add(chunk.chunk_id)

        self._df = df
        self._inverted = inverted

    def _keyword_scores(self, query: str) -> Dict[str, float]:
        qtokens = self._tokenize(query)
        if not qtokens:
            return {}

        query_l = query.lower()
        scores: Dict[str, float] = {}
        n_docs = max(len(self._chunks), 1)

        candidate_ids: set[str] = set()
        for tok in qtokens:
            candidate_ids.update(self._inverted.get(tok, set()))

        if not candidate_ids:
            candidate_ids = set(self._chunk_by_id.keys())

        for cid in candidate_ids:
            chunk = self._chunk_by_id[cid]
            token_set = set(chunk.tokens) | chunk.keywords
            s = 0.0

            for tok in qtokens:
                if tok in token_set:
                    df = self._df.get(tok, 1)
                    idf = math.log(1 + (n_docs / df))
                    s += 1.0 * idf

            if query_l in chunk.text.lower():
                s += 2.5

            heading_l = chunk.heading.lower()
            if any(tok in heading_l for tok in qtokens):
                s += 1.0

            if s > 0:
                scores[cid] = s

        return scores

    def _merge_scores(self, keyword_scores: Dict[str, float], embedding_scores: Dict[str, float]) -> Dict[str, float]:
        if self.mode == "keyword":
            return keyword_scores

        if self.mode == "embeddings":
            return embedding_scores or keyword_scores

        merged: Dict[str, float] = {}
        ids = set(keyword_scores.keys()) | set(embedding_scores.keys())
        for cid in ids:
            ks = keyword_scores.get(cid, 0.0)
            es = embedding_scores.get(cid, 0.0)
            merged[cid] = (0.65 * ks) + (0.35 * es)
        return merged

    def _load_embeddings(self) -> None:
        self._embeddings_by_chunk = {}
        if not self.embeddings_file.exists():
            return

        try:
            payload = json.loads(self.embeddings_file.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("Failed loading embeddings file: %s", self.embeddings_file)
            return

        for chunk_id, vec in payload.items():
            if chunk_id in self._chunk_by_id and isinstance(vec, list) and vec:
                self._embeddings_by_chunk[chunk_id] = [float(x) for x in vec]

    def _embedding_scores(self, query: str) -> Dict[str, float]:
        if self.mode not in {"hybrid", "embeddings"}:
            return {}
        if not self._embeddings_by_chunk:
            return {}

        query_vec = self._get_query_embedding(query)
        if not query_vec:
            return {}

        scores: Dict[str, float] = {}
        for cid, doc_vec in self._embeddings_by_chunk.items():
            sim = self._cosine_similarity(query_vec, doc_vec)
            if sim > 0:
                scores[cid] = sim
        return scores

    def _get_query_embedding(self, query: str) -> Optional[List[float]]:
        cached = self._query_embedding_cache.get(query)
        if cached:
            return cached

        vec = self._fetch_embedding(query)
        if vec:
            self._query_embedding_cache[query] = vec
        return vec

    def _fetch_embedding(self, text: str) -> Optional[List[float]]:
        provider = (self.embedding_provider or "none").lower().strip()
        if provider in {"", "none"}:
            return None

        if provider == "openai":
            api_key = getattr(settings, "OPENAI_API_KEY", None)
            if not api_key:
                return None
            try:
                resp = requests.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"model": self.embedding_model, "input": text},
                    timeout=8,
                )
                if resp.status_code != 200:
                    return None
                data = resp.json()
                return data.get("data", [{}])[0].get("embedding")
            except Exception:
                logger.exception("OpenAI embedding fetch failed")
                return None

        if provider == "azure_openai":
            api_key = getattr(settings, "AZURE_OPENAI_API_KEY", None)
            endpoint = getattr(settings, "AZURE_OPENAI_ENDPOINT", None)
            deployment = getattr(settings, "CHATBOT_AZURE_EMBEDDING_DEPLOYMENT", None)
            api_version = getattr(settings, "AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
            if not (api_key and endpoint and deployment):
                return None

            url = (
                endpoint.rstrip("/")
                + f"/openai/deployments/{deployment}/embeddings?api-version={api_version}"
            )
            try:
                resp = requests.post(
                    url,
                    headers={"api-key": api_key, "Content-Type": "application/json"},
                    json={"input": text},
                    timeout=8,
                )
                if resp.status_code != 200:
                    return None
                data = resp.json()
                return data.get("data", [{}])[0].get("embedding")
            except Exception:
                logger.exception("Azure OpenAI embedding fetch failed")
                return None

        return None

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0

        dot = 0.0
        na = 0.0
        nb = 0.0
        for x, y in zip(a, b):
            dot += x * y
            na += x * x
            nb += y * y

        if na == 0.0 or nb == 0.0:
            return 0.0
        return dot / (math.sqrt(na) * math.sqrt(nb))

    def build_embeddings_file(self) -> Tuple[int, int]:
        """
        Generate embeddings for all chunks and persist to platform_kb/embeddings.json.
        Returns (generated_count, total_chunks).
        """
        provider = (self.embedding_provider or "none").lower().strip()
        if provider in {"", "none"}:
            raise ValueError("CHATBOT_EMBEDDING_PROVIDER is not configured")

        self._load_corpus(force=True)
        generated: Dict[str, List[float]] = {}

        for chunk in self._chunks:
            text = f"{chunk.heading}\n\n{chunk.text}".strip()
            vec = self._fetch_embedding(text)
            if vec:
                generated[chunk.chunk_id] = vec

        self.embeddings_file.write_text(json.dumps(generated), encoding="utf-8")
        self._load_embeddings()

        return len(generated), len(self._chunks)


platform_retriever = PlatformKnowledgeRetriever()
