# 5LIT - AI Quiz Builder (React + Express)

Topic in → **5 multiple-choice questions (A–D)** out → **Submit** → score + answer key.


- Frontend: **Vite + React**
- Backend: **Node + Express**
- Providers: **MOCK**, **OpenAI**, **Anthropic**, **Ollama** (local small models)
- Retrieval: **Wikipedia REST Summary** (Wikimedia) for grounding
- Validation: strict JSON schema check server-side

SPECIAL NOTE: Wiki articles are effectively excluded in MOCK mode

## Submission Summary

The system is designed as a modular web application with a React (Vite) frontend and an Express backend. The backend provides a single API that accepts a topic, optionally retrieves a short Wikipedia summary for grounding, constructs a structured prompt, and invokes the chosen AI provider. Responses are parsed and validated against a strict schema (five questions, four options, single correct answer) before being sent to the frontend. The frontend offers a clean interface to generate quizzes, select answers, and view results with clear visual feedback. This separation of concerns ensures scalability, testability, and straightforward integration of new features.

For AI integration, I built a provider abstraction that supports OpenAI, Anthropic, and Ollama (local small models), as well as a MOCK mode for demos. OpenAI and Anthropic deliver strong accuracy and fluency, while Ollama enables cost-effective, private experimentation with downloadable models like Mistral or Qwen. I added Wikipedia retrieval to ground model output in factual context and reduce hallucinations, and enforced validation to guarantee reliable quiz structure. These decisions balance flexibility, cost, and robustness, making the solution suitable for both rapid prototyping and enterprise-ready deployments. My primary testing was performed using Ollama (Using deepseek-r1:8b).


## Quickstart
```bash
# 1) Backend
cd server
npm i
cp .env.example .env # Leave MOCK to see a demo or edit if you want a different provider. EX: set OPENAI/ANTHROPIC/OLLAMA
npm run dev # http://localhost:5050


# 2) Frontend (new terminal)
cd ../web
npm i
npm run dev # http://localhost:5173 (Vite dev)

# 3) Optional, run both server/web concurrently
npm i
npm run dev # http://localhost:5173 (Vite dev)

```

## LLM Providers
```

Set in server/.env.example:

LLM_PROVIDER=MOCK (default; no keys)

LLM_PROVIDER=OPENAI + OPENAI_API_KEY=... (optional OPENAI_MODEL=gpt-4o-mini)

LLM_PROVIDER=ANTHROPIC + ANTHROPIC_API_KEY=... (optional ANTHROPIC_MODEL=claude-3-5-sonnet-latest)

LLM_PROVIDER=OLLAMA for local models via Ollama

```

## Ollama quickstart
```

ollama pull mistral # or: qwen2.5:7b-instruct / phi3:mini / llama3.1:8b-instruct / deepseek-r1:8b
ollama serve # starts http://127.0.0.1:11434
# server/.env
LLM_PROVIDER=OLLAMA
OLLAMA_MODEL=mistral
OLLAMA_URL=http://127.0.0.1:11434

```

### Author: Spencer Burgess