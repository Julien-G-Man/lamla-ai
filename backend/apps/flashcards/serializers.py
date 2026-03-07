from rest_framework import serializers


DIFFICULTY_CHOICES = ("beginner", "intermediate", "exam")


class GenerateFlashcardsRequestSerializer(serializers.Serializer):
	subject = serializers.CharField(max_length=255, trim_whitespace=True)
	text = serializers.CharField(min_length=30, max_length=50000, trim_whitespace=True)
	prompt = serializers.CharField(
		required=False,
		allow_blank=True,
		default="",
		max_length=1500,
		trim_whitespace=True,
	)
	num_cards = serializers.IntegerField(min_value=1, max_value=25, default=10)
	difficulty = serializers.ChoiceField(choices=DIFFICULTY_CHOICES, default="intermediate")


class FlashcardPayloadSerializer(serializers.Serializer):
	question = serializers.CharField(min_length=1, max_length=2000, trim_whitespace=True)
	answer = serializers.CharField(min_length=1, max_length=4000, trim_whitespace=True)


class SaveDeckRequestSerializer(serializers.Serializer):
	subject = serializers.CharField(max_length=255, trim_whitespace=True)
	cards = FlashcardPayloadSerializer(many=True, min_length=1, max_length=100)


class ReviewFlashcardRequestSerializer(serializers.Serializer):
	card_id = serializers.IntegerField(min_value=1)
	quality = serializers.IntegerField(min_value=0, max_value=5)


class ExplainFlashcardRequestSerializer(serializers.Serializer):
	card_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
	question = serializers.CharField(min_length=1, max_length=2000, trim_whitespace=True, required=False)
	answer = serializers.CharField(min_length=1, max_length=4000, trim_whitespace=True, required=False)

	def validate(self, data):
		"""Ensure either card_id OR (question AND answer) is provided."""
		has_card_id = data.get("card_id") is not None
		has_qa = data.get("question") and data.get("answer")
		
		if not has_card_id and not has_qa:
			raise serializers.ValidationError(
				"Either card_id or both question and answer must be provided"
			)
		
		return data


class UpdateFlashcardRequestSerializer(serializers.Serializer):
	card_id = serializers.IntegerField(min_value=1)
	question = serializers.CharField(min_length=1, max_length=2000, trim_whitespace=True)
	answer = serializers.CharField(min_length=1, max_length=4000, trim_whitespace=True)
