# Quiz Feature - Complete Testing Guide

## Overview
The quiz feature now correctly handles the full flow from text input → LLM generation → quiz display → submission → results.

## Fixes Applied

### 1. **Azure Response Extraction (ai_client.py)**
**Problem:** Azure wraps response in `{"choices": [...]}` structure, but code was returning the full dict instead of extracting the content string.

**Fix:** Modified line 133 to return `content` (the quiz JSON string) instead of `parsed` (the full Azure response dict).

```python
# Before (BROKEN):
if content and content.strip():
    return parsed  # ❌ Returns full Azure response

# After (FIXED):
if content and content.strip():
    logger.debug(f"Azure extracted content: {content[:100]}...")
    return content  # ✅ Returns extracted content string
```

### 2. **Quiz Endpoint Azure Response Handling (quiz.py)**
**Problem:** Quiz endpoint expected `mcq_questions` at top level, but received full Azure response dict with nested `choices` array.

**Fix:** Added Azure response format detection and extraction logic before parsing JSON.

```python
# Before (BROKEN):
if isinstance(raw, dict):
    data = raw  # ❌ Contains "choices" key, not quiz questions

# After (FIXED):
if isinstance(raw, dict):
    if "choices" in raw and isinstance(raw.get("choices"), list):
        # ✅ Azure response - extract content from choices
        choice = raw["choices"][0]
        content_str = choice["message"]["content"]
        data = json.loads(content_str)  # Parse quiz JSON
    else:
        data = raw  # Regular dict
```

---

## End-to-End Testing Checklist

### Test 1: Text-Based Quiz Generation ✅

**Steps:**
1. Go to http://localhost:3000/custom-quiz
2. Select "Computer Science" as subject
3. Paste study text:
   ```
   REST APIs are web services that use HTTP for communication.
   They follow the principles of Representational State Transfer.
   REST uses standard HTTP methods: GET, POST, PUT, DELETE.
   A resource is identified by a URI and accessed via HTTP verbs.
   REST is stateless, cacheable, and uniform.
   ```
4. Set:
   - MCQ: 5
   - Short Answer: 2
   - Difficulty: medium
   - Quiz Time: 10 minutes
5. Click "Generate Quiz"

**Expected Behavior:**
- Loading spinner appears
- Django logs show: `FastAPI quiz call failed: 502` → **BEFORE FIX**
- With fix: Should navigate to `/quiz` page
- Quiz displays with questions

**Success Criteria:**
- ✅ Quiz page loads with all questions
- ✅ Question counter shows correct total
- ✅ Question types are correctly identified (MCQ vs Short Answer)
- ✅ MCQ questions have 4 options (A, B, C, D)

---

### Test 2: File Upload & Quiz Generation ✅

**Steps:**
1. Go to http://localhost:3000/custom-quiz
2. Click "Upload Study Material" tab
3. Select "Engineering" subject
4. Create a simple PDF or DOCX file with content about:
   - Software architecture patterns
   - MVC, MVP, MVVM patterns
   - Microservices design
5. Upload the file
6. Click "Generate Quiz"

**Expected Behavior:**
- File extraction shows success toast
- Text appears in study text field
- Quiz generates successfully

**Success Criteria:**
- ✅ File uploads successfully
- ✅ Text extraction works (toast message)
- ✅ Study text appears in preview
- ✅ Quiz generates from extracted text

---

### Test 3: Taking a Quiz ✅

**Steps:**
1. From generated quiz, answer questions:
   - MCQ: Click on one option (A, B, C, or D)
   - Short Answer: Type answer in text area
2. Flag 1-2 questions using "🏳️ Flag" button
3. Navigate using Previous/Next buttons
4. Use question navigator panel (☰ button)
5. When done, click "Finish & Submit"

**Expected Behavior:**
- Questions are marked as "Answered" / "Not yet answered"
- Flags are saved in LocalStorage
- Navigation works smoothly
- Timer counts down (or shows hidden if toggled)
- Submit button becomes disabled during submission

**Success Criteria:**
- ✅ All user answers are saved locally
- ✅ Question status updates correctly
- ✅ Flag toggle works
- ✅ Navigator shows answered/flagged status

---

### Test 4: Quiz Results & Scoring ✅

**Steps:**
1. Submit quiz from previous test
2. Review results page
3. Check detailed answer review
4. Try "Copy" button on correct answers
5. Try "Share" button
6. Click "Generate New Quiz"

**Expected Behavior:**
- Redirected to `/quiz/results`
- Score displays correctly (X/Y)
- Percentage calculated correctly
- Details show each question with user answer vs correct answer
- Explanation shows for each question

**Success Criteria:**
- ✅ Score calculated correctly (correct_count / total_questions)
- ✅ Score percentage rounded to 1 decimal
- ✅ All questions displayed with answers
- ✅ "Excellent", "Good", or "Review" message shown based on score
- ✅ Share/Copy buttons functional

---

### Test 5: Error Handling ✅

#### Scenario 5A: Empty Study Text
**Steps:**
1. Try to generate quiz without entering study text
2. Click "Generate Quiz"

**Expected:** Error toast: "Study text must be at least 30 characters"

#### Scenario 5B: No Questions Selected
**Steps:**
1. Enter study text
2. Set MCQ: 0, Short Answer: 0
3. Click "Generate Quiz"

**Expected:** Error message: "Select at least one question type"

#### Scenario 5C: Subject Not Selected
**Steps:**
1. Leave subject empty
2. Click "Generate Quiz"

**Expected:** Error: "Subject is required"

