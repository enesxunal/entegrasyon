import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatDate, statusColor } from "@/lib/utils";

export default async function ExecutionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const executions = await prisma.execution.findMany({
    where: { workspaceId: session.workspaceId },
    include: {
      workflow: { select: { name: true } },
      agent: { select: { name: true } },
      steps: { orderBy: { stepIndex: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Executions</h1>
      <p className="mb-8 text-slate-600">
        Execution logs show metadata only. Full event payloads are not stored by
        default.
      </p>

      <div className="rounded-xl border bg-white divide-y">
        {executions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No executions yet.</p>
        ) : (
          executions.map((ex) => (
            <Link
              key={ex.id}
              href={`/dashboard/executions/${ex.id}`}
              className="block p-5 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ex.workflow.name}</p>
                  <p className="text-sm text-slate-500">
                    {ex.agent?.name ?? "No agent"} · {formatDate(ex.createdAt)}
                    {ex.durationMs != null && ` · ${ex.durationMs}ms`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColor(ex.status)}`}
                >
                  {ex.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
