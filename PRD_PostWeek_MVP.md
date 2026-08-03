# PRD — "PostWeek" (working name)
**Personalised LinkedIn content, a week at a time**

Version: 1.1 (MVP) · Status: Draft · Owner: Omons Wisdom

---

## 1. Problem

Professionals know consistent LinkedIn posting drives visibility and inbound opportunities, but most fail at it for two reasons: the blank-page problem (they don't know what to write) and the voice problem (generic AI tools produce posts that sound like AI, which they're embarrassed to publish). The result is inconsistent posting or none at all.

## 2. Solution

A tool that generates a week of LinkedIn posts (5 drafts) written in the user's own voice, learned from their real past posts. The user reviews, edits, and copy-pastes each post to LinkedIn on the suggested day. No platform APIs, no scheduling, no feed — a personal content engine with a habit loop.

## 3. Goals & non-goals

**Goals (MVP)**
- A user can go from sign-up to 5 usable drafts in under 10 minutes
- Output quality clears the bar of "I would publish this under my name"
- The app tracks which drafts users actually copy (proxy for publish rate)
- A working free → paid conversion path exists from day one

**Non-goals (explicitly out of scope for MVP)**
- Auto-posting or scheduling via LinkedIn API
- X/Twitter and Instagram support (see §10, Future scope)
- Analytics dashboards, engagement tracking
- Image/carousel generation
- Team or agency accounts
- Any social/community features between users

## 4. Target user

Primary hypothesis: solo professionals with a direct financial incentive to be visible — freelancers, consultants, indie founders. To be validated post-launch by observing which segment actually copies and publishes drafts (see §8, Metrics). The MVP is built audience-generic; positioning is narrowed after 10–15 real users have run at least two weeks.

## 5. User stories

1. As a new user, I can sign up with email and password and log in securely.
2. As a new user, I can describe myself (role, audience, topics, what I want to be known for) in a short guided form.
3. As a new user, I can paste 2–3 of my past LinkedIn posts so generated content matches my voice.
4. As a user with no past posts, I can pick a tone preset instead (casual / professional / contrarian / storyteller).
5. As a user, I can click one button and get 5 drafts for the coming week, each tagged with a content pillar and a suggested day.
6. As a user, I can edit any draft inline.
7. As a user, I can regenerate a draft, optionally with a steering note ("make it shorter", "more personal").
8. As a user, I can hit "Copy & mark done" — the post copies to clipboard and is marked as used.
9. As a user, I can generate a fresh week when the current one is done (paid) or upgrade when I hit the free limit.
10. As a user, I can edit my profile and style samples at any time.

## 6. Functional requirements

### 6.1 Auth
- Email + password registration and login.
- JWT-based sessions (access token + refresh token).
- Password hashing with bcrypt.
- Magic link login is a nice-to-have, not MVP.

### 6.2 Onboarding
- Step 1 — About you: name, role/title, what you do or sell, target audience, 3–5 credible topics, "one thing you want to be known for". All fields short free-text.
- Step 2 — Voice: paste 1–3 past LinkedIn posts (textarea, one per entry). If skipped, show tone preset picker. Past posts are the preferred path; UI should nudge toward it.

