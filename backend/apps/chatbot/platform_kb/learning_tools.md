# Learning Tools

## Quiz Generator
Keywords: quiz, quiz generator, test, exam practice, questions, mcq, multiple choice, short answer, assessment, create quiz, take quiz, quiz mode, quiz page\n\n**Where to find it:**\n- Click **Quiz** in the top navigation menu\n- This takes you to `/quiz/create` (the Quiz Creator page)\n\n**Creating a quiz - step by step:**\n\n1. **At the Quiz Creator page** (`/quiz/create`), you'll see:\n   - Page title: \"Quiz Mode\"\n   - Description: \"Upload your study materials or paste content to create customised quiz questions with AI\"\n\n2. **Select subject:**\n   - Use the dropdown menu labeled \"Subject / Topic\"\n   - Choose from: Mathematics, Computer Science, Engineering, Biology, Chemistry, Physics, English, History, Geography, Economics\n   - Or select \"Other\" to type your own subject\n\n3. **Add your study content** (two options):\n   - **Text Content tab:** Paste or type your study material (30-50,000 characters)\n   - **File Upload tab:** Click to upload PDF, DOCX, PPTX, or TXT files (max 10MB)\n     - After upload, text is automatically extracted and shown\n\n4. **Configure quiz settings:**\n   - **Number of MCQ questions** - Slider or input (max 20)\n   - **Number of Short Answer questions** - Slider or input (max 10)\n   - **Quiz Time** - Set time limit in minutes\n   - **Difficulty Level** - Choose: Beginner, Intermediate, or Exam\n   - **Custom Instructions** - Optional field to guide the AI (max 1,500 chars)\n\n5. **Generate:**\n   - Click the **Generate Quiz** button at the bottom\n   - Loading spinner appears while AI creates questions\n   - You'll be redirected to the quiz play page\n\n**Taking the quiz:**\n- Quiz appears at `/quiz/play` with all your questions\n- Answer each question (MCQ or short answer)\n- Click **Submit Quiz** button when done\n- View results at `/quiz/results` with your score and feedback\n\n**Quiz History:**\n- Access from Dashboard → History tab\n- See all past quizzes with subjects, scores, and dates\n\n**Extra features:**\n- **Clear** button - Resets all form fields\n- Pre-filled content when coming from Materials Library \"Use for Quiz\" button

## Flashcards
Keywords: flashcards, deck, spaced repetition, revision cards, memorization, study mode, active recall, flashcard deck, create flashcards, flashcard page

**Where to find it:**
- Click **Flashcards** in the top navigation menu
- This takes you to `/flashcards` (Flashcard Decks page)

**Flashcard Decks page** (`/flashcards`):
- Shows heading: "Flashcard Decks"
- Displays stats: Number of decks and cards due today
- **Create Deck** button (top right) - Click to make new deck
- Grid of your existing decks showing:
  - Deck title
  - Number of cards
  - How many due today
  - Three buttons: **Study**, **View Deck**, **Delete**

**Creating a new deck:**

1. Click **Create Deck** button
2. You'll go to `/flashcards/create` page
3. Enter your study content:
   - Use **Text Content** tab to paste text
   - Or **File Upload** tab to upload PDF/DOCX/PPTX/TXT
4. Choose:
   - Number of cards (1-25)
   - Difficulty level
   - Optional custom instructions
5. Click **Generate Flashcards**
6. Review generated cards
7. Add deck title and subject
8. Click **Save Deck**

**Viewing a deck:**
- Click **View Deck** on any deck card
- Goes to `/flashcards/deck/:id` page
- See all cards in the deck with questions and answers
- Edit or delete individual cards
- **Study** button to start review session

**Study mode:**
1. Click **Study** button on a deck
2. Goes to `/flashcards/study/:id` page
3. Card shows question side first
4. Click to flip and see answer
5. Rate yourself using buttons:
   - **Again** - Didn't know it (shows sooner)
   - **Hard** - Difficult (moderate interval)
   - **Good** - Got it right (normal interval)
   - **Easy** - Very easy (longest interval)
6. Next card appears automatically
7. Spaced repetition algorithm schedules future reviews

**Managing decks:**
- **Delete** button on deck cards - Removes entire deck
- Edit cards inside View Deck page
- Track "due today" count on main page

## AI Tutor Chat
Keywords: chatbot, ai tutor, assistant, ask question, explanation, help, chat, conversation, ai help, study help, chat interface, chatbot page

**Where to find it:**
- Click **AI Tutor** in the top navigation menu
- Goes to `/ai-tutor` page
- (Also works: `/chat`, `/chatbot`, `/ai`)

**The AI Tutor chat interface:**

**Chat area:**
- Greeting message: "👋 Hello! I'm your AI study assistant..."
- Conversation history scrolls vertically
- User messages appear on right (your messages)
- AI responses appear on left with "AI Tutor" label
- Real-time streaming - AI text appears as it's being generated

**Input area (at bottom):**
- Large text box to type your question
- **File attachment button** (clip/folder icon) - Upload documents
- **Search mode button** (globe/search icon) - Enable web search
- **Send button** (paper plane icon) - Submit your message

**Using the chat:**

1. **Type and send:**
   - Click in the text box
   - Type your question or study topic
   - Press Enter or click Send button (paper plane icon)
   - AI response streams in real-time

