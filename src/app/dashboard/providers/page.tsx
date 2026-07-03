import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ProvidersPage() {
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
      <h1 className="mb-2 text-2xl font-bold">Providers</h1>
      <p className="mb-8 text-slate-600">
        Providers expose capabilities such as image.optimize, invoice.create,
        shipment.create, or sms.send.
      </p>

      <div className="space-y-4">
        {providers.map((provider) => {
          const manifest = provider.manifests[0];
          return (
            <div key={provider.id} className="rounded-xl border bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{provider.name}</h2>
                  <p className="text-sm text-slate-500">
                    {provider.category} · {provider.baseUrl}
                  </p>
                </div>
                {provider.slug === "zippr_ink" && (
                  <Link
                    href="/dashboard/providers/zippr-ink/connect"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Connect
                  </Link>
                )}
              </div>
              {manifest && (
                <div>
                  <p className="mb-2 text-sm font-medium">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {manifest.capabilities.map((cap) => (
                      <span
                        key={cap.id}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono"
                      >
                        {cap.name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Auth: api_key (bearer)
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
