import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function IntegratePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [agent, workflow, zipprConnection] = await Promise.all([
    prisma.agent.findFirst({
      where: { workspaceId: session.workspaceId, status: "active" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workflow.findFirst({
      where: { workspaceId: session.workspaceId, status: "active" },
    }),
    prisma.connection.findFirst({
      where: {
        workspaceId: session.workspaceId,
        status: "active",
        provider: { slug: "zippr_ink" },
      },
    }),
  ]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://entegrasyon-zeta.vercel.app";
  const zipprMode = process.env.ZIPPR_MODE ?? "mock";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Sitenizi entegre edin</h1>
      <p className="mb-8 text-slate-600">
        3 adımda sitenizi UIP&apos;ye bağlayın. Zippr.ink içine kod kurmanıza gerek
        yok — UIP, sizin API anahtarınızla Zippr&apos;ı çağırır.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step
          n={1}
          title="Zippr.ink bağla"
          done={Boolean(zipprConnection)}
          href="/dashboard/providers/zippr-ink/connect"
          label={zipprConnection ? "Bağlandı ✓" : "API anahtarı ekle"}
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

      <div className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Zippr.ink modu</h2>
        <p className="text-sm text-slate-600">
          Sunucu modu: <strong>{zipprMode === "mock" ? "demo (sahte)" : "gerçek"}</strong>
          {zipprMode === "mock" && (
            <span>
              {" "}
              — demo sahte optimizasyon kullanır. Gerçek Zippr için Vercel&apos;de{" "}
              <code className="text-xs">ZIPPR_MODE=real</code> ayarlayın.
            </span>
          )}
          {zipprMode === "real" && !zipprConnection && (
            <span className="text-amber-700">
              {" "}
              — gerçek mod açık ama bu çalışma alanında henüz API anahtarı yok.
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

      <div className="rounded-xl border bg-slate-900 p-6 text-slate-100">
        <h2 className="mb-2 font-semibold">Sunucu tarafı örneği</h2>
        <p className="mb-4 text-sm text-slate-400">
          Sitenize biri görsel yüklediğinde sunucunuz imzalı bir olay gönderir:
        </p>
        <pre className="overflow-auto rounded bg-slate-800 p-4 text-xs">
{`npm run agent:test -- --image-url="https://siteniz.com/gorsel.jpg"

# POST ${appUrl}/api/agent/events
# Başlıklar: X-Agent-Id, X-Timestamp, X-Nonce, X-Signature
# Gövde: { "event_type": "image.uploaded", ... }`}
        </pre>
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/demo/customer-site"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Demo sitede test et
        </Link>
        <Link
          href="/docs/zippr-integration"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Zippr + UIP dokümantasyonu
        </Link>
        <Link
          href="/docs/guvenlik"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Güvenlik modeli
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
