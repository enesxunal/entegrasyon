import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const manifest = await prisma.manifest.findFirst({
    where: {
      id,
      OR: [
        { workspaceId: session.workspaceId },
        { workspaceId: null },
      ],
    },
    include: {
      provider: true,
      capabilities: true,
    },
  });

  if (!manifest) return apiError("Manifest not found", 404);
  return apiSuccess({ manifest });
}
