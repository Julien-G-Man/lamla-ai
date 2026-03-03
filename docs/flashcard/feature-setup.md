# Lamla AI – Flashcards System Documentation

> A full-stack flashcard feature built on React, Django, and FastAPI with AI generation and spaced repetition.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Folder Structure](#2-folder-structure)
3. [Data Model](#3-data-model)
4. [API Endpoints](#4-api-endpoints)
5. [Spaced Repetition Logic](#5-spaced-repetition-logic)
6. [React Frontend](#6-react-frontend)
7. [Limitations & Roadmap](#7-limitations--roadmap)

---

## 1. System Overview

The flashcards feature allows students to:

- Upload learning material (PDF, DOCX, PPTX, TXT)
- Extract text from the file
- Generate AI-powered flashcards from the extracted text
- Study using intelligent spaced repetition
- Rate difficulty after answering each card

### Architecture

```
React (Frontend)
      │
      │  HTTP API
      ▼
Django Backend
      │
      │  internal calls
      ▼
FastAPI LLM Service
```

| Layer       | Responsibility |
|-------------|----------------|
| **React**   | UI and learning interaction |
| **Django**  | Auth, file upload, text extraction, flashcard persistence, spaced repetition scheduling |
| **FastAPI** | LLM flashcard generation and AI processing |

---

## 2. Folder Structure

**Django**
```
apps/
└── flashcards/
    ├── views.py
    ├── urls.py
    ├── models.py
    └── services/
        ├── extract_text_helper.py
        └── spaced_repetition.py
```

**React**
```
src/
└── pages/
    └── Flashcards/
        ├── CreateFlashcards.jsx
        └── PlayFlashcards.jsx
```

---

## 3. Data Model

```python
class Flashcard(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE)
    question    = models.TextField()
    answer      = models.TextField()
    difficulty  = models.IntegerField(default=0)
    next_review = models.DateTimeField(auto_now_add=True)
    created_at  = models.DateTimeField(auto_now_add=True)
```

---

## 4. API Endpoints

### 4.1 Extract Text From File

```
POST /api/flashcards/ajax-extract-text/
```

Extracts text from an uploaded learning material file.

**Supported formats:** PDF, DOCX, PPTX, TXT  
**Max file size:** 10 MB  
**Note:** Text is truncated at ~50,000 characters to prevent oversized LLM prompts.

**Request** — `multipart/form-data`

| Field        | Type   | Description          |
|--------------|--------|----------------------|
| `slide_file` | `file` | The file to extract  |

**Response**

```json
// Success
{ "text": "Extracted text content..." }

// Error
{ "error": "No file uploaded" }
```

---

### 4.2 Generate Flashcards

```
POST /api/flashcards/generate/
```

Sends extracted text to the LLM to generate flashcard question/answer pairs.

**Request**

```json
{
  "text": "Extracted lecture text...",
  "num_cards": 10
}
```

**Response**

```json
{
  "flashcards": [
    { "question": "What is photosynthesis?", "answer": "Photosynthesis is the process..." },
    { "question": "Where does photosynthesis occur?", "answer": "In the chloroplast..." }
  ]
}
```

---

### 4.3 Save Flashcards

```
POST /api/flashcards/save/
```

Persists generated flashcards to the database.

**Request**

```json
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}
```

---

### 4.4 Get Flashcards Due for Review

```
GET /api/flashcards/due/
```

Returns all flashcards currently due for review based on the spaced repetition schedule.

**Response**

```json
{
  "flashcards": [
    { "id": 1, "question": "...", "answer": "...", "difficulty": 2 }
  ]
}
```

---

### 4.5 Submit Difficulty Rating

```
POST /api/flashcards/review/
```

Updates the spaced repetition schedule after the student rates a card.

**Request**

```json
{
  "flashcard_id": 1,
  "difficulty": 0
}
```

| Value | Difficulty |
|-------|------------|
| `0`   | Easy       |
| `1`   | Medium     |
| `2`   | Hard       |

---

## 5. Spaced Repetition Logic

After each review, the next review date is scheduled based on the difficulty rating:

| Rating | Next Review |
|--------|-------------|
| Easy   | +3 days     |
| Medium | +1 day      |
| Hard   | +6 hours    |

```python
if difficulty == 0:
    next_review = now + timedelta(days=3)
elif difficulty == 1:
    next_review = now + timedelta(days=1)
elif difficulty == 2:
    next_review = now + timedelta(hours=6)
```

---

## 6. React Frontend

### 6.1 Create Flashcards — `CreateFlashcards.jsx`

**Workflow**

```
Upload file → Extract text → Preview text → Generate flashcards → Preview cards → Save
```

**Example: Extract text**

```js
const formData = new FormData()
formData.append("slide_file", file)

await fetch("/api/flashcards/ajax-extract-text/", {
  method: "POST",
  body: formData
})
```

---

### 6.2 Play Flashcards — `PlayFlashcards.jsx`

**Workflow**

```
Load due cards → Show question → Flip card → Show answer → Rate difficulty → Next card
```

**Example: Submit difficulty rating**

```js
await fetch("/api/flashcards/review/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ flashcard_id: id, difficulty: 1 })
})
```

---

### 6.3 Components Checklist

| Component             | Description                              |
|-----------------------|------------------------------------------|
| `FlashcardUploader`   | File input and upload handler            |
| `FlashcardGenerator`  | Triggers text extraction and generation  |
| `FlashcardPreview`    | Displays generated cards before saving   |
| `FlashcardPlayer`     | Flip-card study interface                |
| `DifficultyButtons`   | Easy / Medium / Hard rating buttons      |

---

## 7. Limitations & Roadmap

### Current Limitations

- No vector search — full extracted text is sent to the LLM
- Text truncated at 50,000 characters
- Basic spaced repetition (not SM-2)

### Roadmap

**RAG Pipeline**  
Replace full-text prompting with a vector database + semantic retrieval layer to support large textbooks and precise card generation.

**SM-2 Algorithm**  
Implement the Anki-style SM-2 algorithm for more accurate, adaptive scheduling.

**Deck System**  
Add support for organizing flashcards into decks, subjects, and tags.

---

## Full Workflow Summary

```
Upload file
    ↓
Extract text          (Django)
    ↓
Generate flashcards   (FastAPI LLM)
    ↓
Save flashcards       (Django)
    ↓
Study flashcards      (React)
    ↓
Rate difficulty
    ↓
Spaced repetition scheduling
```