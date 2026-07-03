import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isOnboardingEnabled } from "@/lib/onboarding/gemini-client";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">AI Kurulum Agent</h1>
      <p className="mb-8 text-slate-600">
        Google Gemini API&apos;nizi veya sitenizi analiz eder, UIP manifest taslağı
        üretir. Kurulum bittikten sonra AI devre dışı kalır — iletişim deterministik
        köprü üzerinden devam eder.
      </p>

      {!isOnboardingEnabled() && (
        <p className="mb-6 text-sm text-amber-700">
          GOOGLE_AI_API_KEY henüz tanımlı değil — aşağıdaki talimatları izleyin.
        </p>
      )}

      <OnboardingWizard />
    </div>
  );
}
