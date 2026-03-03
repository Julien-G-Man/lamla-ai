# Flashcards Feature Documentation

## Quick Overview

The Flashcards feature allows users to create and study digital flashcard decks. Features include:
- **Create/edit/delete** flashcard decks
- **Add/remove** individual cards with front/back content
- **Study mode** with spaced repetition algorithm
- **Progress tracking** with retention metrics
- **Deck sharing** between users
- **Category organization** for better learning

## Architecture Overview

### Components

**Frontend Components:**
- `FlashcardDeck.jsx` - Deck list and management
- `FlashcardEditor.jsx` - Create/edit cards
- `FlashcardStudy.jsx` - Study mode interface
- `FlashcardStats.jsx` - Progress and retention analytics

**Backend (Django):**
- `apps/flashcards/models.py` - Deck, Card, CardReview models
- `apps/flashcards/serializers.py` - Request/response serialization
- `apps/flashcards/views.py` - API endpoints
- `apps/flashcards/urls.py` - URL routing

### Database Models

**Deck**
- `id` - Unique identifier
- `user` - ForeignKey to User
- `title` - Deck name
- `description` - Deck details
- `category` - Learning category
- `is_public` - Share setting
- `created_at` - Creation timestamp
- `updated_at` - Last modification

**Card**
- `id` - Unique identifier
- `deck` - ForeignKey to Deck
- `front` - Question/prompt side
- `back` - Answer/definition side
- `order` - Card sequence in deck
- `created_at` - Creation timestamp

**CardReview**
- `id` - Unique identifier
- `card` - ForeignKey to Card
- `user` - ForeignKey to User
- `review_date` - When card was reviewed
- `interval` - Days until next review (spaced repetition)
- `ease` - Difficulty factor (1.3-2.5)
- `repetitions` - Times card was reviewed

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/flashcards/decks/` | List user's decks |
| POST | `/api/flashcards/decks/` | Create new deck |
| GET | `/api/flashcards/decks/{id}/` | Get deck details |
| PUT | `/api/flashcards/decks/{id}/` | Update deck |
| DELETE | `/api/flashcards/decks/{id}/` | Delete deck |
| POST | `/api/flashcards/decks/{id}/cards/` | Add card to deck |
| PUT | `/api/flashcards/cards/{id}/` | Update card |
| DELETE | `/api/flashcards/cards/{id}/` | Delete card |
| POST | `/api/flashcards/study/start/` | Start study session |
| POST | `/api/flashcards/review/` | Submit card review |
| GET | `/api/flashcards/stats/` | Get user statistics |

## Spaced Repetition Algorithm

Implements the **SM-2 algorithm** for optimal learning:

1. **Initial Review:** Card shown immediately after creation
2. **Interval Calculation:** Based on user response quality (1-5 scale)
3. **Ease Factor:** Adjusted with each review (formula: EF' = EF + (0.1 − (5−q) × 0.08 × (5−q)))
4. **Next Review:** Scheduled after calculated interval
5. **Repetitions:** Count increases with each successful review

### Difficulty Ratings
- **1:** Complete blackout, wrong response
- **2:** Incorrect, but right direction
- **3:** Difficult, but could recall
- **4:** Easy recall with small hesitation
- **5:** Perfect response in best time

## Study Mode

### Session Flow
```
User starts study
         ↓
Get next card (by spaced repetition)
         ↓
Display front of card
         ↓
User attempts answer (or requests hint)
         ↓
Reveal back of card
         ↓
User rates difficulty (1-5)
         ↓
Calculate next review date
         ↓
Move to next card
         ↓
Repeat until deck complete or user exits
```

### Statistics Tracked
- **Mastered:** Cards with 20+ reviews
- **Learning:** Cards with 5-20 reviews
- **New:** Cards with < 5 reviews
- **Due for review:** Cards past next review date
- **Retention rate:** % of cards correctly recalled

## Feature Access Control

- **Unverified users:** Cannot create/study flashcards
- **Verified users:** Full access to own decks
- **Public decks:** Other users can view but not edit
- **Admin users:** Can view all user decks for moderation

## Usage Examples

### Create a Deck
```bash
curl -X POST http://localhost:8000/api/flashcards/decks/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spanish Vocabulary",
    "description": "Common Spanish words",
    "category": "Languages"
  }'
```

### Add Card to Deck
```bash
curl -X POST http://localhost:8000/api/flashcards/decks/123/cards/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the Spanish word for 'hello'?",
    "back": "Hola"
  }'
```

### Submit Card Review
```bash
curl -X POST http://localhost:8000/api/flashcards/review/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": 456,
    "difficulty": 4
  }'
```

## Performance Considerations

- **Query optimization:** Indexes on deck_id, user_id, review_date
- **Caching:** Store user statistics in Redis for fast access
- **Batch operations:** Load deck cards in single query
- **Pagination:** Study sessions load 10-20 cards at a time

## Integration with Quiz Feature

Flashcards and Quizzes can be **auto-generated** from each other:
- **Quiz → Flashcards:** Create deck from quiz questions and answers
- **Text → Both:** Generate both quiz and flashcards from source material

This is handled via the FastAPI service.

## Future Enhancements

- **Audio pronunciation** for language learning
- **Image cards** with visual content
- **Collaborative decks** with shared editing
- **Mobile app** with offline study mode
- **AI hints** during study sessions
- **Deck templates** for popular subjects

## Troubleshooting

### Deck Not Saving
- Verify user is authenticated
- Check database for deck record
- Review Django logs for errors

### Study Mode Freezing
- Verify FastAPI service is running for spaced repetition calculation
- Clear browser cache
- Check for JavaScript errors in console

### Statistics Not Updating
- Ensure CardReview records are being created
- Check Redis cache if enabled
- Verify interval calculation in SM-2 algorithm

## See Also
- [QUIZ.md](QUIZ.md) - Quiz feature (complementary)
- [AUTHENTICATION_SETUP.md](../setup-configuration/AUTHENTICATION_SETUP.md) - User verification required
- [ARCHITECTURE.md](../architecture-design/ARCHITECTURE.md) - System architecture
