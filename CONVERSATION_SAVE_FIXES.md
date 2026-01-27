# Conversation Saving & File API Fixes

## Issues Identified & Fixed

### 1. **Conversation Saving Issues**

**Problem:**
- `_save_user_message()` and `_save_ai_message()` functions had no error handling
- No validation that database operations actually succeeded
- Silent failures when saving messages
- Streaming endpoint saved messages asynchronously without awaiting completion

**Fixes Applied:**
- Added try-except blocks with detailed error logging to `_save_user_message()` and `_save_ai_message()`
- Functions now return the saved message object for verification
- Added debug logging at each save point to track message IDs
- Fixed streaming endpoint to properly await message saves and log errors
- Added error handling in `chatbot_api_async()` to catch save failures

**Code Changes:**
```python
# Before: Silent failures
async def _save_user_message(session_obj, user_message: str):
    await sync_to_async(ChatMessage.objects.create)(...)

# After: With error handling and logging
async def _save_user_message(session_obj, user_message: str):
    try:
        msg_obj = await sync_to_async(ChatMessage.objects.create)(...)
        logger.debug(f"Saved user message ID {msg_obj.id} to session {session_obj.id}")
        return msg_obj
    except Exception as e:
        logger.error(f"Failed to save user message: {e}", exc_info=True)
        raise
```

---

### 2. **File Upload API Context Issues**

**Problem:**
- File context was extracted but not being verified to pass to FastAPI
- Limited logging made it hard to debug context passing
- Error messages didn't distinguish between file extraction and AI processing errors
- Response extraction didn't handle Azure format properly

**Fixes Applied:**
- Added comprehensive logging at each step of file processing
- Improved error messages to be more specific (file extraction vs. AI service)
- Enhanced FastAPI response parsing with better error handling
- Added validation that context_document is being used in prompt
- Ensured `context_document` parameter is explicitly passed to `_build_chatbot_prompt()`

**Code Changes:**
```python
# Before: Limited visibility
context_document = await sync_to_async(extract_text_from_file)(file)
full_prompt = await _build_chatbot_prompt(user_message, history, context_document)

# After: With verification and logging
context_document = await sync_to_async(extract_text_from_file)(file)
logger.debug(f"Extracted {len(context_document)} characters from {filename}")

history = await _get_conversation_history(session_obj)
full_prompt = await _build_chatbot_prompt(user_message, history, context_document=context_document)
logger.debug(f"Built prompt with {len(context_document)} chars of file context for {filename}")
```

---

### 3. **FastAPI Response Parsing**

**Problem:**
- Responses were not being extracted properly from Azure's response format
- Empty responses weren't being detected early enough

**Fixes Applied:**
- Added logic to extract content from Azure `choices[0].message.content` format
- Added validation for empty responses with appropriate error messages
- Improved error logging to show response structure

**Code Changes:**
```python
# Better Azure format handling
ai_response = resp_json.get("response", "")

if not ai_response and "choices" in resp_json:
    choices = resp_json.get("choices", [])
    if choices and len(choices) > 0:
        choice = choices[0]
        if isinstance(choice, dict):
            message = choice.get("message", {})
            if isinstance(message, dict):
                ai_response = message.get("content", "")
```

---

## Files Modified

1. **[apps/chatbot/async_views.py](backend/apps/chatbot/async_views.py)**
   - Enhanced `_save_user_message()` with error handling
   - Enhanced `_save_ai_message()` with error handling
   - Improved `chatbot_file_api_async()` with better logging and error handling
   - Fixed `chatbot_stream_async()` to properly await message saves
   - Enhanced `chatbot_api_async()` with save error handling
   - Added diagnostic endpoints: `get_conversation_history()` and `clear_conversation_history()`

2. **[apps/chatbot/urls.py](backend/apps/chatbot/urls.py)**
   - Added new diagnostic URL paths for conversation history endpoints

---

## Testing the Fixes

### 1. **Test Conversation Saving**

**Using curl:**
```bash
# Send a message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is photosynthesis?"}'

# Check if it was saved
curl -X GET http://localhost:8000/api/chat/history/
```

**Expected Response:**
```json
{
  "session_id": "abc123...",
  "user": "Anonymous",
  "message_count": 2,
  "messages": [
    {
      "id": 1,
      "sender": "user",
      "content": "What is photosynthesis?",
      "created_at": "2026-01-27T10:30:00Z"
    },
    {
      "id": 2,
      "sender": "ai",
      "content": "Photosynthesis is the process...",
      "created_at": "2026-01-27T10:30:05Z"
    }
  ]
}
```

