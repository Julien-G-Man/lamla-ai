from .schemas import QuizRequest

def _build_quiz_prompt(payload: QuizRequest) -> str:
    return (
        f"You are Lamla AI Tutor. Generate a quiz based on this study material:\n\n"
        f"{payload.study_text}\n\n"
        f"Subject: {payload.subject}\n"
        f"Difficulty Level: {payload.difficulty}\n"
        f"Requirements:\n"
        f"- Generate exactly {payload.num_mcq} multiple-choice questions (MCQs)\n"
        f"- Generate exactly {payload.num_short} short-answer questions\n"
        f"- Each MCQ must have 4 options (A, B, C, D)\n"
        f"- Provide clear, concise explanations for each answer\n\n"
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
        "IMPORTANT: Return ONLY the JSON object, nothing else. No markdown formatting, no code blocks."
    )
