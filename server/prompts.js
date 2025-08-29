/**
 * Prompts for quiz generation with a strict JSON-only option
 * optimized for small/local models (e.g., deepseek-r1:8b via Ollama).
 *
 * Usage (OLLAMA branch recommended):
 *   import { buildMessages, buildMessagesWithContext } from './prompts.js';
 *   const messages = context
 *     ? buildMessagesWithContext(topic, context, { withExplanations, strictJson: true })
 *     : buildMessages(topic, withExplanations, { strictJson: true });
 */

const SCHEMA_BLOCK = `Return ONE JSON object ONLY in this exact shape:
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
      "explanation": "string (omit this field if explanations are not requested)"
    }
  ]
}`;

// Extra guardrails for small/local models.
// Appending this reduces non-JSON chatter and invalid JSON formatting.
function strictJsonSuffix({ withExplanations = false } = {}) {
  const explainLine = withExplanations
    ? '\n- Include a concise 1–2 sentence "explanation" for each question.\n'
    : '\n- Do NOT include the "explanation" field.\n';

  return (
    '\n\n' +
    'OUTPUT RULES (CRITICAL):\n' +
    '- Output ONLY a single JSON object. No prose before/after. No code fences.\n' +
    '- Double-quote ALL property names and string values.\n' +
    '- Use exactly 5 questions and exactly 4 options per question (labels A–D).\n' +
    '- Exactly one correct_label ∈ {"A","B","C","D"} per question.\n' +
    '- No trailing commas. No comments. No additional fields.\n' +
    explainLine +
    '- If uncertain, prefer neutral, widely accepted facts.\n\n' +
    SCHEMA_BLOCK
  );
}

const SYSTEM_BASE = `
You are a careful quiz builder. Generate multiple-choice questions that are factual,
clear, and unambiguous.
`.trim();

function userBase({ TOPIC, withExplanations = false, strictJson = false }) {
  const core = `
Build a 5-question multiple-choice quiz on the topic: "${TOPIC}".

Constraints:
- Exactly 5 questions, each with exactly 4 options labeled A–D.
- Exactly one correct answer per question.
- Questions must be stand-alone and test key concepts (avoid trivialities).
- Wording must be clear and appropriate for an educated general audience.
- Avoid trick questions, double negatives, and overly niche facts.
- No copyrighted material excerpts.
`.trim();

  const exp = withExplanations
    ? '\nAlso include a concise 1–2 sentence "explanation" for each question.'
    : '';

  const jsonBlock = strictJson ? strictJsonSuffix({ withExplanations }) : `

${SCHEMA_BLOCK}

RULE: Output JSON ONLY. No prose or code fences before/after the JSON.`.trim();

  return core + exp + '\n\n' + jsonBlock;
}

const SYSTEM_WITH_CONTEXT = `
You are a quiz generator that uses provided context to improve factual accuracy.
Prefer details present in the context; if missing, default to widely accepted facts.
`.trim();

function userWithContext({ TOPIC, CONTEXT, withExplanations = false, strictJson = false }) {
  const header = `
Context for topic "${TOPIC}":
---
${CONTEXT}
---

Now generate the 5-question quiz as specified below.
`.trim();

  const base = userBase({ TOPIC, withExplanations, strictJson });
  return header + '\n\n' + base;
}

/**
 * Build messages without external context.
 * @param {string} topic
 * @param {boolean} withExplanations
 * @param {{strictJson?: boolean}} opts
 */
export function buildMessages(topic, withExplanations, opts = {}) {
  const { strictJson = false } = opts;
  return [
    { role: 'system', content: SYSTEM_BASE },
    { role: 'user', content: userBase({ TOPIC: topic, withExplanations, strictJson }) },
  ];
}

/**
 * Build messages with external (Wikimedia) context.
 * @param {string} topic
 * @param {string} context
 * @param {{withExplanations?: boolean, strictJson?: boolean}} opts
 */
export function buildMessagesWithContext(topic, context, opts = {}) {
  const { withExplanations = false, strictJson = false } = opts;
  return [
    { role: 'system', content: SYSTEM_WITH_CONTEXT },
    {
      role: 'user',
      content: userWithContext({
        TOPIC: topic,
        CONTEXT: context,
        withExplanations,
        strictJson,
      }),
    },
  ];
}
