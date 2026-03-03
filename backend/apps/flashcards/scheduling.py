from datetime import timedelta
from django.utils import timezone


def update_sm2(card, quality: int):
    """
    quality: 0-5
    """

    if quality < 3:
        card.repetitions = 0
        card.interval = 1
    else:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.ease_factor)

        card.repetitions += 1

    card.ease_factor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    if card.ease_factor < 1.3:
        card.ease_factor = 1.3

    card.due_date = timezone.now() + timedelta(days=card.interval)

    card.save()