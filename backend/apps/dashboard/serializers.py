from rest_framework import serializers


class ContactFormSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(max_length=5000)


class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
