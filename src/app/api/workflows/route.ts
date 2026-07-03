import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const workflowSchema = z.object({
  name: z.string().min(1),
  trigger_event_name: z.string().min(1),
  steps: z.array(z.record(z.unknown())).min(1),
  status: z.enum(["draft", "active", "disabled"]).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const workflows = await prisma.workflow.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ workflows });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = workflowSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid workflow data");

  const workflow = await prisma.workflow.create({
    data: {
      workspaceId: session.workspaceId,
      name: parsed.data.name,
      triggerEventName: parsed.data.trigger_event_name,
      stepsJson: parsed.data.steps as Prisma.InputJsonValue,
      status: parsed.data.status ?? "draft",
    },
  });

  return apiSuccess({ workflow }, 201);
}
