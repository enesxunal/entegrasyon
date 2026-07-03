import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProvidersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const providers = await prisma.provider.findMany({
    include: {
      manifests: {
        where: { status: "active" },
        take: 1,
        include: { capabilities: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Servis sağlayıcılar</h1>
          <p className="text-slate-600">
            Ekosistemde kayıtlı SaaS servisleri. Yoksa AI Kurulum ile ekleyin.
          </p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + AI ile servis ekle
        </Link>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="font-medium text-slate-800">Henüz servis sağlayıcı yok</p>
          <p className="mt-2 text-sm text-slate-600">
            Zippr gibi servisleri AI Kurulum ile ekosisteme ekleyin. OpenAPI URL&apos;si
            yeterli.
          </p>
          <Link
            href="/dashboard/onboarding"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-2 text-sm text-white"
          >
            AI Kuruluma git
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => {
            const manifest = provider.manifests[0];
            return (
              <div key={provider.id} className="rounded-xl border bg-white p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{provider.name}</h2>
                    <p className="text-sm text-slate-500">
                      {provider.category} · {provider.baseUrl} ·{" "}
                      <code className="text-xs">{provider.slug}</code>
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/providers/${provider.slug}/connect`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Bağlan
                  </Link>
                </div>
                {manifest && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Yetenekler</p>
                    <div className="flex flex-wrap gap-2">
                      {manifest.capabilities.map((cap) => (
                        <span
                          key={cap.id}
                          className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs"
                        >
                          {cap.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
