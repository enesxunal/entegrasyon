import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isOnboardingEnabled } from "@/lib/onboarding/gemini-client";
import { prisma } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
  });
  const isProvider = workspace?.billingPlan === "provider";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">AI Kurulum Agent</h1>
      {isProvider ? (
        <p className="mb-8 text-slate-600">
          <strong>Servis sağlayıcı hesabı</strong> — OpenAPI&apos;nizi analiz edip UIP
          manifest taslağı üretin (ör. Zippr: https://zippr.ink/openapi.json). Onay
          sonrası servis ekosistemde listelenir.
        </p>
      ) : (
        <p className="mb-8 text-slate-600">
          Google Gemini sitenizi veya API&apos;nizi analiz eder, UIP manifest taslağı
          üretir. Kurulum bittikten sonra AI devre dışı kalır.
        </p>
      )}

      {!isOnboardingEnabled() && (
        <p className="mb-6 text-sm text-amber-700">
          GOOGLE_AI_API_KEY henüz tanımlı değil — aşağıdaki talimatları izleyin.
        </p>
      )}

      <OnboardingWizard />
    </div>
  );
}
