import Link from "next/link";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Ayarlar</h1>
      <p className="mb-8 text-slate-600">Çalışma alanı ve platform yapılandırması.</p>

      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Çalışma alanı</h2>
          <p className="mt-2 text-sm text-slate-600">Demo çalışma alanı (MVP)</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Zippr modu</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sunucu ZIPPR_MODE: {process.env.ZIPPR_MODE ?? "mock"} (ortam değişkeni
            ile ayarlanır)
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Güvenlik modeli</h2>
          <p className="mt-2 text-sm text-slate-600">
            UIP müşteri verilerini görmez — sadece köprü kurar. AI yalnızca kurulum
            aşamasında devreye girer.
          </p>
          <Link
            href="/docs/guvenlik"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Güvenlik dokümantasyonunu oku →
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Yakında</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            <li>Supabase Auth geçişi</li>
            <li>Supabase satır düzeyinde güvenlik (RLS)</li>
            <li>OAuth 2.1 servis bağlantıları</li>
            <li>Onboarding AI agent (kurulum asistanı)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
