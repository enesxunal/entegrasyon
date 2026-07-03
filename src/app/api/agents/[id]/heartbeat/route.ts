import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId: session.workspaceId },
  });

  if (!agent) return apiError("Agent not found", 404);

  await prisma.agent.update({
    where: { id },
    data: { lastSeenAt: new Date() },
  });

  return apiSuccess({ ok: true, lastSeenAt: new Date().toISOString() });
}
