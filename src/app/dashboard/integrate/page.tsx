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
      <h1 className="mb-2 text-2xl font-bold">Integrate your website</h1>
      <p className="mb-8 text-slate-600">
        Connect your site to UIP in 3 steps. No code inside Zippr.ink required —
        UIP calls Zippr API with your key.
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step
          n={1}
          title="Connect Zippr.ink"
          done={Boolean(zipprConnection)}
          href="/dashboard/providers/zippr-ink/connect"
          label={zipprConnection ? "Connected ✓" : "Add API key"}
        />
        <Step
          n={2}
          title="Agent ready"
          done={Boolean(agent)}
          href="/dashboard/agents"
          label={agent ? `Agent: ${agent.secretPrefix}...` : "Create agent"}
        />
        <Step
          n={3}
          title="Test on demo site"
          done={Boolean(workflow)}
          href="/demo/customer-site"
          label="Open demo website"
        />
      </div>

      <div className="mb-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Zippr.ink mode</h2>
        <p className="text-sm text-slate-600">
          Server mode: <strong>{zipprMode}</strong>
          {zipprMode === "mock" && (
            <span>
              {" "}
              — demo uses fake optimization. Set{" "}
              <code className="text-xs">ZIPPR_MODE=real</code> on Vercel for live
              Zippr API.
            </span>
          )}
          {zipprMode === "real" && !zipprConnection && (
            <span className="text-amber-700">
              {" "}
              — real mode active but no API key in this workspace yet.
            </span>
          )}
        </p>
      </div>

      {agent && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-2 font-semibold">Your agent credentials</h2>
          <p className="mb-4 text-sm text-slate-600">
            Install on your server. Never put the secret in browser JavaScript.
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Agent ID</dt>
              <dd className="font-mono">{agent.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Event endpoint</dt>
              <dd className="font-mono break-all">{appUrl}/api/agent/events</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="rounded-xl border bg-slate-900 p-6 text-slate-100">
        <h2 className="mb-2 font-semibold">Server-side example (Node.js)</h2>
        <p className="mb-4 text-sm text-slate-400">
          When a user uploads an image on your site, your server sends a signed
          event:
        </p>
        <pre className="overflow-auto rounded bg-slate-800 p-4 text-xs">
{`npm run agent:test -- --image-url="https://yoursite.com/image.jpg"

# Or use the UIP SDK pattern:
# POST ${appUrl}/api/agent/events
# Headers: X-Agent-Id, X-Timestamp, X-Nonce, X-Signature
# Body: { "event_type": "image.uploaded", ... }`}
        </pre>
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/demo/customer-site"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Test on demo website
        </Link>
        <Link
          href="/docs/zippr-integration"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Zippr + UIP docs
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