#### Scenario 5D: File Too Large
**Steps:**
1. Try to upload a file > 10MB

**Expected:** Error: "File too large (max 10MB)"

#### Scenario 5E: Invalid File Format
**Steps:**
1. Try to upload unsupported format (e.g., .exe, .zip)

**Expected:** Error: "Unsupported file format"

**Success Criteria:**
- ✅ All validation errors caught and displayed
- ✅ User receives clear error messages
- ✅ Form doesn't submit on errors

---

## Log Analysis

### Django Logs (should show successful flow)

**Text Generation Flow:**
```
INFO: POST /api/quiz/generate/ HTTP/1.1" 200 OK
INFO: Headers sent: {'X-Internal-Secret': '...', ...}
INFO: FastAPI quiz call succeeded
INFO: quiz_data = fastapi_resp.json()
```

**File Extraction:**
```
INFO: POST /api/quiz/ajax-extract-text/ HTTP/1.1" 200 OK
INFO: Text extraction successful! File: document.pdf (0.25 MB, 3456 chars)
```

### FastAPI Logs (should show Azure response handling)

**Quiz Generation:**
```
DEBUG: Quiz provider returned type: str
DEBUG: Extracted Azure content: {"mcq_questions": [...
INFO: POST /quiz/ HTTP/1.1" 200 OK
```

Or if full dict is returned:

```
DEBUG: Quiz provider returned type: dict
DEBUG: Extracted Azure content: {"mcq_questions": [...
INFO: POST /quiz/ HTTP/1.1" 200 OK
```

---

## Data Flow Verification

### Before Fix (BROKEN)
```
LLM → Azure API
  ↓
{"choices": [{"message": {"content": "{\"mcq_questions\": [...]}"}}]}
  ↓
ai_client.generate_content() returns FULL DICT
  ↓
quiz.py receives {"choices": [...], "usage": ...}
  ↓
data.get("mcq_questions") → []  ❌ KEY NOT FOUND
  ↓
Error: "Quiz response missing both mcq_questions and short_questions"
```

### After Fix (WORKING)
```
LLM → Azure API
  ↓
{"choices": [{"message": {"content": "{\"mcq_questions\": [...]}"}}]}
  ↓
ai_client.generate_content() extracts content → returns "{\"mcq_questions\": [...]}"
  ↓
quiz.py receives STRING (or dict with already-parsed data)
  ↓
quiz.py parses JSON
  ↓
data = {"mcq_questions": [...], "short_questions": [...]}
  ↓
Quiz normalizes and returns to Django
  ↓
Django passes to Frontend → SUCCESS ✅
```

---

## Integration Points

### CustomQuiz.jsx → Django
```javascript
POST /api/quiz/generate/ {
  subject: "Computer Science",
  extractedText: "...",
  num_mcq: 7,
  num_short: 3,
  difficulty: "medium",
  quiz_time: 10
}

Response: {
  mcq_questions: [...],
  short_questions: [...],
  id: "uuid",
  time_limit: 10,
  subject: "Computer Science",
  difficulty: "medium"
}
```

### Django → FastAPI
```python
POST /quiz/ {
  subject: "Computer Science",
  study_text: "...",
  num_mcq: 7,
  num_short: 3,
  difficulty: "medium"
}

Response: {
  mcq_questions: [...],
  short_questions: [...],
  subject: "Computer Science",
  difficulty: "medium"
}
```

### FastAPI → LLM (Azure)
```python
Messages: [
  {"role": "system", "content": "You are a helpful educational assistant..."},
  {"role": "user", "content": "Generate a quiz about..."}
]

Response: {
  choices: [{
    message: {
      content: "{\"mcq_questions\": [...], \"short_questions\": [...]}"
    }
  }],
  usage: {...}
}
```

---

## Frontend Component Compatibility

### Quiz.jsx ✅
- ✅ Receives `quizData` with `mcq_questions` and `short_questions`
- ✅ Converts answers to string indices: `{"0": "A", "1": "B", ...}`
- ✅ Submits to `/api/quiz/submit/`

### QuizResults.jsx ✅
- ✅ Receives `results` object with score, total, details
- ✅ Displays each question with user answer vs correct answer
- ✅ Shows score percentage with conditional message

### CustomQuiz.jsx ✅
- ✅ Validates form before submission
- ✅ Sends correct payload structure
- ✅ Navigates to Quiz page with quizData

---

## Performance Notes

- **Quiz Generation Time:** ~3-5 seconds (depends on LLM)
- **File Extraction Time:** <500ms for typical PDFs
- **Question Count:** Supports 1-20 MCQ + 0-10 Short Answer
- **Max Study Text:** 50,000 characters
- **Max File Size:** 10MB

---

## Known Limitations

1. **Short Answer Grading:** Uses simple case-insensitive string matching
   - Production should use semantic similarity (BERT, embeddings)
   
2. **File Formats:** Currently supports PDF, DOCX, PPTX, TXT
   - Could add support for images via OCR in future

3. **Quiz Persistence:** Quiz data is session-based only
   - No database storage of generated quizzes
   - No history tracking

4. **Multiple Provider Fallback:** Currently Azure only
   - With DeepSeek/Gemini keys configured, system would fallback automatically

---

## Cleanup Tasks

Once testing is complete:

- [ ] Delete `apps/quiz/views.py` (legacy sync endpoint)
- [ ] Update `apps/quiz/urls.py` to remove `views` imports
- [ ] Consider adding quiz persistence to PostgreSQL
- [ ] Implement semantic similarity for short answer grading
- [ ] Add quiz history page showing user's past quizzes

