# Quiz Feature - Complete Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            LAMLA AI QUIZ SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   React Frontend     │ (Port 3000)
│   - CreateQuiz.jsx   │
│   - Quiz.jsx         │
│   - QuizResults.jsx  │
└──────────┬───────────┘
           │ HTTP (CORS enabled)
           ▼
┌──────────────────────────────────────────────────────────┐
│        Django ASGI API Gateway (Port 8000)               │
│  - /api/quiz/generate/                                   │
│  - /api/quiz/ajax-extract-text/                          │
│  - /api/quiz/submit/                                     │
│                                                          │
│  Uses: httpx.AsyncClient → persistent connection pool   │
└──────────────┬───────────────────────────────────────────┘
               │ Secret-authenticated HTTP
               ▼
┌──────────────────────────────────────────────────────────┐
│        FastAPI Worker (Port 8001)                        │
│  - /quiz/ endpoint                                       │
│  - /chatbot/ endpoint                                    │
│  - Authentication middleware                            │
└──────────────┬───────────────────────────────────────────┘
               │ Authenticated HTTP
               ▼
┌──────────────────────────────────────────────────────────┐
│        AI Provider Orchestration (ai_client.py)          │
│  - Try Azure (if configured)                            │
│  - Fallback to DeepSeek (if configured)                 │
│  - Fallback to Gemini (if configured)                   │
│  - Fallback to HuggingFace (if configured)              │
└──────────────┬───────────────────────────────────────────┘
               │ API calls with auth
               ▼
┌──────────────────────────────────────────────────────────┐
│        External LLM Providers                            │
│  - Azure OpenAI API                                      │
│  - DeepSeek API (optional)                               │
│  - Gemini API (optional)                                │
│  - HuggingFace API (optional)                           │
└──────────────────────────────────────────────────────────┘

Database (PostgreSQL):
  - ChatSession (for chat history)
  - ChatMessage (for conversations)
  - (Quiz data currently NOT persisted)
