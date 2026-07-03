import { execSync } from "node:child_process";

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
}

function constructFromParts(direct) {
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

function resolveDatabaseUrls() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      firstEnv(
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL",
        "SUPABASE_DATABASE_URL",
        "SUPABASE_DB_URL"
      ) || constructFromParts(false);
  }

  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL =
      firstEnv("POSTGRES_URL_NON_POOLING", "POSTGRES_URL") ||
      constructFromParts(true);
  }
}

function printEnvDiagnostics() {
  const keys = [
    "DATABASE_URL",
    "DIRECT_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_HOST",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_URL",
  ];
  console.error("Environment diagnostics (set/missing only):");
  for (const key of keys) {
    console.error(`  ${key}: ${process.env[key] ? "set" : "missing"}`);
  }
}

resolveDatabaseUrls();

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("\nERROR: Could not resolve DATABASE_URL and DIRECT_URL.");
  printEnvDiagnostics();
  console.error("\nFix:");
  console.error("1. Vercel → Project → Settings → Integrations");
  console.error("2. Add Supabase → select your Entegrasyon project");
  console.error("3. Redeploy (Production + Preview env must include DB vars)");
  console.error("\nOr manually add DATABASE_URL + DIRECT_URL from Supabase Connect → ORM/Prisma");
  process.exit(1);
}

console.log("DATABASE_URL and DIRECT_URL resolved for Prisma migrate.");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx next build");
