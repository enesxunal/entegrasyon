import { requireSession, isSession, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const executions = await prisma.execution.findMany({
    where: { workspaceId: session.workspaceId },
    include: {
      workflow: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      steps: { orderBy: { stepIndex: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess({ executions });
}
