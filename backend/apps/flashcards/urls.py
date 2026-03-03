from django.urls import path

from .extract_text_helper import ajax_extract_text
from .views import (
    generate_flashcards,
    save_flashcard_deck,
    get_decks,
    get_deck_cards,
    review_flashcard,
    explain_flashcard
)

urlpatterns = [

    # Extraction and generation
    path("flashcards/ajax-extract-text/", ajax_extract_text, name="flashcards_extract_text" ),
    path("flashcards/generate/", generate_flashcards,name="flashcards_generate"),

    # Deck management
    path("flashcards/decks/", get_decks,name="flashcards_decks"),
    path("flashcards/decks/<int:deck_id>/", get_deck_cards,name="flashcards_deck_cards"),
    path("flashcards/decks/save/",save_flashcard_deck,name="flashcards_save_deck"),

    # Study system
    path("flashcards/review/",review_flashcard,name="flashcards_review"),

    # AI tutor follow-up
    path("flashcards/explain/",explain_flashcard,name="flashcards_explain"),
]