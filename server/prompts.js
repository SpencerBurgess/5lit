const SYSTEM_BASE = `You are a careful quiz builder. You must generate multiple-choice questions that are factual, clear, and unambiguous. Output ONLY valid JSON that matches the provided schema. Do not include any prose before or after the JSON.`;

const USER_BASE = ({ TOPIC, withExplanations }) => `Build a 5-question multiple-choice quiz on the topic: "${TOPIC}".

Constraints:
- Exactly 5 questions, each with exactly 4 options labeled A–D.
- Exactly one correct answer per question.
- Questions must be stand-alone and test key concepts, not trivialities.
- Wording must be clear and age-appropriate for an educated general audience.
- Avoid trick questions, double negatives, and overly niche facts.
- No copyrighted material excerpts.

Return JSON ONLY in this schema:
{
  "topic": "string",
  "questions": [
    {
      "id": "q1",
      "stem": "string",
      "options": [
        {"label": "A", "text": "string"},
        {"label": "B", "text": "string"},
        {"label": "C", "text": "string"},
        {"label": "D", "text": "string"}
      ],
      "correct_label": "A",
      "explanation": "string (omit this field if not asked for explanations)"
    }
  ]
}

If you are unsure about facts, choose neutral, widely accepted content for the topic.
${withExplanations ? '\nAlso include a concise 1–2 sentence "explanation" for each question to justify the correct answer and clarify common misconceptions.\n' : ''}`;

const SYSTEM_WITH_CONTEXT = `You are a quiz generator that uses provided context to improve factual accuracy. Prefer details present in the context; if missing, default to widely accepted facts.`;

const USER_WITH_CONTEXT = ({ TOPIC, CONTEXT }) => `Context for topic "${TOPIC}":
---
${CONTEXT}
---

Now generate the 5-question quiz as specified earlier. Output JSON only.`;

export function buildMessages(topic, withExplanations) {
  return [
    { role: 'system', content: SYSTEM_BASE },
    { role: 'user', content: USER_BASE({ TOPIC: topic, withExplanations }) }
  ];
}

export function buildMessagesWithContext(topic, context) {
  return [
    { role: 'system', content: SYSTEM_WITH_CONTEXT },
    { role: 'user', content: USER_WITH_CONTEXT({ TOPIC: topic, CONTEXT: context }) }
  ];
}