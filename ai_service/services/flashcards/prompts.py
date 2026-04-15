DIFFICULTY_PROMPTS = {

    "beginner": """
Create simple flashcards for beginners.

Rules:
- Use simple language
- Short answers
- Focus on definitions and basic understanding
""",

    "intermediate": """
Create moderate difficulty flashcards.

Rules:
- Include conceptual understanding
- Test relationships between ideas
- Medium complexity
""",

    "exam": """
Create exam-level flashcards.

Rules:
- Challenging conceptual questions
- Focus on problem solving and application
- Similar to university exam questions
"""
}

FORMATTING_GUIDELINES = """
Formatting for frontend rendering:
- Keep flashcard questions and answers plain and markdown-friendly
- Use fenced code blocks for code examples, shell commands, and programming snippets
- Never format code or procedures as markdown tables
- Avoid HTML tags like <br> or <table>; use newline characters instead
- Use LaTeX delimiters for math: $...$ for inline math and $$...$$ for block math
- Use tables only for genuine comparisons, not for steps or code
"""