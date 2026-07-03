import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { RegisterProviderForm } from "@/components/auth/register-provider-form";

export default async function RegisterProviderPage() {
  const session = await getSession();
  if (session) redirect("/dashboard/onboarding");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Servis sağlayıcı kaydı</h1>
        <p className="mb-6 text-sm text-slate-600">
          Zippr, e-fatura veya başka bir SaaS servisi olarak UIP ekosistemine katılın.
          AI agent API&apos;nizi ortak dile çevirecek.
        </p>
        <RegisterProviderForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
