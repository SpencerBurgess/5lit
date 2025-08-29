# 5LIT - AI Quiz Builder (React + Express)

Topic in → **5 multiple-choice questions (A–D)** out → **Submit** → score + answer key.


- Frontend: **Vite + React**
- Backend: **Node + Express**
- Providers: **MOCK**, **OpenAI**, **Anthropic**, **Ollama** (local small models)
- Retrieval: **Wikipedia REST Summary** (Wikimedia) for grounding
- Validation: strict JSON schema check server-side

SPECIAL NOTE: Wiki articles are effectively excluded in MOCK mode


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

Set in server/.env:

LLM_PROVIDER=MOCK (default; no keys)

LLM_PROVIDER=OPENAI + OPENAI_API_KEY=... (optional OPENAI_MODEL=gpt-4o-mini)

LLM_PROVIDER=ANTHROPIC + ANTHROPIC_API_KEY=... (optional ANTHROPIC_MODEL=claude-3-5-sonnet-latest)

LLM_PROVIDER=OLLAMA for local models via Ollama

```

## Ollama quickstart
```

ollama pull mistral # or: qwen2.5:7b-instruct / phi3:mini / llama3.1:8b-instruct
ollama serve # starts http://127.0.0.1:11434
# server/.env
LLM_PROVIDER=OLLAMA
OLLAMA_MODEL=mistral
OLLAMA_URL=http://127.0.0.1:11434

```

### Author: Spencer Burgess