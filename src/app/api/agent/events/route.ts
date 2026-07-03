import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { handleAgentEvent } from "@/lib/agent/event-handler";
import type { TriggerContext } from "@/lib/workflow/template-resolver";

export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get("x-agent-id");
    const timestamp = request.headers.get("x-timestamp");
    const nonce = request.headers.get("x-nonce");
    const signature = request.headers.get("x-signature");

    if (!agentId || !timestamp || !nonce || !signature) {
      return apiError("Missing agent authentication headers", 401);
    }

    const rawBody = await request.text();
    let event: TriggerContext;

    try {
      event = JSON.parse(rawBody) as TriggerContext;
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const result = await handleAgentEvent(
      agentId,
      timestamp,
      nonce,
      signature,
      rawBody,
      event
    );

    if (!result.ok) {
      return apiError(result.error, result.status);
    }

    return apiSuccess({
      accepted: true,
      execution_ids: result.executionIds,
    });
  } catch (error) {
    console.error("Agent event error:", error);
    const message =
      error instanceof Error ? error.message : "Agent event processing failed";
    return apiError(message, 500);
  }
}
