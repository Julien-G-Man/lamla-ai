from .schemas import QuizRequest

def _build_quiz_prompt(payload: QuizRequest) -> str:
    return (
        f"You are Lamla AI Tutor. Generate a quiz based on this study material:\n\n"
        f"{payload.study_text}\n\n"
        f"Subject: {payload.subject}\n"
        f"Difficulty Level: {payload.difficulty}\n"
        f"Note: The study text may contain OCR/PDF artifacts (weird symbols, broken spacing, ligatures). Infer intended meaning naturally.\n"
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
        "Do not include markdown fences or any extra text.\n\n"
        "CONTENT TO FIX:\n"
        f"{bad_json_text}"
    )
