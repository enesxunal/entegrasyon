import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const execution = await prisma.execution.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      workflow: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      steps: { orderBy: { stepIndex: "asc" } },
    },
  });

  if (!execution) return apiError("Execution not found", 404);
  return apiSuccess({ execution });
}
