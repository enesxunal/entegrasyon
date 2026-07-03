/**
 * Map Vercel Supabase integration env vars to Prisma names at runtime.
 * Build script does this at build time; API routes need it at runtime too.
 */
export function resolveDbEnv() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      constructFromParts(false) ||
      "";
  }

  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL =
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL ||
      constructFromParts(true) ||
      "";
  }
}

function constructFromParts(direct: boolean): string {
  const host = process.env.POSTGRES_HOST;
  const user =
    process.env.POSTGRES_USER ||
    process.env.POSTGRES_USER_NON_POOLING ||
    process.env.PGUSER;
  const password =
    process.env.POSTGRES_PASSWORD ||
    process.env.POSTGRES_PASSWORD_NON_POOLING ||
    process.env.PGPASSWORD;
  const database =
    process.env.POSTGRES_DATABASE || process.env.PGDATABASE || "postgres";

  if (!host || !user || !password) return "";

  const port = direct
    ? process.env.POSTGRES_PORT || "5432"
    : process.env.POSTGRES_PORT || "6543";

  const params = direct ? "" : "?pgbouncer=true&connection_limit=1";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}${params}`;
}
