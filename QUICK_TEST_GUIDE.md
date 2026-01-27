# Quick Reference: Testing Conversation & File API Fixes

## 🚀 Quick Start

### Verify Django is running with ASGI
```bash
# Should see: "Uvicorn running on http://0.0.0.0:8000"
cd backend
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
```

### Verify FastAPI is running
```bash
# Should see: "Uvicorn running on http://0.0.0.0:8001"
cd backend/fastapi_service
python run.py
```

---

## 🧪 Test Scenarios

### Test 1: Basic Message Saving
```bash
# Send message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is photosynthesis?"}'

# Expected: {"response": "Photosynthesis is..."}
```

### Test 2: Verify Message Was Saved
```bash
# Retrieve history
curl http://localhost:8000/api/chat/history/

# Expected:
# {
#   "session_id": "...",
#   "message_count": 2,
#   "messages": [
#     {"sender": "user", "content": "What is photosynthesis?"},
#     {"sender": "ai", "content": "Photosynthesis is..."}
#   ]
# }
```

### Test 3: Test Persistence
```bash
# Check initial count
curl http://localhost:8000/api/chat/history/ | grep message_count

# Send 2nd message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more"}'

# Check count increased
curl http://localhost:8000/api/chat/history/ | grep message_count
```

### Test 4: File Upload
```bash
# Create a test file
echo "Photosynthesis is the process of converting light energy..." > test.txt

# Upload with message
curl -X POST http://localhost:8000/api/chat/file/ \
  -F "file_upload=@test.txt" \
  -F "message=Summarize this document"

# Expected: Summarized response based on file content
```

### Test 5: Stream Endpoint
```bash
# Send message to streaming endpoint
curl -X POST http://localhost:8000/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is machine learning?"}' \
  --no-buffer

# Should see character-by-character streaming output
```

### Test 6: Clear History
```bash
# Clear all messages for testing
curl -X DELETE http://localhost:8000/api/chat/history/clear/

# Expected: {"status": "success", "deleted_count": N}
```

---

## 📋 Automated Testing

### Run Full Test Suite
```bash
cd backend
python test_chatbot_fixes.py

# Output:
# TEST SUMMARY
# ✓ PASS: Conversation Saving
# ✓ PASS: Conversation Persistence
# ✓ PASS: Database Integrity
# ✓ PASS: Clear History
# Total: 4/4 passed
```

### Individual Test Components (Python)
```python
# Start Python shell
cd backend
python manage.py shell

# Check conversation count
from apps.chatbot.models import ChatMessage
ChatMessage.objects.count()

# View recent messages
ChatMessage.objects.all().order_by('-created_at')[:5]

# View by sender
ChatMessage.objects.filter(sender='user').count()
ChatMessage.objects.filter(sender='ai').count()

# Delete all (for testing)
ChatMessage.objects.all().delete()
```

---

## 🔍 Debugging Commands

### Check Database Connection
```bash
python manage.py dbshell
# If successful, you'll see the psql prompt
```

### View All Messages in Session
```bash
cd backend
python manage.py shell
>>> from apps.chatbot.models import ChatSession, ChatMessage
>>> session = ChatSession.objects.first()
>>> session.messages.all().order_by('created_at')
```

### Monitor Django Logs
```bash
# Terminal should show:
# Saved user message ID 1 to session 5
# Built prompt with 5000 chars of file context for document.pdf
# Saved AI message ID 2 to session 5
```

### Check FastAPI Connectivity
```bash
curl http://localhost:8001/health
# Expected: {"status":"ok"} or similar
```

### Verify FASTAPI_SECRET Match
```bash
# Django side (in .env)
echo $FASTAPI_SECRET

# FastAPI side (in environment)
# Should be identical
```

---

## 📊 Expected vs Actual

### ✅ Correct Behavior (After Fixes)

| Action | Expected |
|--------|----------|
| Send message | Message appears in `/api/history/` ✓ |
| Upload file | File text extracted, context shown in logs ✓ |
| Stream endpoint | Response streams AND persists ✓ |
| Multiple messages | Count increases with each message ✓ |
| Clear history | `/api/history/` returns count 0 ✓ |

### ❌ Common Issues

| Issue | Solution |
|-------|----------|
| 404 errors | Check Django is running, routes are registered |
| Empty responses | Check logs for "Built prompt" messages |
| Messages not saving | Look for `Failed to save` in logs |
| CORS errors | Check `FASTAPI_SECRET` environment variables |
| Slow responses | Check FastAPI is running and accessible |

---

## 🔧 Configuration Quick Check

```bash
# Django
cat backend/.env | grep FASTAPI

# FastAPI (if separate .env)
cat backend/fastapi_service/.env | grep FASTAPI_SECRET

# Database
python manage.py dbshell << EOF
SELECT COUNT(*) FROM chatbot_chatmessage;
\q
EOF

# File extraction support
python -c "import PyPDF2, docx; print('✓ File libraries installed')"
```

---

## 📱 Python API Testing

```python
import requests
import json

BASE_URL = "http://localhost:8000/api"

# 1. Send message
response = requests.post(
    f"{BASE_URL}/chat/",
    json={"message": "Hello chatbot!"}
)
print(response.json())

# 2. Check history
response = requests.get(f"{BASE_URL}/chat/history/")
data = response.json()
print(f"Message count: {data['message_count']}")
for msg in data['messages']:
    print(f"  - {msg['sender']}: {msg['content'][:50]}...")

# 3. Upload file
with open("document.pdf", "rb") as f:
    files = {"file_upload": f}
    data = {"message": "Summarize"}
    response = requests.post(
        f"{BASE_URL}/chat/file/",
        files=files,
        data=data
    )
    print(response.json())

# 4. Clear history
response = requests.delete(f"{BASE_URL}/chat/history/clear/")
print(response.json())
```

---

## 📝 Logs to Look For

### Successful Message Save
```
DEBUG: Saved user message ID 1 to session 5
DEBUG: Saved AI message ID 2 to session 5
```

### Successful File Upload
```
INFO: Processing file upload: document.pdf, message: Summarize this
DEBUG: Extracted 5234 characters from document.pdf
DEBUG: Built prompt with 5234 chars of file context for document.pdf
DEBUG: Saved user message ID 3 to session 5
DEBUG: Saved AI message ID 4 to session 5
```

### Error Cases
```
ERROR: Failed to save user message: [error details]
ERROR: Failed to parse FastAPI response: [error details]
ERROR: Failed to save AI message: [error details]
```

---

## 🎯 Success Criteria

- [ ] Messages appear in `/api/history/` after sending
- [ ] Message count increases with each new message
- [ ] File uploads show extracted character count in logs
- [ ] Streaming endpoint returns streamed response
- [ ] All messages have timestamps
- [ ] Can clear history and start fresh
- [ ] No 500 errors in API responses
- [ ] No exceptions in Django logs
- [ ] Database has messages with correct sender types

---

## Need Help?

1. **Check logs first** - Look at Django terminal output
2. **Run test suite** - `python test_chatbot_fixes.py`
3. **Use diagnostics** - `curl http://localhost:8000/api/history/`
4. **Database check** - `python manage.py dbshell`
5. **File extraction** - Verify PyPDF2, python-docx, python-pptx installed

See [CONVERSATION_SAVE_FIXES.md](CONVERSATION_SAVE_FIXES.md) for detailed documentation.