```

---

## Data Flow: Quiz Generation (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER INTERACTION (Frontend)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  CreateQuiz.jsx:                                                         │
│  ┌─────────────────────────────┐                                        │
│  │ User fills form:            │                                        │
│  │ - Subject: "Physics"        │                                        │
│  │ - Study Text: "Mechanics"   │                                        │
│  │ - MCQ: 5                    │                                        │
│  │ - Short: 2                  │                                        │
│  │ - Difficulty: "medium"      │                                        │
│  │ - Quiz Time: 10 mins        │                                        │
│  └────────────┬────────────────┘                                        │
│               │ Validation ✅                                            │
│               │ - Text 30-50000 chars                                    │
│               │ - At least 1 question type                              │
│               │ - Subject selected                                      │
│               ▼                                                          │
│  POST /api/quiz/generate/ {                                             │
│    subject: "Physics",                                                  │
│    extractedText: "Mechanics content...",                               │
│    num_mcq: 5,                                                          │
│    num_short: 2,                                                        │
│    difficulty: "medium",                                                │
│    quiz_time: 10                                                        │
│  }                                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: DJANGO REQUEST HANDLING                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  async_views.py: generate_quiz_api_async()                             │
│                                                                          │
│  1. Parse request JSON ✅                                               │
│  2. Validate inputs ✅                                                  │
│  3. Construct FastAPI payload:                                          │
│     {                                                                   │
│       subject: "Physics",                                               │
│       study_text: "Mechanics content...",                               │
│       num_mcq: 5,                                                       │
│       num_short: 2,                                                     │
│       difficulty: "medium"                                              │
│     }                                                                   │
│  4. Get async client & headers ✅                                       │
│  5. POST http://localhost:8001/quiz/ ✅                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: FASTAPI QUIZ ENDPOINT                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  routes/quiz.py: quiz_endpoint()                                        │
│                                                                          │
│  1. Validate authentication ✅                                          │
│  2. Validate payload schema (Pydantic) ✅                               │
│  3. Build LLM prompt:                                                   │
│     "You are Lamla AI Tutor. Generate a quiz...                         │
│      Subject: Physics                                                   │
│      Study Text: Mechanics content...                                   │
│      Generate 5 MCQs and 2 short answer questions                       │
│      Return ONLY valid JSON..."                                         │
│  4. Call AI service:                                                    │
│     raw = ai_service.generate_content(client, prompt, max_tokens=2048) │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: AI CLIENT ORCHESTRATION (FIXED)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  core/ai_client.py: generate_content()                                  │
│                                                                          │
│  1. Try Azure provider ✅                                               │
│  2. Call Azure OpenAI API ✅                                            │
│  3. Receive response:                                                   │
│     {                                                                   │
│       "choices": [{                                                     │
│         "message": {                                                    │
│           "content": "{\"mcq_questions\": [Q1, Q2...], ...}"   ◄──────┐ │
│         }                                                               │ │
│       }],                                                               │ │
│       "usage": {...},                                                  │ │
│       ...                                                               │ │
│     }                                                                   │ │
│                                                                         │ │
│  4. 🔧 FIXED: Extract content string from choices[0].message.content ──┘ │
│                                                                          │
│  5. Return: "{\"mcq_questions\": [Q1, Q2...], ...}"  ◄─── STRING ✅    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: FASTAPI QUIZ RESPONSE HANDLING (FIXED)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  routes/quiz.py: quiz_endpoint() - Response Processing                 │
│                                                                          │
│  1. raw = "{\"mcq_questions\": [...], \"short_questions\": [...]}"      │
│                                                                          │
│  2. 🔧 FIXED: Detect response format:                                   │
│     if isinstance(raw, dict) AND "choices" in raw:                      │
│       → Extract content from choices (Azure format)                     │
│     else:                                                               │
│       → Treat as already-parsed JSON                                    │
│                                                                          │
│  3. Parse JSON: data = json.loads(raw) ✅                              │
│                                                                          │
│  4. Extract questions:                                                  │
│     mcq_questions = data.get("mcq_questions", [])                       │
│     short_questions = data.get("short_questions", [])                   │
│                                                                          │
│  5. Validate: At least one question of some type ✅                     │
│                                                                          │
│  6. Normalize each question:                                            │
│     {                                                                   │
│       question: "...",                                                  │
│       type: "mcq",                                                      │
│       options: ["A", "B", "C", "D"],                                    │
│       answer: "B",                                                      │
│       explanation: "..."                                                │
│     }                                                                   │
│                                                                          │
│  7. Return response ✅                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: DJANGO RESPONSE PROCESSING                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  async_views.py: generate_quiz_api_async() - Continue                  │
│                                                                          │
│  1. Receive quiz_data from FastAPI ✅                                   │
│  2. Add metadata for frontend:                                          │
│     quiz_data['id'] = str(uuid.uuid4())                                 │
│     quiz_data['time_limit'] = 10  # minutes                             │
│     quiz_data['created_at'] = None                                      │
│  3. Return JsonResponse(quiz_data) ✅                                   │
│                                                                          │
│  Response to Frontend:                                                  │
│  {                                                                       │
│    "subject": "Physics",                                                │
│    "study_text": "...",                                                │
│    "difficulty": "medium",                                              │
│    "mcq_questions": [                                                   │
│      {                                                                  │
│        "question": "What is velocity?",                                │
│        "type": "mcq",                                                  │
│        "options": ["Speed", "Acceleration", "Distance", "Force"],      │
│        "answer": "A",                                                  │
│        "explanation": "Velocity is the speed of an object in a..."    │
│      },                                                                │
│      ...                                                               │
│    ],                                                                  │
│    "short_questions": [...],                                           │
│    "id": "550e8400-e29b-41d4-a716-446655440000",                      │
│    "time_limit": 10,                                                   │
│    "created_at": null                                                  │
│  }                                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: FRONTEND DISPLAY                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CreateQuiz.jsx:                                                        │
│  → Receives quiz_data ✅                                                │
│  → navigate('/quiz', { state: { quizData: response.data } })            │
│                                                                          │
│  Quiz.jsx:                                                              │
│  → Receives quizData from location.state ✅                             │
│  → Merges MCQ and short questions: allQuestions = [...]                 │
│  → Sets timer: timeRemaining = time_limit * 60 seconds                  │
│  → Displays first question ✅                                           │
│  → Stores progress in LocalStorage                                      │
│                                                                          │
│  ✅ QUIZ PAGE LOADS SUCCESSFULLY ✅                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Quiz Submission

```
┌─────────────────────────────────────────────────────────────────────────┐
│ USER SUBMITS QUIZ                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Quiz.jsx: submitQuiz()                                                 │
│  POST /api/quiz/submit/ {                                               │
│    quiz_id: "550e8400-e29b-41d4-a716-446655440000",                    │
│    quiz_data: {                                                         │
│      mcq_questions: [...],                                              │
│      short_questions: [...]                                             │
│    },                                                                   │
│    user_answers: {                                                      │
│      "0": "A",        // MCQ - letter answer                            │
│      "1": "B",                                                          │
│      "2": "Newton's Second Law",  // Short answer                       │
│      ...                                                                │
│    },                                                                   │
│    total_questions: 7                                                   │
│  }                                                                       │
│                                                                          │
└────────────┬──────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ DJANGO: CALCULATE SCORES                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  async_views.py: submit_quiz_api_async()                                │
│                                                                          │
│  1. Extract questions from quiz_data ✅                                 │
│  2. Initialize: correct_count = 0, details = []                         │
│  3. FOR EACH question (index, question):                                │
│     a) Get user_answer from user_answers[index]                         │
│     b) Get correct_answer from question["answer"]                       │
│     c) Compare based on type:                                           │
│        - MCQ: Extract first letter, compare case-insensitive            │
│          user_letter = user_answer.upper()[0]                           │
│          correct_letter = correct_answer.upper()[0]                     │
│          is_correct = user_letter == correct_letter                     │
│        - Short: Case-insensitive string comparison                       │
│          is_correct = user_answer.lower() == correct_answer.lower()     │
│     d) If correct, increment correct_count                              │
│     e) Append to details with full info                                 │
│  4. Calculate: score_percent = (correct_count / total) * 100            │
│  5. Return results ✅                                                    │
│                                                                          │
│  Response:                                                              │
│  {                                                                       │
│    "quiz_id": "550e8400-e29b-41d4-a716-446655440000",                  │
│    "subject": "Physics",                                                │
│    "difficulty": "medium",                                              │
│    "score": 5,                                                          │
│    "total": 7,                                                          │
│    "score_percent": 71.4,                                               │
│    "details": [                                                         │
│      {                                                                  │
│        "question_index": 0,                                             │
│        "question": "What is velocity?",                                │
│        "user_answer": "A",                                              │
│        "correct_answer": "A",                                           │
│        "is_correct": true,                                              │
│        "explanation": "Velocity is speed in a direction"               │
│      },                                                                 │
│      ...                                                                │
│    ],                                                                   │
│    "submitted_at": null                                                 │
│  }                                                                       │
│                                                                          │
└────────────┬──────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND: DISPLAY RESULTS                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Quiz.jsx → navigate('/quiz/results', { state: { results } })          │
│                                                                          │
│  QuizResults.jsx:                                                       │
│  1. Display score: 5/7                                                  │
│  2. Display percentage: 71.4%                                           │
│  3. Show message based on score:                                        │
│     - ≥ 80%: "Excellent Work!"                                          │
│     - ≥ 50%: "Good Effort!"                                             │
│     - < 50%: "Time to Review!"                                          │
│  4. List each question with:                                            │
│     - Question text                                                     │
│     - User's answer                                                     │
│     - Correct answer                                                    │
│     - Explanation                                                       │
│     - Status (✅ Correct / ❌ Incorrect / ⊙ Unanswered)               │
│  5. Buttons:                                                            │
│     - Share                                                             │
│     - Generate New Quiz                                                 │
│                                                                          │
│  ✅ RESULTS DISPLAYED SUCCESSFULLY ✅                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Fixes Applied

