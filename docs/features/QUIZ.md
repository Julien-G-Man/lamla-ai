# Quiz Feature

## Frontend Pages

- `src/pages/Quiz/CreateQuiz.jsx` (`/quiz/create`)
- `src/pages/Quiz/Quiz.jsx` (`/quiz/play`)
- `src/pages/Quiz/QuizResults.jsx` (`/quiz/results`)

## Django Endpoints

From `backend/apps/quiz/urls.py`:

- `POST /api/quiz/ajax-extract-text/`
- `POST /api/quiz/generate/`
- `POST /api/quiz/submit/`
- `POST /api/quiz/download/`
- `GET /api/quiz/history/`

## FastAPI Endpoint

- `POST /quiz/` (internal, called by Django async view)

## Data Model

Primary persisted object:

- `QuizSession` with subject, scores, duration, question payload, user answers.

## Generation Flow

1. User enters text or uploads file.
2. Django extracts text (if file route used).
3. Django async view forwards normalized payload to FastAPI `/quiz/`.
4. FastAPI orchestrates provider call and returns normalized quiz JSON.
5. Frontend starts play session at `/quiz/play`.

## Submission Flow

1. Frontend submits `quiz_data` + `user_answers` to `/api/quiz/submit/`.
2. Django evaluates MCQ directly.
3. Short answers are LLM-evaluated via FastAPI chatbot route (with fallback matching).
4. Result payload returned and saved in history where applicable.

## Reliability Notes

- If FastAPI provider fails, Django returns service-unavailable style errors for generate.
- Frontend should keep user on page and allow retry.
