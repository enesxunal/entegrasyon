import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

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
      <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
      <p className="mb-8 text-slate-600">
        UIP manages manifests, workflows, agents, and execution metadata.
        Sensitive business data is processed by your local agent whenever
        possible.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Agents", value: agents },
          { label: "Providers", value: providers },
          { label: "Active Workflows", value: workflows },
          { label: "Recent Executions", value: executions.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Recent Executions</h2>
        </div>
        <div className="divide-y">
          {executions.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No executions yet.</p>
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
                    {ex.agent?.name ?? "No agent"} · {formatDate(ex.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize">
                  {ex.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