### Fix 1: Azure Response Extraction
```
BEFORE (BROKEN):
  Azure Response
  {"choices": [{"message": {"content": "quiz JSON"}}], ...}
  ↓
  ai_client returns: {"choices": [...], ...}  ← FULL DICT
  ↓
  quiz.py looks for mcq_questions at top level → NOT FOUND ❌

AFTER (FIXED):
  Azure Response
  {"choices": [{"message": {"content": "quiz JSON"}}], ...}
  ↓
  ai_client extracts and returns: "quiz JSON"  ← JUST CONTENT ✅
  ↓
  quiz.py detects Azure format → extracts content
  ↓
  quiz.py finds mcq_questions at top level → SUCCESS ✅
```

### Fix 2: Quiz Response Handling
```
BEFORE (BROKEN):
  if isinstance(raw, dict):
      data = raw  ← Assumes it's quiz JSON
  
  mcq_questions = data.get("mcq_questions")  ← NOT FOUND

AFTER (FIXED):
  if isinstance(raw, dict):
      if "choices" in raw:  ← Detect Azure format
          extract content from choices
          data = json.loads(content)
      else:
          data = raw  ← Assume it's quiz JSON
  
  mcq_questions = data.get("mcq_questions")  ← FOUND ✅
```

---

## Summary

✅ **Quiz Generation:** Text/File → Prompt → Azure → Response extraction → Normalized questions → Frontend ✅

✅ **Quiz Taking:** Displays questions → Captures answers → Stores progress → Allows submission ✅

✅ **Results:** Scores calculated → Details displayed → Explanations shown ✅

**Result:** Complete, working quiz feature from generation to results!

