from rest_framework import serializers


class ContactFormSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=5, max_length=180)
    name = serializers.CharField(min_length=2, max_length=120)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(min_length=10, max_length=5000)


class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
