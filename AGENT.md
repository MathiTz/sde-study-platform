# AGENT.md — SDE Interview Prep Platform

Context file for OpenCode and AI coding agents. Read this before making changes.

---

## Project Overview

A full-stack system design interview prep platform. Users practice structured 5-step problems (Requirements → Core Entities → API Design → High-Level Design → Deep Dives), receive AI-powered feedback via Google Gemini, and draw architecture diagrams with Excalidraw.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 — GitHub OAuth, JWT strategy |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Styling | Tailwind CSS v4 |
| Rich Text | TipTap v3 with syntax-highlighted code blocks |
| Diagrams | Excalidraw |
| Deployment | Railway (`output: "standalone"`) |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home — RSC, fetches problems via Server Action
│   ├── problems/[slug]/        # Problem detail page
│   ├── session/[id]/           # Session workspace
│   │   ├── page.tsx            # RSC — fetches session, passes props to Client Component
│   │   └── SessionWorkspace.tsx # "use client" — interactive step workspace
│   ├── sessions/               # Session history
│   ├── resources/              # Study resource browser
│   ├── knowledge/              # Knowledge entry manager
│   └── api/auth/[...nextauth]/ # Auth API route (do not add routes here; use Server Actions)
├── components/                 # Shared UI components
│   ├── *.tsx                   # "use client" only when hooks/browser APIs are needed
│   └── sign-in-button.tsx      # Client Component (button with onClick)
└── lib/
    ├── actions/                # Server Actions — all mutations live here
    │   ├── sessions.ts         # Session + step CRUD, AI evaluation trigger
    │   ├── resources.ts        # Study resource queries + dismissals
    │   └── knowledge.ts        # Knowledge entry CRUD + scraper
    ├── ai/
    │   ├── config.ts           # Shared model config, limits, error fallback
    │   ├── gemini.ts           # Gemini API client
    │   ├── provider.ts         # Provider interface (swap AI backends without touching callers)
    │   ├── prompts.ts          # System prompts + per-step input formatters
    │   ├── parse.ts            # AI response parser (provider-agnostic)
    │   └── index.ts            # Re-exports
    ├── auth.ts                 # NextAuth config, getAuthUser(), tryGetAuthUserId()
    ├── prisma.ts               # Prisma singleton
    ├── scraper.ts              # Web scraper for knowledge entries
    ├── types.ts                # Shared types, step constants, serialisers
    └── utils/                  # Pure utility functions (json, html, tags, excalidraw)
prisma/
├── schema.prisma               # PostgreSQL schema
└── seed.ts                     # Seeds 15 problems + 46 study resources
```

---

## JAMstack Pattern

This project follows the **JAMstack** architecture adapted to the Next.js App Router model:

### J — JavaScript (React Server & Client Components)

**Default to Server Components.** Only add `"use client"` when the component requires:
- React hooks (`useState`, `useEffect`, `useCallback`, etc.)
- Browser APIs (`window`, `localStorage`, event listeners)
- Third-party libraries that depend on the DOM (Excalidraw, TipTap)

```tsx
// ✅ RSC — fetch data directly, no client bundle cost
export default async function ProblemsPage() {
  const problems = await getProblems();
  return <ProblemList problems={problems} />;
}

// ✅ Client Component — only when interactivity is required
"use client";
export function FeedbackPanel({ evaluation }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  ...
}
```

**Co-locate page-specific Client Components** with their page rather than in `src/components/`.
Shared, reusable components go in `src/components/`.

### A — APIs (Server Actions)

**All mutations and authenticated data fetches use Server Actions** in `src/lib/actions/`.
Do **not** create new API route handlers under `src/app/api/` for application logic — the only API route is the NextAuth catch-all.

```ts
// src/lib/actions/sessions.ts
"use server";

