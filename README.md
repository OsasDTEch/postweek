# PostWeek

Generate a week of LinkedIn posts written in your own voice.

**By [Wisdom](mailto:omonswisdom.ict@gmail.com)**

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| AI Agents | PydanticAI |
| Primary LLM | Ollama Cloud (`gemma4:31b`) |
| Fallback LLM | Groq (`llama-3.3-70b-versatile`) |
| Database | PostgreSQL · SQLAlchemy async · Alembic |
| Auth | JWT (access + refresh) + bcrypt |
| Email | Python `smtplib` · Gmail SMTP |
| Package manager | [uv](https://docs.astral.sh/uv/) |

---

## Setup

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — install with:
  ```powershell
  pip install uv
  # or via winget
  winget install astral-sh.uv
  ```

### 2. Environment variables

```powershell
copy .env.example .env
```

Fill in all values. Key ones before first run:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase project → Settings → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase → Session mode URL (for migrations) |
| `OLLAMA_API_KEY` | [ollama.com](https://ollama.com) cloud account |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `JWT_SECRET_KEY` | Any random string ≥ 32 chars — run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SMTP_USERNAME` / `SMTP_FROM` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password — [generate here](https://myaccount.google.com/apppasswords) |

### 3. Backend

```powershell
cd backend

# Install deps with uv (creates .venv automatically)
uv sync

# Run DB migrations (uses DIRECT_URL — session-mode pooler)
uv run alembic upgrade head

# Start the API server
uv run uvicorn app.main:app --reload --port 8000
```

API docs (dev only): http://localhost:8000/docs

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. All `/api/*` calls proxy to `:8000` automatically.

---

## Auth flow

```
Register → email sent → click verify link → sign in
Forgot password → email sent → click reset link (30 min TTL) → new password → sign in
```

Unverified users can't sign in — the login page shows an inline resend button.

---

## Project structure

```
/
├── .env                   # secrets (gitignored)
├── .env.example           # template
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   │   ├── auth.py    # register, verify, forgot/reset password, login, me
│   │   │   ├── profile.py
│   │   │   ├── style_samples.py
│   │   │   ├── weeks.py
│   │   │   └── posts.py
│   │   ├── agents/        # PydanticAI week + regen agents
│   │   ├── core/
│   │   │   ├── config.py  # all env vars
│   │   │   ├── database.py
│   │   │   ├── deps.py    # get_current_user
│   │   │   ├── email.py   # smtplib Gmail sender
│   │   │   └── security.py
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── schemas/       # Pydantic I/O
│   │   └── main.py
│   ├── alembic/           # migrations
│   ├── prompts/           # versioned prompt templates
│   └── pyproject.toml     # uv / Python deps
└── frontend/
    └── src/
        ├── components/    # PostCard, Navbar, GenerateButton
        ├── context/       # AuthContext
        ├── lib/           # axios client + API helpers
        ├── pages/         # Login, Register, ForgotPassword, ResetPassword,
        │                  # VerifyEmail, Onboarding, Dashboard
        └── types.ts
```

---

## LLM routing

Requests go to **Ollama Cloud** first. If that call fails or times out, the agent
retries automatically with **Groq**. The `model_used` field on each `Week` row
logs which provider served the request — useful for debugging quality differences.

---

*PostWeek by Wisdom · [omonswisdom.ict@gmail.com](mailto:omonswisdom.ict@gmail.com)*
