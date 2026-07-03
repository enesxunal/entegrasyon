import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { formatDate, statusColor } from "@/lib/utils";
import { statusLabel } from "@/lib/i18n/tr";

type Params = { params: Promise<{ id: string }> };

export default async function ExecutionDetailPage({ params }: Params) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const execution = await prisma.execution.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      workflow: true,
      agent: true,
      steps: { orderBy: { stepIndex: "asc" } },
    },
  });

  if (!execution) notFound();

  return (
    <div>
      <Link
        href="/dashboard/executions"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-800"
      >
        ← Çalıştırmalara dön
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Çalıştırma detayı</h1>
      <p className="mb-8 text-slate-600">Yalnızca özet — hassas veri yok.</p>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">İş akışı</p>
          <p className="font-medium">{execution.workflow.name}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Durum</p>
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColor(execution.status)}`}
          >
            {statusLabel(execution.status)}
          </span>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Agent</p>
          <p className="font-medium">{execution.agent?.name ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Süre</p>
          <p className="font-medium">
            {execution.durationMs != null ? `${execution.durationMs}ms` : "—"}
          </p>
        </div>
      </div>

      {execution.errorMessageSafe && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {execution.errorCode}: {execution.errorMessageSafe}
        </div>
      )}

      <h2 className="mb-4 font-semibold">Adımlar</h2>
      <div className="space-y-3">
        {execution.steps.map((step) => (
          <div key={step.id} className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {step.stepIndex + 1}. {step.stepName}
                </p>
                <p className="text-sm text-slate-500">
                  {step.providerSlug}.{step.capabilityName}
                  {step.durationMs != null && ` · ${step.durationMs}ms`}
                  {step.httpStatus != null && ` · HTTP ${step.httpStatus}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${statusColor(step.status)}`}
              >
                {statusLabel(step.status)}
              </span>
            </div>
            {step.errorMessageSafe && (
              <p className="mt-2 text-sm text-red-600">
                {step.errorCode}: {step.errorMessageSafe}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Başlangıç: {formatDate(execution.startedAt)} · Bitiş:{" "}
        {formatDate(execution.finishedAt)}
      </p>
    </div>
  );
}
