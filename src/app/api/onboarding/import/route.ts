import { NextRequest } from "next/server";
import {
  requireSession,
  isSession,
  apiError,
  apiSuccess,
} from "@/lib/api/helpers";
import { importManifestDraft } from "@/lib/onboarding/import-draft";
import type { OnboardingDraft } from "@/lib/onboarding/generate-manifest";
import { z } from "zod";

const importSchema = z.object({
  draft: z.object({
    manifest: z.record(z.unknown()),
    inline_schemas: z.record(z.record(z.unknown())).optional().default({}),
    analysis_summary_tr: z.string().optional(),
    integration_notes_tr: z.array(z.string()).optional(),
    confidence: z.enum(["high", "medium", "low"]).optional(),
  }),
  agent_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Geçersiz manifest taslağı");
  }

  const draft = parsed.data.draft as OnboardingDraft;
  if (!draft.manifest?.service) {
    return apiError("Manifest service alanı eksik");
  }

  try {
    const result = await importManifestDraft({
      workspaceId: session.workspaceId,
      agentId: parsed.data.agent_id,
      draft,
    });

    return apiSuccess(
      {
        manifest_id: result.manifest.id,
        service_id: result.serviceId,
        message: "Manifest başarıyla kaydedildi. AI artık devre dışı — runtime köprü deterministik çalışır.",
      },
      201
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Manifest içe aktarılamadı";
    return apiError(message, 500);
  }
}
