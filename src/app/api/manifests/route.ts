import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { z } from "zod";

const manifestSchema = z.object({
  protocol_version: z.string(),
  service: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    category: z.string(),
  }),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const manifests = await prisma.manifest.findMany({
    where: {
      OR: [
        { workspaceId: session.workspaceId },
        { workspaceId: null, providerId: { not: null } },
      ],
    },
    include: {
      provider: true,
      capabilities: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ manifests });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = manifestSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid manifest structure");

  const manifest = await prisma.manifest.create({
    data: {
      workspaceId: session.workspaceId,
      protocolVersion: parsed.data.protocol_version,
      version: "1.0.0",
      status: "active",
      manifestJson: body,
    },
  });

  return apiSuccess({ manifest }, 201);
}
