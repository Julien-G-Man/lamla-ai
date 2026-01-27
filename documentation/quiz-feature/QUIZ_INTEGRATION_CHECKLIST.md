# Quiz Feature Integration Checklist

## Pre-Testing Setup

- [ ] Django running on port 8000: `python run_django.py`
- [ ] FastAPI running on port 8001: `python fastapi_service/run.py`
- [ ] React running on port 3000: `npm start`
- [ ] Azure OpenAI credentials configured in `.env`
- [ ] Database migrations applied (if any)

## Code Changes Verification

- [x] `ai_client.py` line 133: Returns `content` (Azure extracted string)
- [x] `quiz.py` lines 83-123: Detects and extracts Azure response format
- [x] `async_views.py`: No changes needed (already correct)
- [x] Frontend files: No changes needed (already correct)
- [x] All Python files compile without syntax errors

## Integration Points

### CustomQuiz.jsx → Django
```
✅ POST /api/quiz/generate/
✅ Headers: Content-Type: application/json
✅ Body: {subject, extractedText, num_mcq, num_short, difficulty, quiz_time}
✅ Response: {mcq_questions, short_questions, id, time_limit, ...}
```

### Django → FastAPI
```
✅ POST /quiz/
✅ Headers: X-Internal-Secret, Content-Type: application/json
✅ Body: {subject, study_text, num_mcq, num_short, difficulty}
✅ Response: {mcq_questions, short_questions, subject, difficulty}
```

### FastAPI → Azure LLM
```
✅ Azure API endpoint configured
✅ System message: "You are a helpful educational assistant..."
✅ User message: Includes quiz requirements and JSON format
✅ Response: Wrapped in {choices: [{message: {content: "..."}}]}
```

### Quiz.jsx → Django
```
✅ POST /api/quiz/submit/
✅ Body: {quiz_id, quiz_data, user_answers, total_questions}
✅ Response: {score, total, score_percent, details, subject}
```

### QuizResults.jsx
```
✅ Displays score: {correct_count}/{total_questions}
✅ Shows percentage: {score_percent}%
✅ Lists each question with user answer vs correct
✅ Shows explanation for each question
```

## Data Format Validation

### Quiz Response Format
```json
{
  "subject": "Computer Science",
  "study_text": "...",
  "difficulty": "medium",
  "mcq_questions": [
    {
      "question": "What is...?",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "..."
    }
  ],
  "short_questions": [
    {
      "question": "Explain...?",
      "type": "short",
      "options": [],
      "answer": "Expected answer text",
      "explanation": "..."
    }
  ]
}
```

### Submission Response Format
```json
{
  "quiz_id": "uuid",
  "subject": "Computer Science",
  "difficulty": "medium",
  "score": 5,
  "total": 7,
  "score_percent": 71.4,
  "details": [
    {
      "question_index": 0,
      "question": "What is...?",
      "user_answer": "A",
      "correct_answer": "A",
      "is_correct": true,
      "explanation": "..."
    }
  ],
  "submitted_at": null
}
```

## Error Scenarios

### Frontend Validation Errors
- [ ] Empty subject → "Please select or enter a subject"
- [ ] Text < 30 chars → "Please enter at least 30 characters"
- [ ] Text > 50,000 chars → "Text is too long"
- [ ] No questions → "Select at least one question type"
- [ ] File > 10MB → "File too large (max 10MB)"
- [ ] Unsupported file format → "Unsupported file format"

### Backend Errors
- [ ] FastAPI returns 500 → Django returns 503
- [ ] Quiz generation timeout → Django returns 504
- [ ] Invalid quiz JSON → Django returns 502
- [ ] Missing Azure config → FastAPI returns 503

## Testing Flow

### Test 1: Happy Path (Text-based)
1. Go to CustomQuiz
2. Select "Mathematics"
3. Enter study text (~500 chars)
4. Set MCQ=5, Short=2
5. Click "Generate Quiz"
6. **Expected:** Quiz page loads with all questions

### Test 2: Happy Path (File-based)
1. Create test PDF with 1-2 pages
2. Upload in CustomQuiz
3. Confirm text extraction success
4. Generate quiz
5. **Expected:** Quiz generates from file content

### Test 3: Quiz Taking
1. Answer all questions (mix of MCQ and short)
2. Flag 1-2 questions
3. Navigate with Previous/Next
4. Click "Finish & Submit"
5. **Expected:** Results page shows score with details

### Test 4: Results Verification
1. Check score calculation: correct_count / total
2. Check percentage calculation: (score / total) * 100
3. Review each question with explanation
4. **Expected:** All calculations correct

### Test 5: Error Handling
1. Try empty text → Error shown
2. Try no file upload → Error shown
3. Try invalid file → Error shown
4. **Expected:** All errors handled gracefully

## Log Verification

### Django Console Should Show:
```
✅ POST /api/quiz/ajax-extract-text/ → 200 OK
✅ Text extraction successful! File: document.pdf
✅ POST /api/quiz/generate/ → 200 OK
✅ Headers sent: {'X-Internal-Secret': '...'}
✅ Quiz generation succeeded
✅ POST /api/quiz/submit/ → 200 OK
✅ Quiz submitted: 5/7 correct (71.4%)
```

### FastAPI Console Should Show:
```
✅ POST /quiz/ → 200 OK
✅ Quiz provider returned type: str (or dict)
✅ Extracted Azure content: {"mcq_questions": [...]
✅ Quiz response validation: success
```

## Browser DevTools Checks

### Network Tab
```
✅ POST /api/quiz/generate/ → 200 ✅
Response body has: {mcq_questions, short_questions, id, time_limit}

✅ POST /api/quiz/submit/ → 200 ✅
Response body has: {score, total, score_percent, details}
```

### Console
```
✅ No errors logged
✅ No unhandled promise rejections
✅ CSS/JS resources loading
```

### LocalStorage
```
✅ lamla_quiz_{id} stored during quiz
✅ Contains: {userAnswers, flaggedQuestions, currentIndex, endTime}
✅ Cleared after submission
```

## Performance Baselines

| Operation | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Quiz Generation | 3-5s | ? | ⏳ |
| File Extraction | <500ms | ? | ⏳ |
| Answer Submission | <100ms | ? | ⏳ |
| Results Page Load | <100ms | ? | ⏳ |
| Overall Flow | <10s | ? | ⏳ |

## Final Checklist

- [ ] All Python files compile
- [ ] All API endpoints respond with correct status codes
- [ ] Quiz generation returns normalized questions
- [ ] Score calculations are accurate
- [ ] User answers are preserved during quiz
- [ ] File extraction works for all formats
- [ ] Errors are handled gracefully
- [ ] Frontend receives correct data format
- [ ] Results display correctly
- [ ] No console errors or warnings

## Sign-Off

**Testing Date:** _______________
**Tested By:** _______________
**Status:** ✅ Pass / ❌ Fail / 🟡 Partial

**Issues Found:**
```
(list any issues here)
```

**Notes:**
```
(additional notes)
```

