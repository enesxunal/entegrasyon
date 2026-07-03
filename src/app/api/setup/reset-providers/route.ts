import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { resetProvidersEcosystem } from "@/lib/setup/reset-providers";

/**
 * POST /api/setup/reset-providers
 * Header: X-Setup-Secret: <SEED_SECRET>
 * Removes all SaaS providers (e.g. pre-seeded Zippr) so they can be re-added via AI onboarding.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return apiError("SEED_SECRET yapılandırılmamış", 403);
  }

  const header = request.headers.get("x-setup-secret");
  if (header !== secret) {
    return apiError("Yetkisiz", 401);
  }

  try {
    const result = await resetProvidersEcosystem();
    return apiSuccess({
      message: "Servis sağlayıcılar sıfırlandı. Zippr artık AI Kurulum ile eklenebilir.",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sıfırlama başarısız";
    return apiError(message, 500);
  }
}
