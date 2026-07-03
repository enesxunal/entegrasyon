import Link from "next/link";

export default function ZipprIntegrationDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-bold">Zippr.ink + UIP Entegrasyonu</h1>
          <Link href="/" className="text-sm text-blue-600">
            Ana sayfa
          </Link>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-10">
        <h1>Zippr.ink UIP servis sağlayıcısı olarak</h1>
        <p>
          Zippr.ink içine UIP kodu kurmanıza gerek yok. UIP, Zippr&apos;ın mevcut
          REST API&apos;sini herhangi bir dış istemci gibi çağırır.
        </p>

        <h2>Mimari</h2>
        <pre>
          {`Müşteri Web Sitesi
    → UIP Agent (imzalı olay: image.uploaded)
    → UIP Kontrol Paneli (iş akışı)
    → Zippr.ink API (POST /api/v1/images/optimize-url)
    → Sonuç agent'a / özet log UIP'de`}
        </pre>

        <h2>Zippr.ink ne sağlar?</h2>
        <ul>
          <li>REST API: optimize-url, optimize, jobs</li>
          <li>API anahtarları: zippr_test_... / zippr_live_...</li>
          <li>OpenAPI: /openapi.json</li>
        </ul>

        <h2>UIP ne sağlar?</h2>
        <ul>
          <li>Servis manifesti (image.optimize yeteneği)</li>
          <li>Müşteri çalışma alanı + agent kaydı</li>
          <li>İş akışı: image.uploaded → optimize → replace</li>
          <li>Şifreli Zippr API anahtarı saklama</li>
          <li>Yalnızca özet çalıştırma logları</li>
        </ul>

        <h2>Müşteri kayıt akışı</h2>
        <ol>
          <li>UIP&apos;ye kayıt ol (/register)</li>
          <li>Zippr API anahtarını bağla (Panel → Servis sağlayıcılar → Zippr.ink)</li>
          <li>Agent&apos;ı sunucuya kur (veya demo site ile test et)</li>
          <li>Görsel yükle → iş akışı çalışır → Zippr optimize eder</li>
        </ol>

        <h2>Demo vs gerçek mod</h2>
        <table>
          <thead>
            <tr>
              <th>ZIPPR_MODE</th>
              <th>Davranış</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>mock</td>
              <td>Sahte optimizasyon yanıtı (Zippr API çağrılmaz)</td>
            </tr>
            <tr>
              <td>real</td>
              <td>Çalışma alanı API anahtarı ile canlı Zippr.ink çağrısı</td>
            </tr>
          </tbody>
        </table>

        <h2>Gelecek: Zippr tarafı geliştirmeler</h2>
        <ul>
          <li>Zippr panelinde &quot;UIP&apos;ye bağlan&quot; butonu</li>
          <li>API anahtarı yapıştırma yerine OAuth</li>
          <li>Webhook: job.completed → müşteri agent&apos;ına bildirim</li>
          <li>UIP resmi Zippr entegrasyon ortağı olarak listelenir</li>
        </ul>
      </article>
    </div>
  );
}
