from .schemas import QuizRequest

_SOURCE_CONTEXT = {
    "youtube": (
        "The study material is a transcript from a YouTube video titled {title!r}. "
        "It may contain spoken-language patterns, filler words, and informal phrasing — "
        "focus on the factual and conceptual content. "
        "Prefer questions about ideas, explanations, and examples discussed in the video."
    ),
    "file": (
        "The study material was extracted from an uploaded document ({title}). "
        "It may contain OCR/PDF artifacts (broken spacing, ligatures, odd symbols) — "
        "infer the intended meaning naturally."
    ),
    "text": (
        "The study material was typed or pasted directly by the student."
    ),
}

def _build_quiz_prompt(payload: QuizRequest) -> str:
    source_type = (payload.source_type or "text").lower()
    title = payload.source_title or ""
    source_note = _SOURCE_CONTEXT.get(source_type, _SOURCE_CONTEXT["text"]).format(title=title)

    return (
        f"You are Lamla AI's Quiz Engine. Generate a quiz based on this study material:\n\n"
        f"{payload.study_text}\n\n"
        f"Subject: {payload.subject}\n"
        f"Difficulty Level: {payload.difficulty}\n"
        f"Source context: {source_note}\n"
        f"Requirements:\n"
        f"- Generate exactly {payload.num_mcq} multiple-choice questions (MCQs)\n"
        f"- Generate exactly {payload.num_short} short-answer questions\n"
        f"- Each MCQ must have 4 options (A, B, C, D)\n"
        f"- Provide clear, concise explanations for each answer\n\n"
        f"Formatting for frontend rendering:\n"
        f"- Keep question, answer, and explanation text plain and markdown-friendly\n"
        f"- Use fenced code blocks for code examples, shell commands, and programming snippets\n"
        f"- Never format code or procedures as markdown tables\n"
        f"- Avoid HTML tags like <br> or <table>; use newline characters instead\n"
        f"- Use LaTeX delimiters for math: $...$ for inline math and $$...$$ for block math\n"
        f"- Use tables only for genuine comparisons, not for steps or code\n\n"
        f"Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):\n"
        "{\n"
        '  "mcq_questions": [\n'
        '    {"question": "Question text here?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "A", "explanation": "Explanation here"},\n'
        '    ...\n'
        '  ],\n'
        '  "short_questions": [\n'
        '    {"question": "Question text here?", "answer": "Correct answer", "explanation": "Explanation here"},\n'
        '    ...\n'
        '  ]\n'
        "}\n\n"
        "IMPORTANT: Return ONLY the JSON object, nothing else. No markdown formatting, no code blocks. "
        "Escape all double quotes inside strings. Ensure the output is valid JSON parseable by json.loads."
    )


def _build_repair_prompt(bad_json_text: str) -> str:
    """Ask the model to output strict JSON only for quiz schema recovery."""
    return (
        "Rewrite the following content as strict valid JSON only. "
        "Return JSON object with exactly these top-level keys: "
        '"mcq_questions" (array), "short_questions" (array). '
        "Each question object must contain: question, options (for MCQ), answer, explanation. "
        "For any code, commands, or examples inside the JSON strings, use fenced markdown code blocks and newline characters, not tables or HTML breaks. "
        "Use LaTeX delimiters for math when needed. Do not include markdown fences or any extra text.\n\n"
        "CONTENT TO FIX:\n"
        f"{bad_json_text}"
    )
