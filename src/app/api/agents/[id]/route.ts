import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId: session.workspaceId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      secretPrefix: true,
      lastSeenAt: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!agent) return apiError("Agent not found", 404);
  return apiSuccess({ agent });
}
