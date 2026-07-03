import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/dashboard", label: "Genel bakış" },
  { href: "/dashboard/integrate", label: "Entegrasyon" },
  { href: "/dashboard/onboarding", label: "AI Kurulum" },
  { href: "/dashboard/agents", label: "Agent'lar" },
  { href: "/dashboard/providers", label: "Servis sağlayıcılar" },
  { href: "/dashboard/manifests", label: "Manifestler" },
  { href: "/dashboard/workflows", label: "İş akışları" },
  { href: "/dashboard/executions", label: "Çalıştırmalar" },
  { href: "/dashboard/settings", label: "Ayarlar" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white p-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            UIP
          </p>
          <h1 className="text-lg font-bold">Kontrol Paneli</h1>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t pt-4">
          <p className="truncate text-xs text-slate-500">{session.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
