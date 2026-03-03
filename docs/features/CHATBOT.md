# Chatbot Feature Documentation

## Quick Overview

The AI Chatbot feature provides intelligent tutoring and learning support through conversational AI. Users can:
- **Chat with AI** about any learning topic
- **Upload documents** (PDF, Word, PowerPoint, Text) for analysis
- **Get explanations** of complex concepts
- **Receive personalized feedback** on their learning
- **Save conversations** for future reference
- **Continue conversations** across sessions

## Architecture Overview

### Components

**Frontend Components:**
- `ChatWindow.jsx` - Main chat interface
- `MessageList.jsx` - Conversation history display
- `ChatInput.jsx` - Message input with file upload
- `FileUpload.jsx` - Document upload handler
- `ConversationHistory.jsx` - Saved conversations list

**Backend (Django):**
- `apps/chatbot/models.py` - Conversation, Message models
- `apps/chatbot/serializers.py` - Request/response serialization
- `apps/chatbot/views.py` - API endpoints
- `apps/chatbot/urls.py` - URL routing

**Backend (FastAPI):**
- `fastapi_service/chat_handler.py` - AI response generation
- `fastapi_service/document_processor.py` - Document parsing
- `fastapi_service/content_filter.py` - Safety filtering

### Database Models

**Conversation**
- `id` - Unique identifier
- `user` - ForeignKey to User
- `title` - Auto-generated from first message
- `created_at` - Conversation start time
- `updated_at` - Last message time
- `is_archived` - Archive status

**Message**
- `id` - Unique identifier
- `conversation` - ForeignKey to Conversation
- `role` - 'user' or 'assistant'
- `content` - Message text
- `tokens_used` - LLM tokens consumed
- `created_at` - Message timestamp
- `edited_at` - Last edit time (if edited)

**UploadedDocument**
- `id` - Unique identifier
- `conversation` - ForeignKey to Conversation
- `filename` - Original filename
- `file_type` - MIME type
- `file_size` - Size in bytes
- `extracted_text` - Parsed text content
- `uploaded_at` - Upload timestamp

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/` | Send message and get response |
| GET | `/api/chat/history/` | Get conversation history |
| GET | `/api/chat/conversations/` | List user's conversations |
| GET | `/api/chat/conversation/{id}/` | Get specific conversation |
| POST | `/api/chat/file/` | Upload document for analysis |
| DELETE | `/api/chat/history/clear/` | Clear conversation history |
| POST | `/api/chat/stream/` | Stream response (SSE) |

## LLM Integration

### Supported Providers
- **Azure OpenAI** - Primary (GPT-4 Turbo, GPT-3.5)
- **Google Gemini** - Fallback
- **DeepSeek** - Secondary option
- **Hugging Face** - Open-source option

### Model Selection
```python
# Primary
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=...

# Fallback
GEMINI_API_KEY=...

# Secondary
DEEPSEEK_API_KEY=...

# Open source
HUGGING_FACE_API_TOKEN=...
```

### Context Management
- **System prompt:** Instructs AI to act as educational tutor
- **Conversation history:** Last 10 messages for context
- **Document context:** Injected when analyzing documents
- **Token limit:** 2000 tokens max per response

## File Upload & Processing

### Supported Formats
| Format | Extensions | Max Size |
|--------|-----------|----------|
| PDF | `.pdf` | 10 MB |
| Word | `.docx` | 10 MB |
| PowerPoint | `.pptx` | 10 MB |
| Text | `.txt` | 10 MB |

### Processing Steps
1. **Validate:** Check file type, size, and format
2. **Extract:** Parse text from document
3. **Truncate:** Limit to 50,000 characters
4. **Index:** Store in database for reference
5. **Context:** Include in subsequent AI responses

### Content Safety

**Azure Content Filter:**
- Detects hate speech, violence, sexual content
- Blocks inappropriate requests automatically
- Returns: `[Safety Block] This request was flagged...`
- **Not an error** — user should rephrase

**Backend Filtering:**
- Input validation and sanitization
- Output filtering for appropriate responses
- Rate limiting to prevent abuse

## Conversation Management

### Auto-saving
- Messages saved immediately after creation
- Prevents data loss on network disconnect
- User can edit/delete within 5 minutes

### Persistence
- Conversations continue across sessions
- Full history available for review
- Search across past conversations

### Privacy
- User conversations private by default
- Only user can view/delete own conversations
- Admin can access for moderation (with logging)

## Usage Examples

### Send a Message
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum computing",
    "conversation_id": null
  }'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/chat/file/ \
  -H "Authorization: Bearer TOKEN" \
  -F "file_upload=@document.pdf" \
  -F "message=Summarize this document"
```

### Stream Response
```bash
curl -X POST http://localhost:8000/api/chat/stream/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}'
```

## Feature Access Control

- **Unverified users:** Cannot access chatbot
- **Verified users:** Full access with rate limiting
- **Admin users:** Unrestricted access, can view all conversations

## Performance & Limits

### Rate Limiting
- **Default:** 30 messages per hour per user
- **Premium:** 100 messages per hour
- **Admin:** Unlimited

### Response Time
- **Typical:** 2-5 seconds
- **With document:** 5-10 seconds
- **Timeout:** 30 seconds (returns error)

### Streaming
- Enabled by default for improved UX
- Server-Sent Events (SSE) implementation
- Automatic fallback to polling if SSE unavailable

## Known Issues & Solutions

### Azure Safety Block
**Message:** `[Safety Block] This request was flagged...`

**Cause:** Azure's content filter detected inappropriate content

**Solution:** User should rephrase their question more appropriately

**Example:**
- ❌ "How do I harm someone?"
- ✅ "How do I help someone dealing with conflict?"

### Conversation Not Saving
**Symptom:** Message appears in UI but doesn't save to database

**Fix:**
1. Check Django logs for database errors
2. Verify user is authenticated
3. Check database connectivity
4. Try clearing browser cache

### Document Upload Fails
**Symptom:** File upload returns error

**Checks:**
- Is file size under 10 MB?
- Is file format supported (PDF, docx, pptx, txt)?
- Is FastAPI document processor running?
- Check browser console for upload errors

### AI Response Timeout
**Symptom:** Chat shows "Loading..." indefinitely

**Fix:**
1. Check FastAPI service is running
2. Verify LLM API key in .env
3. Check network connectivity
4. Reload page and try again

## Future Enhancements

- **Real-time collaboration** on documents
- **Voice input/output** for hands-free learning
- **Code execution** for programming help
- **Math equation rendering** for STEM topics
- **Custom knowledge base** for specific domains
- **AI-powered tutoring sessions** with scheduling

## Troubleshooting Checklist

- [ ] User is authenticated (has valid token)
- [ ] User email is verified
- [ ] FastAPI service is running
- [ ] LLM API keys are configured
- [ ] Database connectivity is working
- [ ] Network connectivity is stable
- [ ] Browser cache is cleared
- [ ] Rate limit not exceeded

## See Also
- [QUIZ.md](QUIZ.md) - Quiz feature (complementary)
- [AUTHENTICATION_SETUP.md](../setup-configuration/AUTHENTICATION_SETUP.md) - User verification required
- [ARCHITECTURE.md](../architecture-design/ARCHITECTURE.md) - System architecture
- [AZURE_SAFETY_BLOCK_FIX.md](../bug-fixes/AZURE_SAFETY_BLOCK_FIX.md) - Content filter handling
