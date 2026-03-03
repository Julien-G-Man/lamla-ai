from django.db import models
from django.conf import settings
from django.utils import timezone


class Deck(models.Model):
    """
    A collection of flashcards belonging to a user.
    Created after flashcards are generated.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="decks"
    )

    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user}"


class Flashcard(models.Model):
    """
    Individual flashcard inside a deck.
    Uses SM-2 spaced repetition scheduling.
    """

    deck = models.ForeignKey(
        Deck,
        on_delete=models.CASCADE,
        related_name="cards"
    )

    question = models.TextField()
    answer = models.TextField()

    # SM-2 scheduling fields
    repetition = models.IntegerField(default=0)
    interval = models.IntegerField(default=1)
    ease_factor = models.FloatField(default=2.5)

    next_review = models.DateTimeField(default=timezone.now)
    last_review = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Card {self.id} in deck {self.deck_id}"