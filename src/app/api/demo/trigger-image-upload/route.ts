import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import {
  getDefaultWebsiteAgent,
  triggerImageUploadedEvent,
} from "@/lib/agents/trigger-event";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  image_url: z.string().url(),
  agent_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid image URL");
  }

  let agentId = parsed.data.agent_id;
  if (agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, workspaceId: session.workspaceId },
    });
    if (!agent) return apiError("Agent not found", 404);
  } else {
    const agent = await getDefaultWebsiteAgent(session.workspaceId);
    if (!agent) return apiError("No active agent in workspace", 404);
    agentId = agent.id;
  }

  const zipprConnected = await prisma.connection.findFirst({
    where: {
      workspaceId: session.workspaceId,
      status: "active",
      provider: { slug: "zippr_ink" },
    },
  });

  const zipprMode = process.env.ZIPPR_MODE ?? "mock";

  const result = await triggerImageUploadedEvent(
    session.workspaceId,
    agentId,
    { imageUrl: parsed.data.image_url }
  );

  if (!result.ok) {
    return apiError(result.error, result.status);
  }

  return apiSuccess({
    event_id: result.eventId,
    execution_ids: result.executionIds,
    zippr_mode: zipprMode,
    zippr_connected: Boolean(zipprConnected),
    message:
      zipprMode === "real" && zipprConnected
        ? "Image sent to Zippr.ink for real optimization."
        : zipprMode === "real" && !zipprConnected
          ? "ZIPPR_MODE=real but no API key connected — check Providers."
          : "Image processed in mock mode (demo). Connect Zippr for real optimization.",
  });
}
