# Quiz Feature Documentation

## Quick Overview

The Quiz feature allows users to generate AI-powered quizzes from text, documents, or custom topics. Quizzes include:
- **Multiple choice, short answer, and fill-in-the-blank** question types
- **Timer-based sessions** with real-time countdown
- **Progress tracking** with score and analytics
- **Smart grading** using AI evaluation
- **Session history** for review and improvement

## Architecture Overview

### Components

**Frontend Components:**
- `QuizGenerator.jsx` - Quiz creation form
- `QuizSession.jsx` - Quiz taking interface with timer
- `QuizResults.jsx` - Results and score display
- `QuizHistory.jsx` - Session history and analytics

**Backend (Django):**
- `apps/quiz/models.py` - QuizSession, Question, Answer models
- `apps/quiz/serializers.py` - Request/response serialization
- `apps/quiz/views.py` - API endpoints for quiz operations
- `apps/quiz/urls.py` - URL routing

**Backend (FastAPI):**
- `fastapi_service/quiz_generator.py` - AI-powered quiz generation
- `fastapi_service/grader.py` - AI-based answer grading

### Database Models

**QuizSession**
- `id` - Unique identifier
- `user` - ForeignKey to User
- `subject` - Topic of quiz
- `total_questions` - Number of questions
- `time_limit` - Duration in seconds
- `score` - Final score (0-100)
- `status` - 'in_progress', 'completed', 'abandoned'
- `created_at` - Session start time
- `completed_at` - Session end time

**Question**
- `id` - Unique identifier
- `quiz_session` - ForeignKey to QuizSession
- `question_text` - The question
- `question_type` - 'multiple_choice', 'short_answer', 'fill_in_blank'
- `options` - JSON array for multiple choice
- `correct_answer` - Expected answer
- `order` - Question sequence

**Answer**
- `id` - Unique identifier
- `question` - ForeignKey to Question
- `user_answer` - User's response
- `is_correct` - Grading result
- `points` - Points awarded
- `submitted_at` - When answer was submitted

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/quiz/generate/` | Generate quiz from text/topic |
| GET | `/api/quiz/sessions/` | Get user's quiz sessions |
| POST | `/api/quiz/start/` | Start a new quiz session |
| POST | `/api/quiz/submit-answer/` | Submit answer to question |
| POST | `/api/quiz/complete/` | Mark session as complete |
| GET | `/api/quiz/session/{id}/` | Get session details |
| GET | `/api/quiz/results/{id}/` | Get session results |

## Timer Implementation

### Client-Side Timer
- **Start:** Initialized when quiz begins
- **Update:** Countdown every second
- **Display:** Shows MM:SS format
- **Warning:** Color change at 5 minutes remaining
- **Critical:** Flashing at < 1 minute remaining

### Server-Side Validation
- **Session timeout:** Validated on each answer submission
- **Grace period:** 30 seconds after client timer expires
- **Auto-submit:** Incomplete session marked as complete when time expires

### Fixes Applied
The quiz timer had a **race condition** where it would immediately show "Time's up!" This was caused by:
- Misaligned client/server time calculations
- Race between timer completion and initial question render
- Async state update ordering

**Resolution:** See [timer-fixes/QUIZ_TIMER_FIX_COMPLETE.md](../timer-fixes/QUIZ_TIMER_FIX_COMPLETE.md)

## Quiz Generation Flow

```
User Input (text/topic)
         ↓
FastAPI receives request
         ↓
Validate input length & format
         ↓
Call LLM (Azure OpenAI/Gemini/DeepSeek)
         ↓
Parse LLM response (questions + options)
         ↓
Validate question format & count
         ↓
Return to Django
         ↓
Save to database
         ↓
Return quiz to frontend
```

## Grading System

### Automatic Grading
- **Multiple choice:** Exact match against stored answer
- **Short answer:** AI semantic matching (similarity score > 0.8)
- **Fill-in-blank:** Keyword matching or AI evaluation

### Score Calculation
- Each question worth equal points (100 / total_questions)
- Partial credit possible for AI-graded answers
- Final score: Sum of all points, converted to 0-100 scale

## Usage Examples

### Generate a Quiz
```bash
curl -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "text",
    "content": "Machine learning is...",
    "num_questions": 5
  }'
```

### Start a Quiz Session
```bash
curl -X POST http://localhost:8000/api/quiz/start/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 123,
    "time_limit": 600
  }'
```

### Submit Answer
```bash
curl -X POST http://localhost:8000/api/quiz/submit-answer/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 456,
    "user_answer": "The answer is..."
  }'
```

## Feature Access Control

- **Unverified users:** Cannot generate or take quizzes
- **Verified users:** Full access to all quiz features
- **Admin users:** Can view all user quiz sessions and analytics

## Performance Considerations

- **Quiz generation:** Async task via FastAPI (typically 2-5 seconds)
- **Answer grading:** Cached results to prevent duplicate LLM calls
- **Session timeout:** Server validates within 30 seconds of timer expiry

## Known Limitations

- Maximum 50 questions per quiz (to limit LLM token usage)
- Grading accuracy depends on LLM quality
- Timer drift can occur with very long sessions (>30 minutes)

## Troubleshooting

### Quiz Generation Fails
- Check if FastAPI service is running
- Verify LLM API keys in .env
- Check input content length (min 50 chars, max 10000)

### Timer Shows Wrong Time
- Verify client/server time are synchronized
- Check browser console for JavaScript errors
- Refresh page and try again

### Answers Not Being Saved
- Verify user is authenticated
- Check database for session record
- Review Django logs for SQL errors

## See Also
- [timer-fixes/QUIZ_TIMER_FIX_COMPLETE.md](../timer-fixes/QUIZ_TIMER_FIX_COMPLETE.md) - Timer fix details
- [ui-styling/QUIZ_UI_STYLING_COMPLETE.md](../ui-styling/QUIZ_UI_STYLING_COMPLETE.md) - UI styling
- [ARCHITECTURE.md](../architecture-design/ARCHITECTURE.md) - System architecture