export async function submitStep(sessionId: string, step: Step, userInput: string) {
  const user = await getAuthUser(); // always authenticate first
  // ... Prisma mutation
}
```

Rules for Server Actions:
1. Always call `getAuthUser()` (throws on unauthenticated) or `tryGetAuthUserId()` (returns null) at the top of any action that touches user data.
2. Never expose raw Prisma errors to the client — let them surface as thrown `Error` instances with user-safe messages.
3. Actions that change navigation state should call `redirect()` from `next/navigation`.

### M — Markup (Static-first Rendering)

Pages are **async React Server Components** that resolve data at request time via Server Actions or direct Prisma calls. There is no client-side data fetching layer (no SWR, no React Query, no `useEffect` + `fetch`).

```ts
// ✅ Correct: RSC fetches data synchronously
export default async function SessionPage({ params }) {
  const { id } = await params;
  const session = await getSession(id);    // Server Action
  if (!session) notFound();
  return <SessionWorkspace ... />;
}

// ❌ Avoid: useEffect data fetching in Client Components
useEffect(() => {
  fetch("/api/sessions").then(...);
}, []);
```

---

## Key Conventions

### TypeScript

- All types live in `src/lib/types.ts` unless tightly scoped to a single file.
- Prefer `interface` for props/domain objects, `type` for unions and aliases.
- Use `as const` for enum-like string literals (see `STEPS`, `SESSION_STATUSES`).
- No `any` — use `unknown` and narrow with type guards if needed.

### Components

- Named exports for all components (`export function MyComponent`), not default exports.
  - Exception: Next.js page/layout files require default exports.
- Props interfaces are defined inline above the component.
- Use Tailwind utility classes directly; avoid creating custom CSS classes.

### Server Actions

- File-level `"use server"` directive at the top of every actions file.
- All actions are `async` functions.
- Auth check is the first operation in every action that touches user-owned data.
- Group actions by domain: `sessions.ts`, `resources.ts`, `knowledge.ts`.

### Database (Prisma)

- All database access goes through the Prisma singleton in `src/lib/prisma.ts`.
- Never import `PrismaClient` directly — always use `import { prisma } from "@/lib/prisma"`.
- Schema changes require a migration: `npx prisma migrate dev --name <description>`.
- JSON columns (e.g. `referenceData`, `aiEvaluation`, `userInput`) are typed as `string` in Prisma and parsed with helpers from `src/lib/utils/json.ts` or `src/lib/types.ts`.

### AI Layer

- All AI calls go through the provider interface in `src/lib/ai/provider.ts` — never call the Gemini SDK directly from actions or components.
- System prompts live in `src/lib/ai/prompts.ts`.
- Shared config (model name, temperature, limits) lives in `src/lib/ai/config.ts`.
- Always wrap AI calls in a try/catch and return `errorFallback()` on failure.

### Path Aliases

Use the `@/` alias for all internal imports (configured in `tsconfig.json`):

```ts
import { prisma } from "@/lib/prisma";
import type { Step } from "@/lib/types";
```

---

## Development Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run db:deploy    # Apply pending Prisma migrations (production)
npm run db:seed      # Seed problems and study resources
npx prisma migrate dev --name <name>   # Create and apply a new migration
npx prisma studio                      # Open Prisma Studio GUI
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgresql://user:password@localhost:5432/sde_platform?schema=public
GEMINI_API_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## Auth Pattern

```ts
// Throw if unauthenticated (use in protected actions)
const user = await getAuthUser();

// Return null if unauthenticated (use in read actions where guests are fine)
const userId = await tryGetAuthUserId();
```

`getAuthUser()` and `tryGetAuthUserId()` are the only two auth helpers — never call `auth()` directly in actions.

---

## Adding a New Feature — Checklist

1. **Data model** — update `prisma/schema.prisma`, run `npx prisma migrate dev --name <name>`.
2. **Types** — add shared types to `src/lib/types.ts`.
3. **Server Actions** — add mutations/queries to the relevant file in `src/lib/actions/`, or create a new domain file with `"use server"`.
4. **Page (RSC)** — create `src/app/<route>/page.tsx` as an `async` default export that calls Server Actions.
5. **Client Components** — add `"use client"` components only for interactive parts; co-locate page-specific ones with the page file.
6. **Seed data** — if the feature adds static data (problems, resources), update `prisma/seed.ts`.
