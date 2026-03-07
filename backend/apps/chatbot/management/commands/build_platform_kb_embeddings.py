from django.core.management.base import BaseCommand, CommandError
from apps.chatbot.platform_retrieval import PlatformKnowledgeRetriever


class Command(BaseCommand):
    help = "Build embeddings for chatbot platform_kb markdown files"

    def handle(self, *args, **options):
        retriever = PlatformKnowledgeRetriever()

        try:
            generated, total = retriever.build_embeddings_file()
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        if generated == 0:
            self.stdout.write(self.style.WARNING("No embeddings generated. Check embedding provider keys/config."))
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Generated embeddings for {generated}/{total} chunks at {retriever.embeddings_file}"
            )
        )
