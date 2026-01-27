import logging
import re
import requests
from django.conf import settings
from .models import ChatbotKnowledge, ChatMessage, ChatSession
from .websearch import search_engine, SearchResult
from typing import List
logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        logger.info("Chatbot Service initialized using AIClient")

    def get_lamla_knowledge_base(self):
        """Get all active knowledge base entries about Lamla AI"""
        knowledge_entries = ChatbotKnowledge.objects.filter(is_active=True)
        knowledge_text = ""
        for entry in knowledge_entries:
            knowledge_text += f"Category: {entry.category}\n"
            knowledge_text += f"Question: {entry.question}\n"
            knowledge_text += f"Answer: {entry.answer}\n"
            knowledge_text += f"Keywords: {entry.keywords}\n\n"
        return knowledge_text

    def get_edtech_best_practices(self):
        """Return best practices in educational technology for context"""
        return """
Best Practices in Educational Technology:
1. Student-Centered Learning
    • Adapt to different learning styles (visual, auditory, kinesthetic).
    • Encourage self-paced and personalized learning.
    • Use AI to provide adaptive learning paths.

2. Active Engagement
    • Incorporate interactive elements like quizzes, flashcards, and polls.
    • Use gamification (badges, leaderboards, rewards) to motivate learners.
    • Encourage participation and critical thinking.

3. Feedback and Assessment
    • Provide timely, specific, and actionable feedback.
    • Mix formative (ongoing) and summative (final) assessments.
    • Use AI to generate personalized feedback.

4. Accessibility and Inclusivity
    • Support multiple languages and accessibility features (text-to-speech, captions).
    • Ensure mobile-first and low-bandwidth support.
    • Provide offline or downloadable resources when possible.

5. Data-Driven Insights
    • Track learner progress with dashboards and analytics.
    • Use predictive analytics to identify at-risk learners.
    • Share clear progress reports with learners and educators.

6. Collaboration and Community
    • Enable discussion forums, study groups, or peer-to-peer support.
    • Encourage mentorship and teamwork.
    • Use AI chatbots to answer FAQs and provide 24/7 assistance.

7. Privacy and Ethics
    • Ensure student data is protected and used responsibly.
    • Be transparent about AI limitations and capabilities.
    • Avoid bias and ensure fairness in AI-driven tools.

8. Continuous Improvement
    • Gather user feedback regularly.
    • Iterate features based on student and teacher needs.
    • Stay updated with new EdTech trends.
"""

    def clean_markdown(self, text: str) -> str:
        """Remove markdown symbols and fix indentation for lists."""
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'__(.*?)__', r'\1', text)
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'`([^`]*)`', r'\1', text)
        text = text.replace('*', '').replace('_', '')
        text = re.sub(r'^(\d+)\.\s*', r'    \1. ', text, flags=re.MULTILINE)
        text = re.sub(r'^[-•]\s*', '    • ', text, flags=re.MULTILINE)
        text = re.sub(r'^(\s+)(\d+\.\s+)',
                      lambda m: '    ' * (len(m.group(1)) // 4 + 1) + m.group(2),
                      text, flags=re.MULTILINE)
        text = re.sub(r'^(\s+)[•-]\s+',
                      lambda m: '    ' * (len(m.group(1)) // 4 + 1) + '• ',
                      text, flags=re.MULTILINE)
        text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def _should_perform_search(self, user_message: str, lamla_knowledge: str) -> bool:
        """
        Determines if the query is general and likely needs a web search.
        It checks for general keywords and avoids searching for Lamla-specific questions.
        """
        user_message_lower = user_message.lower()
        
        # Keywords that often indicate a need for a search (general knowledge, current events)
        search_keywords = ['latest', 'who is', 'what is', 'how does', 'news', 'recent', 'explain', 'tell me about']
        
        # Keywords that are highly Lamla-specific (should be answered by KB)
        lamla_keywords = ['lamla', 'tutor', 'platform', 'quiz', 'flashcard', 'dashboard', 'knust']
        
        # Simple heuristic:
        # 1. Check for general search keywords.
        is_general_query = any(keyword in user_message_lower for keyword in search_keywords)
        
        # 2. Check if the question is primarily about Lamla. If so, rely on internal KB.
        is_lamla_specific = any(keyword in user_message_lower for keyword in lamla_keywords)
        
        # Only search if it's a general query AND not predominantly about the platform.
        # This is a very basic check and can be improved with a more advanced intent model.
        return is_general_query and not is_lamla_specific and len(user_message.split()) > 3


    def generate_response(self, user_message: str, conversation_history=None, context_document=None) -> str:
        """
        Generate a chatbot response using AIClient, optionally grounding it with context_document.
        """
        user_log = ChatMessage.objects.create(content=user_message, role='user')
        
        try:
            lamla_knowledge = self.get_lamla_knowledge_base()
            edtech_best_practices = self.get_edtech_best_practices()

            # --- CONTEXT DOCUMENT INTEGRATION START ---
            document_context = ""
            if context_document:
                document_context = f"""
The following text is provided as educational reference material from the user's uploaded document. 
Please refer to this content when answering questions:
{context_document}
"""

            # --- WEB SEARCH INTEGRATION ---
            search_context = ""
            search_results: List[SearchResult] = []
            
            if not context_document and self._should_perform_search(user_message, lamla_knowledge):
                # Only perform search if there is NO document context and the query is deemed general
                search_results = search_engine.search(user_message, num_results=3)
            
            if search_results:
                search_snippets = "\n\n---\n".join([str(res) for res in search_results])
                
                search_context = f"""
INSTRUCTION: Use the following web search snippets to answer the user's question, especially for information outside of the Lamla AI knowledge base. Cite the source title and URL in your response where appropriate.
WEB SEARCH RESULTS:
{search_snippets}
"""
            
            # Base system prompt
            system_prompt = f"""You are Lamla AI Tutor, a friendly and helpful AI assistant for an educational platform. Your name is Lamla AI Tutor, and you can answer questions about the platform and general topics.
{document_context}
{search_context}
Context about Lamla AI:
{lamla_knowledge}

Educational Technology Best Practices:
{edtech_best_practices}

Key Information about Lamla AI:

IMPORTANT RESPONSE GUIDELINES:
1. Be warm, friendly, and encouraging in your tone
2. Use proper formatting for lists with clear indentation and bullet points
3. Structure your responses with clear sections when appropriate
4. Use emojis sparingly but effectively to make responses more engaging
5. Break down complex information into digestible chunks
6. Always introduce yourself as Lamla AI Tutor when appropriate
7. Be helpful, concise, and well-organized
8. When providing step-by-step instructions, use numbered lists with proper indentation
9. When listing features or options, use bullet points with proper indentation
10. Please ensure the response is in plain text format without markdown symbols like bolding or headers.
11. Maintain a clean, readable text structure.
12. Immediately identify the user's language and respond in the same language
13. Follow EdTech Best Practices, but be sincere about your limitations and the features you have

You can also answer general questions and help with various topics. Always maintain a helpful and friendly demeanor."""

            # Add conversation history
            history_text = ""
            if conversation_history:
                for msg in conversation_history[-6:]:
                    role = "User" if msg["message_type"] == "user" else "AI"
                    history_text += f"{role}: {msg['content']}\n"

            full_prompt = f"{system_prompt}\nConversation so far:\n{history_text}\nUser: {user_message}\nAI:"

            # Call AIClient (handles providers + fallbacks)
            fastapi_url = getattr(settings, "FASTAPI_BASE_URL", "http://localhost:8001").rstrip('/') + "/chatbot"
            try:
                resp = requests.post(fastapi_url, json={"prompt": full_prompt, "max_tokens": 400}, timeout=30)
                if resp.status_code != 200:
                    resp_json = resp.json()
                    raw_response = resp_json.get("response", "")
                else:  
                    content = "⚠️ [Safety Block] Request flagged by Azure. Please rephrase."
                    logger.error(f"Content Filter Triggered for Message ID: {user_log.id}")
                    raw_response = "I encountered a safety filter issue. Could you please rephrase your question?"
            except Exception as e:
                content = "Service temporarily unavailable."
                logger.warning("FastAPI call failed: %s", e)
                raw_response = ""

            # Handle dict vs str (simplification from the original snippet, assuming a standardized client)
            if isinstance(raw_response, dict):
                # If it's the full Azure JSON object
                choices = raw_response.get("choices", [])
                content = choices[0].get("message", {}).get("content", "") if choices else str(raw_response)
            else:
                # If it's a direct string from a fallback or error handler
                content = str(raw_response)

            ChatMessage.objects.create(content=content, role='assistant',)
            
            if not content.strip():
                return self.clean_markdown(self._get_fallback_response(user_message))
            
            return self.clean_markdown(content.strip())

        except Exception as e:
            logger.error(f"Error generating chatbot response: {e}")
            return self.clean_markdown(self._get_fallback_response(user_message))

    def _get_fallback_response(self, user_message: str) -> str:
        """Provide fallback responses when AI is not available"""
        # ... (Fallback response logic remains the same)
        user_message_lower = user_message.lower()
        if any(word in user_message_lower for word in ['hello', 'hi', 'hey']):
             return """Hello there! 👋 I'm Lamla AI Tutor, your friendly AI assistant. 

I'm here to help you with:
• Questions about our learning platform
• General topics and inquiries
• Study tips and guidance
• Technical support

What would you like to know today?"""

        elif any(word in user_message_lower for word in ['what', 'how', 'help']):
            return """Hi! I'm Lamla AI Tutor, and I'm here to help! 😊

I can assist you with:
• Platform navigation and features
• Quiz and flashcard creation
• Study material uploads
• General questions and topics
• Technical support

What would you like to learn about?"""

        elif any(word in user_message_lower for word in ['feature', 'quiz', 'flashcard']):
            return """Great question! Lamla AI offers several amazing features to help you study smarter:

📚 Core Features:
    • AI-powered quiz generation from your study materials
    • Interactive flashcard creation
    • Performance tracking and analytics
    • Personalized study insights
    • Multiple file format support (PDF, PPTX, DOCX)
    • Multilingual support

🎯 Study Tools:
    • Custom Quiz creator
    • Exam Analyzer
    • Progress dashboard
    • Feedback system

Would you like me to explain any specific feature in detail?"""

        elif any(word in user_message_lower for word in ['contact', 'support', 'email']):
            return """Need help? I'm here for you! 💪

Contact Information:
    • Email: lamlaaiteam@gmail.com 
    • WhatsApp: +233509341251
    • Our support team is always happy to help
    • Response time: Usually within 24 hours

What we can help with:
    • Technical issues
    • Account questions
    • Feature explanations
    • General inquiries

Feel free to reach out anytime!"""

        elif any(word in user_message_lower for word in ['thank', 'thanks']):
            return """You're very welcome! 😊 I'm so glad I could help you today.

If you have any more questions about:
• Our platform features
• Study tips
• Technical support
• Or anything else

Just ask - I'm here to help!"""

        else:
            return """Thanks for your message! 👋 I'm Lamla AI Tutor, your friendly AI assistant.

I'm here to help with:
• Platform navigation and features
• Study tools and resources
• General questions and topics
• Technical support

What would you like to know about today?"""


# Global instance
chatbot_service = ChatbotService()