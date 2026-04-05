# Files And Usage Limits

## Supported Upload Types
Keywords: upload, file, pdf, pptx, docx, txt, document, file types, supported formats, where to upload, file upload button

**Supported file types:**
- **PDF** (.pdf) - Textbooks, notes, research papers, study guides
- **Microsoft Word** (.docx) - Essays, notes, documents
- **Microsoft PowerPoint** (.pptx) - Lecture slides, presentations
- **Plain Text** (.txt) - Simple text notes

**Where to upload files:**
- **Quiz Creator** page (`/quiz/create`) - Look for **File** tab
- **Flashcard Creator** page (`/flashcards/create`) - Look for **File Upload** tab
- **AI Tutor Chat** page (`/ai-tutor`) - Click the file attachment button (folder/clip icon)
- **Materials Library** (`/materials/upload`) - Upload Material page (PDF only for sharing)

**What happens after upload?**
- Text is automatically extracted from your file
- For Quiz/Flashcards: Extracted text is ready for quiz or flashcard generation
- For AI Tutor: You can ask questions about the file content
- For Materials: PDF is shared in the community library for everyone

## YouTube Video Input
Keywords: youtube, video, transcript, youtube url, video quiz, youtube quiz, paste youtube link, youtube tab

You can generate a quiz directly from a YouTube video — no file needed.

**Where to use it:**
- **Quiz Creator** page (`/quiz/create`) → click the **YouTube** tab

**How it works:**
1. Paste a YouTube URL into the input field (e.g. `https://www.youtube.com/watch?v=...`)
2. Click **Load Transcript**
3. The video transcript is automatically fetched and the video appears embedded on the page so you can confirm it's the right one
4. Configure quiz settings and click **Generate Questions**

