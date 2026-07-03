import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      manifests: {
        include: { capabilities: true },
      },
    },
  });

  if (!provider) return apiError("Provider not found", 404);
  return apiSuccess({ provider });
}
