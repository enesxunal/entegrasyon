import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ManifestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const manifests = await prisma.manifest.findMany({
    where: {
      OR: [
        { workspaceId: session.workspaceId },
        { workspaceId: null, providerId: { not: null } },
      ],
    },
    include: {
      provider: true,
      capabilities: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Manifests</h1>
      <p className="mb-8 text-slate-600">
        Service manifests describe provider and agent capabilities, schemas, and
        endpoints.
      </p>

      <div className="space-y-6">
        {manifests.map((manifest) => {
          const json = manifest.manifestJson as {
            service?: { name?: string; id?: string; type?: string };
          };
          return (
            <div key={manifest.id} className="rounded-xl border bg-white p-6">
              <div className="mb-4">
                <h2 className="font-semibold">
                  {json.service?.name ?? "Manifest"}
                </h2>
                <p className="text-sm text-slate-500">
                  {json.service?.id} · v{manifest.version} ·{" "}
                  {manifest.protocolVersion}
                </p>
              </div>
              <p className="mb-2 text-sm font-medium">
                Capabilities ({manifest.capabilities.length})
              </p>
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
                {JSON.stringify(manifest.manifestJson, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
