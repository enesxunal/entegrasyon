import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function IntegratePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
  });

  const isProvider = workspace?.billingPlan === "provider";

  if (isProvider) {
    redirect("/dashboard/onboarding");
  }

  const [agent, workflow, providers, anyConnection] = await Promise.all([
    prisma.agent.findFirst({
      where: { workspaceId: session.workspaceId, status: "active" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workflow.findFirst({
      where: { workspaceId: session.workspaceId, status: "active" },
    }),
    prisma.provider.findMany({ orderBy: { name: "asc" }, take: 5 }),
    prisma.connection.findFirst({
      where: { workspaceId: session.workspaceId, status: "active" },
      include: { provider: true },
    }),
  ]);

  const firstProvider = providers[0];
  const connectHref = firstProvider
    ? `/dashboard/providers/${firstProvider.slug}/connect`
    : "/dashboard/onboarding";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://entegrasyon-zeta.vercel.app";
  const zipprMode = process.env.ZIPPR_MODE ?? "mock";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Sitenizi entegre edin</h1>
      <p className="mb-8 text-slate-600">
        Servis sağlayıcıyı bağlayın, agent&apos;ınızı kurun, demo ile test edin.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step
          n={1}
          title={firstProvider ? `${firstProvider.name} bağla` : "Servis ekle (AI)"}
          done={Boolean(anyConnection)}
          href={connectHref}
          label={
            anyConnection
              ? `Bağlandı: ${anyConnection.provider.name} ✓`
              : firstProvider
                ? "API anahtarı ekle"
                : "AI Kurulum ile servis ekle"
          }
        />
        <Step
          n={2}
          title="Agent hazır"
          done={Boolean(agent)}
          href="/dashboard/agents"
          label={agent ? `Agent: ${agent.secretPrefix}...` : "Agent oluştur"}
        />
        <Step
          n={3}
          title="Demo sitede dene"
          done={Boolean(workflow)}
          href="/demo/customer-site"
          label="Demo siteyi aç"
        />
      </div>

      {providers.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Ekosistemde henüz servis yok. Zippr veya başka bir servis sağlayıcı{" "}
          <Link href="/register/provider" className="underline">
            kayıt olup
          </Link>{" "}
          AI Kurulum ile manifest eklemeli — veya siz{" "}
          <Link href="/dashboard/onboarding" className="underline">
            AI Kurulum
          </Link>{" "}
          ile ekleyebilirsiniz.
        </div>
      )}

      <div className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Optimizasyon modu</h2>
        <p className="text-sm text-slate-600">
          Sunucu modu: <strong>{zipprMode === "mock" ? "demo (sahte)" : "gerçek"}</strong>
          {zipprMode === "mock" && (
            <span>
              {" "}
              — demo sahte optimizasyon kullanır. Gerçek API için Vercel&apos;de{" "}
              <code className="text-xs">ZIPPR_MODE=real</code> ayarlayın.
            </span>
          )}
        </p>
      </div>

      {agent && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-2 font-semibold">Agent bilgileriniz</h2>
          <p className="mb-4 text-sm text-slate-600">
            Bunları sunucunuza kurun. Gizli anahtarı asla tarayıcı JavaScript&apos;ine
            koymayın.
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Agent ID</dt>
              <dd className="font-mono">{agent.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Olay adresi (endpoint)</dt>
              <dd className="font-mono break-all">{appUrl}/api/agent/events</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/demo/customer-site"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Demo sitede test et
        </Link>
        <Link
          href="/dashboard/onboarding"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          AI Kurulum
        </Link>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  href,
  label,
}: {
  n: number;
  title: string;
  done: boolean;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            done ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"
          }`}
        >
          {n}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <Link href={href} className="text-sm text-blue-600 hover:underline">
        {label}
      </Link>
    </div>
  );
}
