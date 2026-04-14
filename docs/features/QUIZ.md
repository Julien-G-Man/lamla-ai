# Quiz Feature

## Frontend Pages

| File | Route | Access |
|---|---|---|
| `src/pages/Quiz/QuizHistory.jsx` | `/quiz` | Authenticated only |
| `src/pages/Quiz/CreateQuiz.jsx` | `/quiz/create` | Public (guest one-quiz limit) |
| `src/pages/Quiz/Quiz.jsx` | `/quiz/play` | Public |
| `src/pages/Quiz/QuizResults.jsx` | `/quiz/results` | Public |

### `/quiz` — Quiz History Page

The dedicated quiz history page. Replaces the former inline "Past Quizzes" tab that lived inside `/dashboard`.

- Requires authentication — unauthenticated visitors are redirected to `/auth/login`.
- Uses the shared `Sidebar` component (`activeId="history"`) with the same navigation items as Dashboard and Profile.
- Header row: "Past Quizzes" heading left-aligned, "Take a New Quiz" button right-aligned at the same level.
- Sidebar nav behaviour: clicking "Past Quizzes" stays on page; other items navigate to `/dashboard?tab=<id>` or `/profile`.

### Guest Access & One-Quiz Limit

Unauthenticated users may create and take exactly one quiz.

- The Navbar "Quiz" link routes guests to `/quiz/create` and authenticated users to `/quiz`.
- When a guest successfully generates a quiz (navigates to `/quiz/play`), the flag `lamla_guest_quiz_used = "true"` is stored in `localStorage`.
- On subsequent visits to `/quiz/create`, the component detects the flag and shows a **blocking modal** (not a silent redirect):
  - Heading: "You've used your free quiz"
  - Body: invitation to sign up for unlimited access
  - Primary CTA: "Sign Up — it's free" → `/auth/signup` (with `state.fromGuest = true`)
  - Secondary link: "Already have an account? Sign in" → `/auth/login`
- The Signup page reads `location.state?.fromGuest` and surfaces a contextual banner above the form.
- On any successful auth (login, signup, Google OAuth), `lamla_guest_quiz_used` is removed from `localStorage` so the user is no longer treated as a repeat guest.

## Django Endpoints

From `backend/apps/quiz/urls.py`:

- `POST /api/quiz/ajax-extract-text/` — extract text from uploaded file
- `POST /api/quiz/extract-youtube/` — extract transcript from YouTube URL
- `POST /api/quiz/generate/` — generate quiz via FastAPI
- `POST /api/quiz/submit/` — evaluate and store quiz results
- `POST /api/quiz/download/` — download quiz as PDF/DOCX
- `GET /api/quiz/history/` — authenticated user's past sessions

## FastAPI Endpoint

- `POST /quiz/` (internal, called by Django async view)

## Data Model

Primary persisted object:

- `QuizSession` with subject, scores, duration, question payload, user answers.

## Input Sources

The quiz creator (`/quiz/create`) supports three input tabs:

| Tab | How it works |
|---|---|
| **File** | Upload PDF, DOCX, PPTX, or TXT. Django extracts text via `ajax-extract-text`, populates the text field. |
| **YouTube** | Paste any YouTube URL. Django calls `extract-youtube/`, which fetches the video transcript via `youtube-transcript-api` and the title via YouTube oEmbed. Requires captions to be enabled on the video. |
| **Text** | Paste or type study material directly. |

All three paths converge at the same `generate/` endpoint once `extractedText` is populated.

## Generation Flow

1. User picks an input tab and loads content (file, YouTube URL, or direct text).
2. Django's async view forwards a normalized payload to FastAPI `POST /quiz/`:
   - `subject`, `study_text`, `num_mcq`, `num_short`, `difficulty`
   - `source_type` — `"file"` | `"youtube"` | `"text"`
   - `source_title` — filename or video title (used in prompt context)
3. FastAPI normalizes text (Unicode cleanup, truncation to 16,000 chars), scales `max_tokens` dynamically based on question count (2,048–8,192), and calls the AI provider.
4. The prompt tells the LLM the source type so it can adjust tone (e.g., spoken-language transcript vs. academic document).
5. FastAPI validates the JSON response, normalizes questions, and returns `QuizResponse`.
6. Django adds metadata (`id`, `time_limit`, `source_filename`) and returns to the frontend.
7. Frontend navigates to `/quiz/play`.

## Submission Flow

1. Frontend submits `quiz_data` + `user_answers` to `/api/quiz/submit/`.
2. Django evaluates MCQ by letter comparison.
3. Short answers are LLM-evaluated via the FastAPI chatbot route (with fallback string matching).
4. Result payload returned and saved as `QuizSession` for authenticated users.

## Quiz Settings

| Setting | Range | Default |
|---|---|---|
| MCQ questions | 0–30 | 7 |
| Short answer questions | 0–10 | 3 |
| Quiz time | 1–120 min | 10 |
| Difficulty | easy / medium / hard / random | random |

## Reliability Notes

- Token budget scales with question count so large quizzes don't produce truncated JSON.
- If the AI returns malformed JSON, FastAPI makes one repair attempt before returning 502.
- If FastAPI returns a non-200 response, Django returns 503 to the frontend.
- YouTube extraction fails gracefully with a user-facing message if captions are disabled or the URL is invalid.
- Frontend should keep the user on the page and allow retry on any generation error.
