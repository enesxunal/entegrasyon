import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { statusLabel } from "@/lib/i18n/tr";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const workspaceId = session.workspaceId;

  const [agents, providers, workflows, executions] = await Promise.all([
    prisma.agent.count({ where: { workspaceId } }),
    prisma.provider.count(),
    prisma.workflow.count({ where: { workspaceId, status: "active" } }),
    prisma.execution.findMany({
      where: { workspaceId },
      include: {
        workflow: { select: { name: true } },
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Genel bakış</h1>
      <p className="mb-8 text-slate-600">
        UIP manifestleri, iş akışlarını, agent&apos;ları ve çalıştırma özetlerini
        yönetir. Hassas veriler mümkün olduğunca sizin sunucunuzda kalır.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Agent", value: agents },
          { label: "Servis sağlayıcı", value: providers },
          { label: "Aktif iş akışı", value: workflows },
          { label: "Son çalıştırma", value: executions.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-3">
        <Link
          href="/dashboard/integrate"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Entegrasyona başla
        </Link>
        <Link
          href="/demo/customer-site"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Demo siteyi dene
        </Link>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Son çalıştırmalar</h2>
        </div>
        <div className="divide-y">
          {executions.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Henüz çalıştırma yok.</p>
          ) : (
            executions.map((ex) => (
              <Link
                key={ex.id}
                href={`/dashboard/executions/${ex.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{ex.workflow.name}</p>
                  <p className="text-sm text-slate-500">
                    {ex.agent?.name ?? "Agent yok"} · {formatDate(ex.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                  {statusLabel(ex.status)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
