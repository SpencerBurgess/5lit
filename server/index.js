import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();


import {
    validateQuiz
} from './validator.js';
import {
    buildMessages,
    buildMessagesWithContext
} from './prompts.js';
import {
    fetchWikipediaSummary
} from './retrieval.js';


const app = express();
app.use(cors({
    origin: [/^http:\/\/localhost:\d+$/],
    credentials: true
}));
app.use(express.json({
    limit: '1mb'
}));


const PORT = process.env.PORT || 5050;
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'MOCK').toUpperCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';


app.get('/health', (_req, res) => res.json({
    ok: true,
    provider: LLM_PROVIDER
}));

app.post('/api/generate-quiz', async (req, res) => {
    try {
        const {
            topic = '', withExplanations = false, useRetrieval = false
        } = req.body || {};
        const cleanTopic = String(topic || '').trim();
        if (!cleanTopic) return res.status(400).json({
            error: 'Missing topic'
        });


        // Retrieval (optional)
        const context = useRetrieval ? await fetchWikipediaSummary(cleanTopic) : null;


        // MOCK path
        if (LLM_PROVIDER === 'MOCK') {
            const quiz = mockQuiz(cleanTopic, withExplanations);
            const v = validateQuiz(quiz);
            if (!v.is_valid) return res.status(422).json({
                error: 'Quiz failed validation',
                details: v.errors
            });
            return res.json({
                quiz,
                provider: LLM_PROVIDER,
                usedContext: Boolean(context)
            });
        }


        // Build messages
        const messages = context ?
            buildMessagesWithContext(cleanTopic, context) :
            buildMessages(cleanTopic, withExplanations);


        // Call provider
        let rawText = '';
        if (LLM_PROVIDER === 'OPENAI') {
            if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
            rawText = await callOpenAI(messages, OPENAI_MODEL, OPENAI_API_KEY);
        } else if (LLM_PROVIDER === 'ANTHROPIC') {
            if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
            rawText = await callAnthropic(messages, ANTHROPIC_MODEL, ANTHROPIC_API_KEY);
        } else if (LLM_PROVIDER === 'OLLAMA') {
            rawText = await callOllama(messages, OLLAMA_MODEL, OLLAMA_URL);
        } else {
            const quiz = mockQuiz(cleanTopic, withExplanations);
            const v = validateQuiz(quiz);
            if (!v.is_valid) return res.status(422).json({
                error: 'Quiz failed validation',
                details: v.errors
            });
            return res.json({
                quiz,
                provider: 'MOCK',
                usedContext: Boolean(context)
            });
        }


        // Extract JSON safely
        rawText = (rawText || '').trim();
        const s = rawText.indexOf('{');
        const e = rawText.lastIndexOf('}');
        if (s !== -1 && e !== -1) rawText = rawText.slice(s, e + 1);


        const quiz = JSON.parse(rawText);
        const v = validateQuiz(quiz);
        if (!v.is_valid) return res.status(422).json({
            error: 'Quiz failed validation',
            details: v.errors
        });


        res.json({
            quiz,
            provider: LLM_PROVIDER,
            usedContext: Boolean(context)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message || String(err)
        });
    }
});

// --- LLM callers ---
async function callOpenAI(messages, model, apiKey) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1200
        })
    });
    if (!r.ok) throw new Error(`OpenAI error ${r.status}`);
    const j = await r.json();
    return j.choices?.[0]?.message?.content ?? '';
}


async function callAnthropic(messages, model, apiKey) {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const userContent = messages.filter(m => m.role !== 'system').map(m => m.content).join('\n\n');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model,
            system,
            messages: [{
                role: 'user',
                content: userContent
            }],
            max_tokens: 1200,
            temperature: 0.7
        })
    });
    if (!r.ok) throw new Error(`Anthropic error ${r.status}`);
    const j = await r.json();
    return (j.content || []).map(b => b.text || '').join('');
}

// --- OLLAMA (local) ---
async function callOllama(messages, model, baseUrl) {
    const sys = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const usr = messages.filter(m => m.role !== 'system').map(m => m.content).join('\n\n');
    const prompt = (sys ? `<<SYS>>\n${sys}\n<</SYS>>\n\n` : '') + usr;


    const r = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            prompt,
            options: {
                temperature: 0.6
            }
        })
    });
    if (!r.ok) throw new Error(`Ollama error ${r.status}`);
    const text = await r.text();
    const lines = text.trim().split('\n').map(s => {
        try {
            return JSON.parse(s);
        } catch {
            return {};
        }
    });
    return lines.map(x => x.response || '').join('');
}

// --- MOCK generator ---
function mockQuiz(topic, withExplanations) {
    const q = [{
            id: 'q1',
            stem: `Which statement best describes ${topic}?`,
            options: [{
                    label: 'A',
                    text: `A well-known area; ${topic} has key principles and examples.`
                },
                {
                    label: 'B',
                    text: 'A cuisine style only.'
                },
                {
                    label: 'C',
                    text: 'A meaningless proper noun.'
                },
                {
                    label: 'D',
                    text: 'A random code.'
                }
            ],
            correct_label: 'A'
        },
        {
            id: 'q2',
            stem: `What’s a sensible first step to learn ${topic}?`,
            options: [{
                    label: 'A',
                    text: 'Memorize unrelated facts.'
                },
                {
                    label: 'B',
                    text: 'Skim a reputable overview, then try examples.'
                },
                {
                    label: 'C',
                    text: 'Avoid reading anything.'
                },
                {
                    label: 'D',
                    text: 'Rely on memes.'
                }
            ],
            correct_label: 'B'
        },
        {
            id: 'q3',
            stem: `Which is LEAST helpful for studying ${topic}?`,
            options: [{
                    label: 'A',
                    text: 'Active recall'
                },
                {
                    label: 'B',
                    text: 'Explaining ideas'
                },
                {
                    label: 'C',
                    text: 'Concrete examples'
                },
                {
                    label: 'D',
                    text: 'Ignoring feedback'
                }
            ],
            correct_label: 'D'
        },
        {
            id: 'q4',
            stem: `To evaluate claims about ${topic}, do this:`,
            options: [{
                    label: 'A',
                    text: 'Check multiple respected sources.'
                },
                {
                    label: 'B',
                    text: 'Pick the most viral post.'
                },
                {
                    label: 'C',
                    text: 'Accept the first answer seen.'
                },
                {
                    label: 'D',
                    text: 'Use only outdated references.'
                }
            ],
            correct_label: 'A'
        },
        {
            id: 'q5',
            stem: `A good way to solidify ${topic} understanding is:`,
            options: [{
                    label: 'A',
                    text: 'Do a small project or quiz yourself.'
                },
                {
                    label: 'B',
                    text: 'Never practice.'
                },
                {
                    label: 'C',
                    text: 'Avoid feedback.'
                },
                {
                    label: 'D',
                    text: 'Study unrelated topics.'
                }
            ],
            correct_label: 'A'
        },
    ];
    if (withExplanations) {
        const map = {
            q1: 'A neutral high-level definition is most accurate.',
            q2: 'Overview + examples is an effective start.',
            q3: 'Neglecting feedback undermines learning.',
            q4: 'Cross-checking reduces error risk.',
            q5: 'Active application consolidates knowledge.'
        };
        q.forEach(qq => qq.explanation = map[qq.id]);
    }
    return {
        topic,
        questions: q
    };
}


app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT} (provider=${LLM_PROVIDER})`));