**Requirements:**
- The video must have captions enabled (auto-generated or manual)
- Supported URL formats: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`

**What if it fails?**
- "Captions are disabled or unavailable" → Try a different video that has captions
- "Could not find a YouTube video ID" → Check the URL format and try again

## File Upload Button Locations
Keywords: where is file upload, upload button location, how to upload, find upload
- Quiz Creator: **File** tab at top of content section
- Flashcard Creator: **File Upload** tab
- AI Tutor: Folder icon button at bottom of chat (next to text input)
- Materials: "Upload Material" button on Materials page

## File Size Limits
Keywords: size limit, file limit, max upload, too large, file too big, maximum file size
To ensure fast processing and system stability, file uploads have size restrictions.

**Maximum file size: 10 MB**

This limit applies to:
- Quiz material uploads
- Flashcard content uploads
- AI Tutor chat file uploads
- Community materials library uploads

**What if my file is too large?**
- Split large documents into smaller sections
- Compress PDF files using PDF tools
- Remove images or unnecessary pages
- Copy and paste text directly instead of uploading

**Error message:**
If you exceed the limit, you'll see: "File too large (max 10MB)"

## Text Length Limits
Keywords: text limit, character limit, too much text, maximum length, long text
Extracted text content has length constraints to ensure efficient AI processing.

**Maximum extracted text: 50,000 characters**

This limit applies after text extraction from uploaded files or YouTube transcripts. It's approximately:
- 8,000-10,000 words
- 15-20 pages of dense text
- Enough for most study materials and chapters

**YouTube transcript note:** Transcripts are internally capped at 16,000 characters before being sent to the AI, regardless of video length. Long videos will only use the first portion.

**Input requirements for features:**

**Quiz generation:**
- Minimum: 30 characters
- Maximum: 50,000 characters
- MCQ questions: 0–30
- Short answer questions: 0–10

**Flashcard generation:**
- Minimum: 30 characters
- Maximum: 50,000 characters
- Custom prompt: max 1,500 characters
- Cards per deck: 1-100 (1-25 per generation)

**Flashcard editing:**
- Question: 1-2,000 characters
- Answer: 1-4,000 characters

**Subject/title fields:**
- Subject: max 255 characters
- Deck title: max 255 characters

## Request Timeouts
Keywords: timeout, slow, taking too long, request timeout, processing time
AI processing requests have timeout limits to prevent system overload.

**Typical timeout scenarios:**
- Very long documents taking too long to process
- High AI provider load causing delays
- Network connectivity issues
- Complex quiz/flashcard generation requests

**What to do if you hit a timeout:**
1. **Retry the request** - Sometimes provider load decreases
2. **Reduce input size** - Use shorter text or fewer questions
3. **Split the task** - Create multiple smaller quizzes instead of one large one
4. **Try again later** - Wait for lower system load

## Model Context Limits
Keywords: context limit, token limit, too much context, model limits, input too long
AI models have maximum context windows for processing text.

**What this means:**
- Very long documents may be truncated
- Chat conversations have limited history retention
- File uploads are processed in manageable chunks

**Best practices:**
- Focus on relevant sections of long documents
- Ask specific questions rather than broad ones
- Break large study materials into topic-based sections
- Use materials library to organize content by chapter/topic

## Rate Limiting
Keywords: rate limit, too many requests, slow down, request limit, throttling
To ensure fair usage and system stability, some endpoints have rate limiting.

**Protected endpoints:**
- Authentication endpoints (login, signup) - Prevents brute-force attacks
- Quiz generation - Prevents abuse and excessive AI usage
- Flashcard generation - Manages AI provider costs

**What happens if rate limited:**
- Temporary cooldown period before next request
- Error message indicating rate limit hit
- Automatic retry typically works after waiting

**Recommendations:**
- Space out generation requests
- Avoid rapid repeated submissions
- Save generated content before creating more

## Best Practices For File Uploads
Keywords: tips, best practices, upload tips, file recommendations, how to get best results

**For best results:**
1. **Keep files under 10MB** - Compress or split if needed
2. **Use clear, well-formatted documents** - Better text extraction
3. **Remove unnecessary pages** - Focus on relevant content
4. **Choose appropriate difficulty** - Match quiz/flashcard settings to content
5. **Test with smaller files first** - Verify format works
6. **Save generated content** - Don't lose work due to errors
7. **For YouTube** - Use videos with manual captions for best transcript quality

## Common Error Messages
Keywords: error, error messages, errors, not working, failed, troubleshooting

**File upload errors:**
- "File too large (max 10MB)" → Your file exceeds size limit
- "Failed to extract text" → File may be image-based PDF or corrupted
- "Unsupported file type" → Use PDF, DOCX, PPTX, or TXT only

**YouTube errors:**
- "Captions are disabled or unavailable" → Try a video with captions enabled
- "Could not find a YouTube video ID" → Check the URL and try again
- "Transcript too short" → Video has very little spoken content

**Content errors:**
- "Please enter at least 30 characters" → Need more text to generate
- "Please load a YouTube transcript first" → Click Load Transcript before generating
- "Text is too long (max 50,000)" → Reduce content length
- "Please select a subject" → Choose from dropdown or enter custom subject

**Generation errors:**
- "Generation failed" → AI service temporarily unavailable, try again
- "Service unavailable" → Backend issue, retry in a moment
- "Quiz service temporarily unavailable" → FastAPI worker is down, retry shortly

## Browser And Device Support
Keywords: browser, device, compatible, mobile, desktop, what browser, which devices

**Supported browsers:**
- Chrome (recommended)
- Firefox
- Safari
- Microsoft Edge
- Mobile browsers

**Supported devices:**
- Desktop computers
- Laptops
- Tablets
- Smartphones

**Best experience:**
- Desktop or laptop for creating quizzes and flashcards (larger forms)
- Any device works well for AI Tutor chat
- Mobile-friendly interface throughout platform — including the YouTube tab

**Having issues?**
- Try a different browser
- Clear browser cache and cookies
- Check your internet connection
- Disable browser extensions temporarily
- Update to latest browser version
