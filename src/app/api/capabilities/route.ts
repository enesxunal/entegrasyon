import { requireSession, isSession, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const capabilities = await prisma.capability.findMany({
    where: {
      manifest: {
        OR: [
          { workspaceId: session.workspaceId },
          { workspaceId: null },
        ],
      },
    },
    include: {
      manifest: {
        include: { provider: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ capabilities });
}
