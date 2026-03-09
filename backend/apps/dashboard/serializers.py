from rest_framework import serializers


class ContactFormSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=5, max_length=180)
    name = serializers.CharField(min_length=2, max_length=120)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(min_length=10, max_length=5000)


class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class QuizFeedbackSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    source = serializers.CharField(max_length=40, required=False, default="quiz_results")
