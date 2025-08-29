/**
 * Prompts for quiz generation with a strict JSON-only option,
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

// Additional guardrails for small/local models to reduce non-JSON chatter
// and improve structural reliability. Numbering is generated automatically.
function strictJsonSuffix({
    withExplanations = false
} = {}) {
    const rules = [
        'Return exactly ONE JSON object; no preamble, commentary, or Markdown.',
        'Double-quote all property names and string values.',
        'Do not include trailing commas, comments, or additional fields.',
        'Provide exactly 5 questions; each must include exactly 4 answer options labeled "A", "B", "C", "D".',
        'Assign exactly one "correct_label" value ∈ {"A","B","C","D"} per question.',
        withExplanations ?
        'Include a concise 1–2 sentence "explanation" for each question.' :
        'Do NOT include the "explanation" field.',
        'Do NOT output ellipses ("..." or "…") or placeholders; supply complete values.',
        'Question IDs must be exactly "q1","q2","q3","q4","q5" in that order (unique and stable).',
        'Each stem must be unique and unambiguous; avoid duplicating stems.',
        'Option texts within a question must be distinct and specific (no near-duplicates).',
        'Use clear, neutral language; factuality takes precedence over style.',
        'Before returning, verify the JSON satisfies all OUTPUT RULES listed above (e.g., 1–11).'
    ];

    const numbered = rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
    return `

OUTPUT RULES (MANDATORY):
${numbered}

${SCHEMA_BLOCK}`;
}

const SYSTEM_BASE = `
You are an assessment generator. Produce rigorous, unambiguous multiple-choice questions.
Prioritize factual accuracy and clarity over creativity.
`.trim();

function userBase({
    TOPIC,
    withExplanations = false,
    strictJson = false
}) {
    const contentReqs = [
        'Each question must assess a core concept of the topic; exclude trivial or peripheral facts.',
        'Avoid trick questions, double negatives, and overly niche details.',
        'Use clear, precise language suitable for an educated general audience.',
        'All content must be original and free of copyrighted excerpts.'
    ];
    const numberedContentReqs = contentReqs.map((r, i) => `${i + 1}. ${r}`).join('\n');

    const core = `
Create a 5-question multiple-choice quiz on the topic: "${TOPIC}".

CONTENT REQUIREMENTS (MANDATORY):
${numberedContentReqs}
`.trim();

    const exp = withExplanations ?
        '\nIf explanations are requested, include a concise 1–2 sentence "explanation" justifying the correct answer and clarifying common misconceptions.' :
        '';

    const jsonBlock = strictJson ?
        strictJsonSuffix({
            withExplanations
        }) :
        (`
${SCHEMA_BLOCK}

RULES:
- Output JSON ONLY. No prose, Markdown, or code fences before/after the JSON.
- Do NOT output ellipses ("..." or "…") or placeholders; supply complete values.
`.trim());

    return core + exp + '\n\n' + jsonBlock;
}

const SYSTEM_WITH_CONTEXT = `
You are an assessment generator that uses provided context to improve factual accuracy.
When the context covers a point, prefer it; otherwise default to widely accepted facts.
Do not quote or reproduce long excerpts; write original questions.
`.trim();

function userWithContext({
    TOPIC,
    CONTEXT,
    withExplanations = false,
    strictJson = false
}) {
    const contextUsage = [
        'Use the context solely as grounding for factual accuracy; do not copy long passages verbatim.',
        'Prefer details present in the context when available; otherwise use widely accepted facts.',
        'Do not fabricate citations or facts not supported by the context or common knowledge.',
        'If the context is ambiguous, choose neutral, widely accepted formulations.'
    ];
    const numberedContextUsage = contextUsage.map((r, i) => `${i + 1}. ${r}`).join('\n');

    const header = `
Context for topic "${TOPIC}":
---
${CONTEXT}
---

CONTEXT USAGE RULES (MANDATORY):
${numberedContextUsage}

Using the context above only as factual grounding, produce the quiz specified below.
`.trim();

    const base = userBase({
        TOPIC,
        withExplanations,
        strictJson
    });
    return header + '\n\n' + base;
}

/**
 * Build messages without external context.
 * @param {string} topic
 * @param {boolean} withExplanations
 * @param {{strictJson?: boolean}} opts
 */
export function buildMessages(topic, withExplanations, opts = {}) {
    const {
        strictJson = false
    } = opts;
    return [{
            role: 'system',
            content: SYSTEM_BASE
        },
        {
            role: 'user',
            content: userBase({
                TOPIC: topic,
                withExplanations,
                strictJson
            })
        },
    ];
}

/**
 * Build messages with external (Wikimedia) context.
 * @param {string} topic
 * @param {string} context
 * @param {{withExplanations?: boolean, strictJson?: boolean}} opts
 */
export function buildMessagesWithContext(topic, context, opts = {}) {
    const {
        withExplanations = false, strictJson = false
    } = opts;
    return [{
            role: 'system',
            content: SYSTEM_WITH_CONTEXT
        },
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