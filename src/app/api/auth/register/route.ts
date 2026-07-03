import { NextRequest } from "next/server";
import { registerWorkspace } from "@/lib/auth/register";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspace_name: z.string().min(2),
  site_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid registration data");
  }

  const result = await registerWorkspace({
    email: parsed.data.email,
    password: parsed.data.password,
    workspaceName: parsed.data.workspace_name,
    siteUrl: parsed.data.site_url,
  });

  if (!result.ok) {
    return apiError(result.error, 409);
  }

  return apiSuccess(
    {
      user: result.user,
      workspace: result.workspace,
      agent: result.agent,
      agent_secret: result.agentSecret,
      message:
        "Registration complete. Save your agent secret — it is shown only once.",
    },
    201
  );
}
