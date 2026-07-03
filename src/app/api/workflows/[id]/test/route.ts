import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { executeWorkflow } from "@/lib/workflow/execute-workflow";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const workflow = await prisma.workflow.findFirst({
    where: { id, workspaceId: session.workspaceId },
  });
  if (!workflow) return apiError("Workflow not found", 404);

  const body = await request.json().catch(() => ({}));
  const trigger = body.trigger ?? {
    event_id: `evt_test_${Date.now()}`,
    event_type: workflow.triggerEventName,
    source: "basic_site_agent",
    created_at: new Date().toISOString(),
    data: {
      image_url:
        body.image_url ?? "https://example.com/demo-image.jpg",
      filename: "demo-image.jpg",
      mime_type: "image/jpeg",
      size_bytes: 850000,
    },
  };

  try {
    const executionId = await executeWorkflow({
      workspaceId: session.workspaceId,
      workflowId: workflow.id,
      trigger,
    });
    return apiSuccess({ executionId });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Workflow test failed",
      500
    );
  }
}
