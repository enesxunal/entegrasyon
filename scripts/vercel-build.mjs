import { execSync } from "node:child_process";

function env(name: string, fallback?: string): string | undefined {
  return process.env[name] || fallback;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    env("POSTGRES_PRISMA_URL") || env("POSTGRES_URL") || "";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    env("POSTGRES_URL_NON_POOLING") || env("POSTGRES_URL") || "";
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  console.error("Connect Supabase in Vercel → Settings → Integrations");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error("ERROR: DIRECT_URL is not set.");
  console.error("Connect Supabase in Vercel → Settings → Integrations");
  process.exit(1);
}

console.log("Using DATABASE_URL (pooled) and DIRECT_URL for Prisma migrate...");

const run = (cmd: string) => {
  execSync(cmd, { stdio: "inherit", env: process.env });
};

run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx next build");
