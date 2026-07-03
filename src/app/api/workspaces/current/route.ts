import { requireSession, isSession, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
  });

  return apiSuccess({
    workspace,
    user: { email: session.email, id: session.userId },
  });
}
