import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { createAgentRecord } from "@/lib/agents/service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const agents = await prisma.agent.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
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

  return apiSuccess({ agents });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid agent data");

  const { agent, rawSecret } = await createAgentRecord(session.workspaceId, {
    name: parsed.data.name,
    type: parsed.data.type,
  });

  return apiSuccess(
    {
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        secretPrefix: agent.secretPrefix,
        createdAt: agent.createdAt,
      },
      secret: rawSecret,
    },
    201
  );
}
