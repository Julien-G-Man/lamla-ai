from django.urls import path

from .extract_text_helper import ajax_extract_text
from .views import (
    generate_flashcards,
    save_flashcard_deck,
    get_decks,
    get_flashcards_history,
    get_deck_cards,
    review_flashcard,
    explain_flashcard,
    update_flashcard,
    delete_flashcard,
)

urlpatterns = [

    # Extraction and generation
    path("flashcards/ajax-extract-text/", ajax_extract_text, name="flashcards_extract_text" ),
    path("flashcards/generate/", generate_flashcards,name="flashcards_generate"),

    # Deck management
    path("flashcards/decks/", get_decks,name="flashcards_decks"),
    path("flashcards/history/", get_flashcards_history, name="flashcards_history"),
    path("flashcards/decks/<int:deck_id>/", get_deck_cards,name="flashcards_deck_cards"),
    path("flashcards/decks/save/",save_flashcard_deck,name="flashcards_save_deck"),
    # Aliases matching simplified docs
    path("flashcards/deck/<int:deck_id>/", get_deck_cards, name="flashcards_deck_cards_alias"),
    path("flashcards/save/", save_flashcard_deck, name="flashcards_save_deck_alias"),

    # Study system
    path("flashcards/review/",review_flashcard,name="flashcards_review"),

    # AI tutor follow-up
    path("flashcards/explain/",explain_flashcard,name="flashcards_explain"),

    # Card management
    path("flashcards/cards/update/", update_flashcard, name="flashcards_update_card"),
    path("flashcards/cards/<int:card_id>/delete/", delete_flashcard, name="flashcards_delete_card"),
]
