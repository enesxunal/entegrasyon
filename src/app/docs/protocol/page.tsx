import Link from "next/link";

export default function ProtocolDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-bold">UIP Protokolü</h1>
          <Link href="/" className="text-sm text-blue-600">
            Ana sayfa
          </Link>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-10">
        <h1>Evrensel Entegrasyon Protokolü</h1>
        <p>
          UIP, SaaS servislerini ve müşteri agent&apos;larını manifest, yetenek,
          olay ve iş akışları ile birbirine bağlar — hassas iş verilerini kontrol
          panelinde saklamadan.
        </p>

        <h2>Servis sağlayıcı nedir?</h2>
        <p>
          Dış bir SaaS servisi (ör. Zippr.ink). Manifest aracılığıyla{" "}
          <code>image.optimize</code> gibi yetenekler sunar.
        </p>

        <h2>Agent nedir?</h2>
        <p>
          Müşteri tarafında çalışan küçük program (web sitesi, uygulama veya
          simülatör). Olay gönderir ve yerel yetenekleri yürütür.
        </p>

        <h2>Manifest nedir?</h2>
        <p>
          Servis kimliği, kimlik doğrulama, yetenekler, olaylar, şemalar ve uç
          noktaları tanımlayan sürümlü JSON belgesi. Veri değil — yapı tanımıdır.
        </p>

        <h2>Yetenek (capability) nedir?</h2>
        <p>
          <code>image.optimize</code> veya <code>image.replace</code> gibi normalize
          edilmiş bir eylem; giriş/çıkış JSON şemaları ile.
        </p>

        <h2>Olay (event) nedir?</h2>
        <p>
          <code>image.uploaded</code> gibi bir tetikleyici; eşleşen iş akışlarını
          başlatır.
        </p>

        <h2>İş akışı nedir?</h2>
        <p>
          Bir olayı servis ve agent yeteneklerine bağlayan deterministik adım
          dizisi.
        </p>

        <h2>Ne saklanır?</h2>
        <ul>
          <li>Manifestler, iş akışları, politikalar (metadata)</li>
          <li>Çalıştırma durumu, süre, adım adları</li>
          <li>Güvenli hata kodları ve mesajları</li>
          <li>Şifreli API anahtarları ve agent imza anahtarları</li>
        </ul>

        <h2>Ne saklanmaz?</h2>
        <ul>
          <li>Tam olay verileri</li>
          <li>Görsel dosyaları</li>
          <li>Müşteri kişisel bilgileri, siparişler, faturalar</li>
          <li>Loglarda ham gizli anahtarlar</li>
        </ul>

        <h2>Agent istek imzalama</h2>
        <p>Her agent isteği şunları içermelidir:</p>
        <pre>
          {`X-Agent-Id
X-Timestamp
X-Nonce
X-Signature

HMAC_SHA256(agent_secret, timestamp + "." + nonce + "." + raw_body)`}
        </pre>
        <p>Zaman damgası en fazla 5 dakika geçerli. Nonce tekrar kullanılamaz.</p>

        <h2>Zippr.ink demo akışı</h2>
        <pre>
          {`image.uploaded → image.optimize → image.replace`}
        </pre>
        <ol>
          <li>Agent imzalı <code>image.uploaded</code> olayı gönderir</li>
          <li>UIP aktif iş akışını bulur</li>
          <li>Zippr.ink <code>/api/v1/images/optimize-url</code> çağrılır</li>
          <li>Sonuç <code>media.image_optimize_result.v1</code> formatına normalize edilir</li>
          <li><code>image.replace</code> yerelde yürütülür</li>
          <li>Yalnızca özet çalıştırma logu saklanır</li>
        </ol>

        <p>
          Geliştirme için <code>ZIPPR_MODE=mock</code>, canlı Zippr için{" "}
          <code>ZIPPR_MODE=real</code> ayarlayın.
        </p>

        <p>
          <Link href="/docs/guvenlik">Güvenlik modeli →</Link>
        </p>
      </article>
    </div>
  );
}
