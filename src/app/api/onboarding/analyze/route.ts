import { NextRequest } from "next/server";
import {
  requireSession,
  isSession,
  apiError,
  apiSuccess,
} from "@/lib/api/helpers";
import {
  analyzeInputSchema,
  generateManifestDraft,
  recheckManifestDraft,
} from "@/lib/onboarding/generate-manifest";
import { isOnboardingEnabled } from "@/lib/onboarding/gemini-client";
import { z } from "zod";

export async function GET() {
  return apiSuccess({
    enabled: isOnboardingEnabled(),
    provider: "google_gemini",
    model: process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash",
    mode: "design_time_only",
    message:
      "AI yalnızca kurulum aşamasında çalışır. Runtime iletişiminde kullanılmaz.",
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  if (!isOnboardingEnabled()) {
    return apiError(
      "Google AI anahtarı yapılandırılmamış. GOOGLE_AI_API_KEY ortam değişkenini ekleyin.",
      503
    );
  }

  const body = await request.json();

  const recheckSchema = z.object({
    mode: z.literal("recheck"),
    service_type: z.enum(["saas_provider", "customer_agent"]),
    service_name: z.string().min(2),
    current_manifest: z.record(z.unknown()),
    change_description: z.string().min(10).max(4000),
  });

  const recheckParsed = recheckSchema.safeParse(body);
  if (recheckParsed.success) {
    try {
      const draft = await recheckManifestDraft(recheckParsed.data);
      return apiSuccess({
        draft,
        mode: "recheck",
        disclaimer:
          "Bu taslak henüz kaydedilmedi. İnceleyip onayladıktan sonra içe aktarın.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Manifest kontrolü başarısız";
      return apiError(message, 500);
    }
  }

  const parsed = analyzeInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Geçersiz analiz isteği. Zorunlu alanları kontrol edin.");
  }

  const data = parsed.data;

  if (data.source_type === "openapi_url" && !data.openapi_url) {
    return apiError("OpenAPI URL gerekli");
  }
  if (data.source_type === "openapi_json" && !data.openapi_json) {
    return apiError("OpenAPI JSON gerekli");
  }
  if (data.source_type === "description" && !data.description?.trim()) {
    return apiError("Servis açıklaması gerekli");
  }

  try {
    const draft = await generateManifestDraft(data);
    return apiSuccess({
      draft,
      mode: "analyze",
      disclaimer:
        "AI yalnızca manifest taslağı üretti. Verileriniz saklanmadı. Onayladıktan sonra içe aktarın.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI analizi başarısız";
    return apiError(message, 500);
  }
}
