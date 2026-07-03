import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const workflow = await prisma.workflow.findFirst({
    where: { id, workspaceId: session.workspaceId },
  });

  if (!workflow) return apiError("Workflow not found", 404);
  return apiSuccess({ workflow });
}