2. **Upload and chat about files:**
   - Click the file attachment button (folder icon)
   - Select PDF, DOCX, PPTX, or TXT file (max 10MB)
   - File name appears below text box showing upload
   - Type your question about the file
   - Click Send
   - AI analyzes the document and answers

3. **Enable web search:**
   - Click the search/globe icon button
   - A popup appears with search mode options
   - Select "enabled" to let AI search the web
   - Send your message - AI uses current info from web

**Chat features:**
- **Copy button** - Copy AI responses to clipboard
- **Clear history** - Start fresh conversation
- **Auto-save** - All chats saved automatically
- **No login required** - Guests can chat too
- **Context aware** - AI remembers your conversation

**File display:**
When file is attached, you'll see:
- File name
- File size (in KB or MB)
- Remove button (X) to clear attachment

## Materials Library
Keywords: materials, study materials, pdf, community, shared resources, library, download, upload materials, document library, shared documents, materials page

**Where to find it:**
- Click **Materials** in the top navigation menu
- Goes to `/materials` page

**Materials page layout:**

**Hero section (top):**
- Title: "📚 Study Materials"
- Description: "Community-shared PDFs — download raw files or push any PDF straight into Quiz Mode with one click"
- **Upload Material** button (top right, if logged in)

**Left sidebar:**
- **Search box** - Search materials by title or description
- **Subject filters** - Click subject icons to filter:
  - Mathematics 📐
  - Sciences 🔬
  - Engineering ⚙️
  - Computing 💻
  - Humanities 📖
  - Business 💼
  - Languages 🌍
  - Medicine 🩺
  - Law ⚖️
  - Arts 🎨
  - Other 📄

**Main content area:**
- Grid of material cards showing:
  - PDF icon
  - Material title
  - Description
  - Subject badge (e.g., "Computing")
  - Uploader name
  - Upload date
  - File size
  - Download count
  - Action buttons

**Each material card has buttons:**
- **Download** button - Downloads the PDF file
- **Use for Quiz** button (magic wand icon) - Extracts text and opens Quiz Creator with content pre-filled
- **Delete** button - Only shows if you uploaded it or you're admin

**Uploading materials:**

1. Click **Upload Material** button (top right)
2. Goes to `/materials/upload` page
3. Fill in the form:
   - **Title** - Name of the material
   - **Description** - What's inside
   - **Subject** - Choose category
   - **File** - Select PDF file to upload
4. Click **Upload** button
5. Material is added to library and visible to everyone

**Using materials for quizzes:**
1. Find a material you want to study
2. Click **Use for Quiz** button (magic wand sparkles icon)
3. System extracts text from the PDF
4. Automatically opens Quiz Creator at `/quiz/create`
5. Text is pre-filled in the content area
6. Subject is pre-selected
7. Banner shows: "Content loaded from: [Material Title]"
8. Configure quiz settings and generate

**Managing your uploads:**
- View uploads in Dashboard → Uploads tab
- Delete materials you no longer want shared
- See download counts on your materials

## Dashboard And Progress
Keywords: dashboard, progress, analytics, stats, activity, performance, trends, learning statistics, my progress, study stats, dashboard page, user dashboard

**Where to find it:**
- Click **Dashboard** in the top navigation menu
- Goes to `/dashboard`

**Dashboard layout:**

**Left sidebar navigation:**
- **Dashboard** tab - Overview and stats (default)
- **Past Quizzes** tab - Quiz history
- **Materials** tab - Your uploaded materials
- **Profile** tab - Account settings
- **Logout** button at bottom

**Overview tab** (main dashboard):

**Welcome header:**
- Greeting: "Welcome back, [Your Username] 👋"
- Subtitle: "Here's your study summary"

**Statistics cards** (4 cards in a row):
1. **Total Quizzes** 📖
   - Shows: Number of quizzes you've completed
   
2. **Average Score** 🏆
   - Shows: Your average quiz score percentage
   
3. **Study Streak** 📅
   - Shows: Consecutive days active (e.g., "7d")
   
4. **Flashcard Sets** 📚
   - Shows: Number of flashcard decks you've created

**Quick Actions section:**
Three action cards you can click:
- **Create Quiz** 📖 - "Generate a quiz from your notes" → Goes to `/quiz/create`
- **Flashcards** 📚 - "Create smart flashcard sets" → Goes to `/flashcards`
- **AI Tutor** 🤖 - "Get instant personalised help" → Goes to `/ai-tutor`

**Recent Activity section:**
- Timeline of your latest actions:
  - Quiz completions with scores
  - Flashcard decks created
  - Materials uploaded
- Each item shows:
  - Icon (book for quiz, cards for flashcards, upload for materials)
  - Title/subject
  - Subtitle (score or card count)
  - Date/time

**Past Quizzes tab:**
- List of all quizzes you've taken
- Each shows: Subject, Score percentage, Date completed
- Click to review quiz details

**Materials tab:**
- List of materials you've uploaded
- Same layout as main Materials page
- Quick access to your contributions

**Profile tab:**
- Your account settings and information
- Edit username, profile picture
- View join date, last login
- Manage preferences

**Admin Dashboard** (for admins only):
- Admins see `/admin-dashboard` instead
- Platform-wide statistics:
  - Total users registered
  - Total quizzes across all users
  - Platform average score
  - Total flashcard decks
- Usage trends charts
- Recent activity feed
- User management tools
- Additional tabs:
  - User details
  - Activity monitoring