### 2. **Test File Upload with Context**

**Using Python:**
```python
import requests

with open('study_material.pdf', 'rb') as f:
    files = {'file_upload': f}
    data = {'message': 'Summarize this document'}
    
    response = requests.post(
        'http://localhost:8000/api/chat/file/',
        files=files,
        data=data
    )
    
    print(response.json())
```

**Check that context was used:**
```bash
# Retrieve history to verify both user and AI messages were saved
curl -X GET http://localhost:8000/api/history/
```

### 3. **Test Streaming Endpoint**

**Using fetch in browser:**
```javascript
const response = await fetch('http://localhost:8000/api/chat/stream/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'What is machine learning?'})
});

const reader = response.body.getReader();
let accumulated = '';

while (true) {
  const {done, value} = await reader.read();
  if (done) break;
  accumulated += new TextDecoder().decode(value);
  console.log('Streamed so far:', accumulated);
}

// After streaming completes, check history
const historyResp = await fetch('http://localhost:8000/api/history/');
console.log('Saved messages:', historyResp.json());
```

### 4. **Clear History for Fresh Testing**

```bash
curl -X DELETE http://localhost:8000/api/chat/history/clear/
```

**Response:**
```json
{
  "status": "success",
  "deleted_count": 2,
  "session_id": "abc123..."
}
```

---

## Debugging Tips

### 1. **Enable Debug Logging**

Edit `backend/lamla/settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'apps.chatbot': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

Then run Django and watch terminal for debug output:
```bash
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
```

### 2. **Check Database Directly**

```bash
python manage.py dbshell

# List all chat sessions
SELECT id, session_id, user_id FROM chatbot_chatsession;

# List all messages in a session
SELECT * FROM chatbot_chatmessage WHERE session_id = 1 ORDER BY created_at;
```

### 3. **Monitor File Context Passing**

Look for these debug logs in terminal:
```
DEBUG: Extracted 5234 characters from document.pdf
DEBUG: Built prompt with 5234 chars of file context for document.pdf
DEBUG: Saved user message ID 42 to session 3
DEBUG: Saved AI message ID 43 to session 3
```

### 4. **Verify File Extraction**

Test file extraction separately:
```python
from apps.chatbot.file_extractor import extract_text_from_file

with open('test.pdf', 'rb') as f:
    text = extract_text_from_file(f)
    print(f"Extracted {len(text)} characters")
    print(text[:200])
```

---

## Expected Behavior After Fixes

### Conversation Saving
✅ Every user message is saved with timestamp  
✅ Every AI response is saved with timestamp  
✅ Messages persist across page refreshes  
✅ Authenticated users have persistent sessions  
✅ Anonymous users get sessions via Django session key or UUID  

### File Upload Context
✅ File is extracted to text  
✅ Extracted context is included in the prompt sent to FastAPI  
✅ FastAPI receives the full context in the prompt  
✅ AI response is based on file content  
✅ Both user message (with filename) and AI response are saved  

### Error Handling
✅ Missing files return 400 error  
✅ Unsupported file types return 400 error  
✅ File extraction errors are logged with details  
✅ FastAPI errors return 503 with descriptive message  
✅ Database save failures are caught and logged  
✅ All errors are logged with `exc_info=True` for full stack traces  

---

## Configuration Checklist

- [ ] Django running with ASGI server (uvicorn/daphne), not WSGI
- [ ] FastAPI running on port 8001 with FASTAPI_SECRET set
- [ ] Django FASTAPI_BASE_URL points to FastAPI
- [ ] Django FASTAPI_SECRET matches FastAPI's FASTAPI_SECRET
- [ ] PostgreSQL database is running and migrations are applied
- [ ] Django logs are visible in terminal (not redirected)
- [ ] File extraction dependencies installed: `pip install PyPDF2 python-docx python-pptx`

---

## Migration Notes

These fixes are **backward compatible**:
- No database schema changes required
- Old conversation data still works
- Existing endpoints unchanged in signature
- Only adding new diagnostic endpoints

To apply fixes:
1. Pull the updated `async_views.py`
2. Pull the updated `urls.py`
3. No migrations needed
4. Restart Django and FastAPI services
5. Test with diagnostic endpoints
