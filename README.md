# Universal Integration Platform (UIP)

Connect SaaS services to websites without storing customer data.

UIP is a **control plane + local agent** integration platform. Providers publish manifests and capabilities; customer agents emit events; workflows connect them — with metadata-only logging by default.

## MVP scope

- Dashboard (Next.js)
- Supabase PostgreSQL + Prisma
- Zippr.ink provider (`image.optimize`)
- Basic local agent simulator (`image.uploaded`)
- Workflow: `image.uploaded` → `image.optimize` → `image.replace`
- HMAC-signed agent events
- Encrypted provider API keys

## Tech stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma ORM → Supabase PostgreSQL
- Zod + Ajv (JSON Schema)
- Synchronous workflow executor (queue-ready abstraction)

## Prerequisites

- Node.js 20+
- pnpm
- Supabase project with PostgreSQL

## Environment setup

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

### Supabase database URLs

In Supabase Dashboard → Project Settings → Database:

- **DATABASE_URL** — Connection pooling URI (Transaction mode, port 6543)
- **DIRECT_URL** — Direct connection URI (port 5432)

Prisma uses `DATABASE_URL` for queries and `DIRECT_URL` for migrations.

Example:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

## Install & database

```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `demo@uip.local` / `password123`

## Zippr.ink modes

```env
ZIPPR_MODE=mock   # default — no real API key needed
ZIPPR_MODE=real   # calls live Zippr.ink API
```

## Local agent simulator

1. Create an agent in Dashboard → Agents
2. Copy the one-time secret to `.env`:

```env
AGENT_TEST_ID=your_agent_id
AGENT_TEST_SECRET=your_agent_secret
```

3. Connect Zippr.ink in Dashboard (or use `ZIPPR_MODE=mock`)
4. Run:

```bash
pnpm agent:test --image-url="https://example.com/image.jpg"
```

## Project structure

```text
protocol/          JSON schemas, manifests, examples
prisma/            Database schema + seed
src/
  app/             Next.js pages + API routes
  connectors/      Provider connectors (zippr-ink)
  lib/             Auth, crypto, workflow engine
scripts/           Local agent simulator
```

## API highlights

| Route | Description |
|-------|-------------|
| `POST /api/agent/events` | Signed agent event ingest |
| `GET /api/workflows` | List workflows |
| `POST /api/providers/zippr-ink/connect` | Save Zippr API key |

## Security notes

- Agent secrets shown once; stored as bcrypt hash + encrypted signing key
- Provider API keys encrypted at rest
- No full payloads in execution logs
- Workspace-scoped queries (application-level isolation)

## Docs

- Protocol overview: [/docs/protocol](http://localhost:3000/docs/protocol)
- Roadmap: [ROADMAP.md](./ROADMAP.md)

## Build

```bash
pnpm build
```

## Deploy

Compatible with Vercel/Railway. Set all environment variables from `.env.example` in your hosting provider.
