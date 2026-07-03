import { requireSession, isSession, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: {
      manifests: {
        where: { status: "active" },
        take: 1,
        include: {
          capabilities: true,
        },
      },
      _count: { select: { connections: true } },
    },
  });

  return apiSuccess({ providers });
}
