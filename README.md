# SDE Interview Prep Platform

A full-stack system design interview preparation platform. Practice structured problems step-by-step, draw architecture diagrams with Excalidraw, and receive AI-powered feedback via Google Gemini.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js v5 (GitHub OAuth, JWT strategy)
- **AI:** Google Gemini 2.5 Flash
- **Styling:** Tailwind CSS v4
- **Rich Text:** TipTap with syntax-highlighted code blocks
- **Diagrams:** Excalidraw (full-page whiteboard for architecture design)

## Features

- **15 system design problems** across Easy, Medium, and Hard difficulty
- **5-step guided workflow** per problem: Requirements → Core Entities → API Design → High-Level Design → Deep Dives
- **AI evaluation** at each step with scoring, strengths/weaknesses, and suggestions
- **Excalidraw whiteboard** for the High-Level Design step (full-page with collapsible sidebar)
- **Rich text editor** (TipTap) for Core Entities, API Design, and Deep Dives steps
- **Structured requirements editor** with back-of-envelope calculator (DAU, QPS, storage estimates)
- **46 curated study resources** with topic-based recommendations
- **Knowledge scraper** for importing external content as AI context

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** (local instance or hosted)
- **GitHub OAuth App** — create one at https://github.com/settings/developers
  - Set the callback URL to `http://localhost:3000/api/auth/callback/github`
- **Google Gemini API key** — get one at https://aistudio.google.com/apikey

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url> sde-platform
cd sde-platform
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sde_platform?schema=public"
GEMINI_API_KEY=your_gemini_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

Generate a `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Set up the database

Since the project recently migrated from SQLite to PostgreSQL, you'll need to create a fresh migration baseline:

```bash
# Remove old SQLite migrations
rm -rf prisma/migrations

# Create the initial PostgreSQL migration
npx prisma migrate dev --name init
```

### 4. Seed the database

This populates all 15 problems and 46 study resources:

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home — problem list, recent sessions, recommended resources
│   ├── problems/[slug]/          # Problem detail + start session
│   ├── session/[id]/             # Session workspace (step-by-step interview)
│   ├── sessions/                 # Session history
│   ├── resources/                # Study resource browser
│   ├── knowledge/                # Knowledge entry manager
│   └── api/auth/[...nextauth]/   # Auth API route
├── components/
│   ├── RequirementsEditor.tsx    # Structured FR/NFR editor + back-of-envelope calculator
│   ├── RichTextEditor.tsx        # TipTap rich text editor with code blocks
│   ├── ExcalidrawBoard.tsx       # Excalidraw whiteboard (supports full-page mode)
│   ├── FeedbackPanel.tsx         # AI feedback display (strengths, weaknesses, suggestions)
│   ├── StepIndicator.tsx         # Step progress indicator
│   ├── StepTimer.tsx             # Per-step countdown timer
│   ├── DifficultyBadge.tsx       # Easy/Medium/Hard badge
│   └── RecommendedResources.tsx  # Study resource cards
└── lib/
    ├── ai/
    │   ├── config.ts             # Shared AI config (model, temperature, fallbacks)
    │   ├── gemini.ts             # Gemini API client
    │   ├── parse.ts              # Provider-agnostic AI response parser
    │   ├── prompts.ts            # System prompts + input formatting per step
    │   └── index.ts              # Re-exports
    ├── actions/                  # Server actions (sessions, resources, knowledge, AI eval)
    ├── auth.ts                   # NextAuth config (GitHub provider, Prisma adapter, JWT)
    ├── prisma.ts                 # Prisma client singleton
    ├── scraper.ts                # Web scraper for knowledge entries
    └── types.ts                  # Shared types, step config, constants
prisma/
├── schema.prisma                 # Database schema (PostgreSQL)
└── seed.ts                       # Seed script (problems + study resources)
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed problems and study resources |

## Deployment (Railway)

The project is configured for Railway with `output: "standalone"` in Next.js config.

### 1. Add a PostgreSQL plugin

In your Railway project, click **New → Database → PostgreSQL**.

### 2. Set environment variables

In the service's **Variables** tab:

- `DATABASE_URL` → `${{Postgres.DATABASE_URL}}`
- `NEXTAUTH_URL` → your Railway domain (e.g. `https://your-app.up.railway.app`)
- `NEXTAUTH_SECRET` → a strong random secret
- `GEMINI_API_KEY` → your Gemini key
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` → from your GitHub OAuth app (update callback URL to `https://your-domain/api/auth/callback/github`)

### 3. Configure deploy settings

- **Build command:** `npm run build`
- **Start command:** `npm run db:deploy && npm run start`

### 4. Seed the database (one-time)

After the first successful deploy:

```bash
railway run npm run db:seed
```
