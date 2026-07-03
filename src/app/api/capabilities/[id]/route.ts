import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const capability = await prisma.capability.findFirst({
    where: {
      id,
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
  });

  if (!capability) return apiError("Capability not found", 404);
  return apiSuccess({ capability });
}
