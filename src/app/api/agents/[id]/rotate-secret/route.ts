import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { rotateAgentSecret } from "@/lib/agents/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id } = await params;
  const result = await rotateAgentSecret(id, session.workspaceId);
  if (!result) return apiError("Agent not found", 404);

  return apiSuccess({
    agent: {
      id: result.agent.id,
      secretPrefix: result.agent.secretPrefix,
    },
    secret: result.rawSecret,
  });
}
