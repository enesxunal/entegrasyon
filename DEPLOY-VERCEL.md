# Vercel + Supabase Deploy Guide

Deploy UIP to [Vercel](https://vercel.com) with automatic Supabase database connection.

## 1. Push code to GitHub

Repo: [github.com/enesxunal/entegrasyon](https://github.com/enesxunal/entegrasyon)

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** → select `enesxunal/entegrasyon`
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (first deploy may fail until Supabase is linked — that's OK)

## 3. Connect Supabase (required — build fails without this)

The build **needs** database connection env vars. Vercel does NOT add them until Supabase is linked.

### Option A — Vercel Integrations (recommended)

1. Open your Vercel project (not Supabase)
2. **Settings** → **Integrations** (left menu)
3. Search **Supabase** → **Add Integration**
4. Authorize → select Supabase project **Entegrasyon**
5. Enable sync for **Production** and **Preview**
6. Confirm these appear under **Settings → Environment Variables**:
   - `POSTGRES_URL` or `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING` (or `POSTGRES_HOST` + user/password)

### Option B — Manual from Supabase Connect modal

1. Supabase → **Database** → **Connect** (top right)
2. Tab **ORM** → **Prisma**
3. Copy connection strings into Vercel **Environment Variables**:
   - `DATABASE_URL` = pooled / Transaction URL
   - `DIRECT_URL` = direct URL (port 5432)

## 4. Env vars for Prisma (usually automatic after step 3)

If you connected **Supabase** in Vercel Integrations, these are added automatically:

- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

The build script maps them to `DATABASE_URL` and `DIRECT_URL` — **you do not need to copy connection strings manually.**

Still add these manually in Vercel → **Environment Variables**:

| Name | Value |
|------|--------|
| `AUTH_SECRET` | Random long string |
| `SECRET_ENCRYPTION_KEY` | Random long string (32+ chars) |
| `ZIPPR_MODE` | `mock` |
| `SEED_SECRET` | One-time secret for bootstrap (remove after seed) |

Optional after first deploy:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |

## 5. Redeploy

**Deployments** → latest → **Redeploy**

Build runs: `prisma migrate deploy` → creates all tables in Supabase.

## 6. Seed demo data (one time)

After successful deploy, run once from terminal:

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/setup/seed \
  -H "X-Setup-Secret: YOUR_SEED_SECRET"
```

Or use Postman / browser extension.

Response confirms demo user:

- Email: `demo@uip.local`
- Password: `password123`

Remove `SEED_SECRET` from Vercel after seeding.

## 7. Open your app

Visit `https://your-project.vercel.app` → Sign in → Dashboard

## Agent simulator (from your computer)

Update `.env` locally:

```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
AGENT_TEST_ID=...
AGENT_TEST_SECRET=...
```

Then:

```bash
npm run agent:test -- --image-url="https://example.com/image.jpg"
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on migrate | Check `DATABASE_URL` and `DIRECT_URL` are set |
| Login fails | Run seed endpoint once |
| Empty Supabase tables | Redeploy after env vars are set |
