# Vercel + Supabase Deploy Guide

Deploy UIP to [Vercel](https://vercel.com) with automatic Supabase database connection.

## 1. Push code to GitHub

Repo: [github.com/enesxunal/entegrasyon](https://github.com/enesxunal/entegrasyon)

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** → select `enesxunal/entegrasyon`
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (first deploy may fail until Supabase is linked — that's OK)

## 3. Connect Supabase (automatic env vars)

1. Vercel project → **Settings** → **Integrations**
2. Add **Supabase** integration
3. Select your **Entegrasyon** Supabase project
4. Vercel automatically adds PostgreSQL env vars such as:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_URL`

## 4. Env vars for Prisma (usually automatic)

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
