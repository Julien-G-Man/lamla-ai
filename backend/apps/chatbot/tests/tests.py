from django.test import TestCase

from chatbot.platform_retrieval import PlatformKnowledgeRetriever


class PlatformKnowledgeRetrieverTests(TestCase):
    def setUp(self):
        self.retriever = PlatformKnowledgeRetriever()

    def test_keyword_retrieval_for_quiz_query(self):
        context, sources, mode_used = self.retriever.retrieve_context("How does the quiz generator work?")

        self.assertTrue(context)
        self.assertTrue(any("learning_tools.md" in src for src in sources))
        self.assertIn(mode_used, {"keyword", "hybrid", "embeddings", "keyword-fallback"})

    def test_keyword_retrieval_for_account_query(self):
        context, sources, _ = self.retriever.retrieve_context("Can I login with my email?")

        self.assertTrue(context)
        self.assertTrue(any("accounts_and_auth.md" in src for src in sources))
