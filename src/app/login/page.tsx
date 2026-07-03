import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Sign in to UIP</h1>
        <p className="mb-6 text-sm text-slate-600">
          Demo: demo@uip.local / password123 — or{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            register a new site
          </a>
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