### 6.3 Generation
- Single "Generate my week" action producing exactly 5 posts.
- Each post is generated against a pillar: personal story, opinion/contrarian, how-to/tips, engagement question, behind-the-scenes. Angles within pillars are rotated weekly so consecutive weeks don't repeat structure.
- The PydanticAI agent returns a validated, type-safe structured response: `list[PostDraft]` where each `PostDraft` has `pillar`, `suggested_day`, and `body`.
- Prompt includes: identity block (profile fields), style block (past posts as few-shot examples with explicit voice-matching instructions), pillar brief, and anti-AI-tell rules (banned phrases, forced specificity, formatting matched to the user's samples).
- Generation failures retry once automatically (handled at the agent layer), then surface a friendly error with a retry button. Partial results are never shown.

### 6.4 Week view (core screen)
- 5 draft cards in suggested-day order (Mon–Fri).
- Per card: inline edit, regenerate (with optional steering note), "Copy & mark done".
- Card states: draft → edited → copied. Copied cards show a checkmark and timestamp.
- "Generate next week" appears when ≥3 cards are copied or the week has passed.

### 6.5 Limits & billing
- Free tier: 1 generated week total, 3 regenerations.
- Paid tier (single plan, monthly): unlimited weeks, unlimited regenerations. Indicative price point $9–15/mo; test with early users.
- Payment: Stripe (add Razorpay if targeting India-first users).
- Regeneration caps enforced server-side.

### 6.6 Accounts & settings
- Email + password auth (magic link optional, nice-to-have).
- Profile edit re-uses onboarding forms.
- Delete account removes all stored posts and samples.

## 7. Technical specification

### 7.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Lives in `/frontend` |
| Backend | Python 3.11+ · FastAPI | Lives in `/backend` |
| AI / Agents | PydanticAI | Structured, type-safe agent responses; wraps model calls |
| Primary LLM | Ollama Cloud | e.g. `llama3.3:70b` or similar; fast datacenter-hosted inference |
| Fallback LLM | Groq API | Activates if Ollama Cloud call fails or times out; same model family |
| Auth | JWT (access + refresh tokens) | bcrypt password hashing |
| Database | PostgreSQL | via SQLAlchemy async ORM |
| Payments | Stripe | Razorpay as optional India add-on |

### 7.2 LLM routing

The PydanticAI agent is configured with two model options:

1. **Primary — Ollama Cloud**: uses Ollama's cloud inference API (preview). Fast, datacenter-grade, no local hardware needed.
2. **Fallback — Groq**: if the Ollama Cloud call raises an exception or exceeds a timeout threshold, the agent automatically retries the same prompt against the Groq API.

Routing logic lives in the backend agent layer — the frontend and API routes are unaware of which model served the request. Each `week` row stores `model_used` and `prompt_version` for quality comparison over time.

### 7.3 PydanticAI agent design

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class PostDraft(BaseModel):
    pillar: str
    suggested_day: str  # "Monday" … "Friday"
    body: str

class WeeklyPosts(BaseModel):
    posts: list[PostDraft]

# Agent is initialised once at startup with the primary model;
# fallback model is tried inside a try/except wrapper.
week_agent = Agent(
    model="ollama-cloud:llama3.3",   # primary
    result_type=WeeklyPosts,
    system_prompt="...",             # loaded from versioned prompt template
)
```

Single-post regeneration uses a separate lightweight `regen_agent` that takes the original post body + optional steering note and returns a single validated `PostDraft`.

### 7.4 Data model

```
users           id, email, hashed_password, created_at, plan (free|paid)
profiles        id, user_id (FK), name, role, offering, audience, topics, known_for
style_samples   id, user_id (FK), content, created_at
weeks           id, user_id (FK), created_at, prompt_version, model_used
posts           id, week_id (FK), pillar, body, edited_body, suggested_day,
                status (draft|edited|copied), copied_at
```

### 7.5 API routes (FastAPI)

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh

GET    /profile
PUT    /profile

GET    /style-samples
POST   /style-samples
DELETE /style-samples/{id}

POST   /weeks/generate          # triggers PydanticAI agent
GET    /weeks/{id}
GET    /weeks/latest

PATCH  /posts/{id}              # inline edits
POST   /posts/{id}/regenerate   # single-post regen with optional steering note
POST   /posts/{id}/copy         # marks copied_at, status = copied

GET    /billing/status
POST   /billing/checkout
POST   /billing/webhook         # Stripe webhook
```

### 7.6 Project structure

```
/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/         # API client, auth helpers
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── backend/
    ├── app/
    │   ├── api/
    │   │   ├── auth.py
    │   │   ├── profile.py
    │   │   ├── weeks.py
    │   │   ├── posts.py
    │   │   └── billing.py
    │   ├── agents/
    │   │   ├── week_agent.py      # PydanticAI week-generation agent
    │   │   └── regen_agent.py     # PydanticAI single-post regen agent
    │   ├── models/                # SQLAlchemy ORM models
    │   ├── schemas/               # Pydantic request/response schemas
    │   ├── core/
    │   │   ├── config.py          # env vars (OLLAMA_API_KEY, GROQ_API_KEY, etc.)
    │   │   ├── security.py        # JWT + bcrypt helpers
    │   │   └── database.py        # async DB session
    │   └── main.py
    ├── prompts/                   # versioned prompt templates (v1.txt, v2.txt …)
    ├── requirements.txt
    └── .env.example
```

### 7.7 Cost & reliability

- Ollama Cloud is primary; Groq fallback keeps p99 latency acceptable when Ollama Cloud has hiccups.
- Server-side caps enforce regeneration limits for free-tier users.
- Generation jobs should be async (FastAPI `BackgroundTasks` or a simple task queue) so slow LLM responses don't block the HTTP response.
- Store `prompt_version` on each `week` row so output quality can be compared across prompt iterations.

## 8. Metrics

- **Activation:** % of sign-ups who complete onboarding and generate a week.
- **Quality proxy (north star):** copy rate = copied posts ÷ generated posts. Target ≥ 60% after prompt tuning.
- **Retention:** % of users generating a second week.
- **Conversion:** free → paid %.
- Segment all of the above by user role (from profile) to identify the real ICP.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Output sounds like AI; users won't publish it | Prompt-first build: iterate in a playground with real profiles before any UI. Copy rate metric catches regressions. |
| Users have no past posts (cold start) | Tone presets + first-week feedback loop: edited drafts become future style samples. |
| Regen abuse drives LLM cost | Server-side caps, single-plan pricing that covers heavy use. |
| Week 2 feels identical to week 1 | Angle rotation within pillars; inject "topics covered last week" into the prompt as an avoid-list. |
| LinkedIn policy sensitivity | Copy-paste model means the user publishes manually — no automation, no ToS exposure. |
| Ollama Cloud outage | Groq fallback is automatic; users never see a cold failure. |
| PydanticAI schema mismatch | Structured output validation catches malformed LLM responses at the agent layer before they reach the DB. |

## 10. Future scope — X and Instagram

The engine (identity + voice + pillars) is platform-agnostic; only the **output format layer** changes. Incorporate additional platforms as format profiles, not separate products:

**Phase 2 — X/Twitter.** Same generation flow with an X format profile: 280-char constraint, hook-first writing, optional thread mode. A "repurpose" action converts an existing LinkedIn draft into a tweet/thread.

**Phase 3 — Instagram.** Caption + hook generation with a hashtag block and a suggested visual concept per post (text only — no image generation in this phase).

**Architecture note:** `posts` already has a `platform` column placeholder; format rules live in per-platform prompt partials from day one.

## 11. Open questions

- Pricing point and whether a 7-day paid trial beats a hard free limit.
- Whether "suggested day" should include weekends (LinkedIn engagement data says weekdays; keep Mon–Fri for MVP).
- Exact Ollama Cloud model to default to (llama3.3:70b vs a smaller/faster variant) — decide after latency testing.
- Working name — "PostWeek" is a placeholder.
