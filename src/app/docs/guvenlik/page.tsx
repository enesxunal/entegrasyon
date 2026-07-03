import Link from "next/link";

export default function GuvenlikDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-bold">UIP Güvenlik Modeli</h1>
          <Link href="/" className="text-sm text-blue-600">
            Ana sayfa
          </Link>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-10">
        <h1>Veri görmeden köprü kurmak</h1>
        <p>
          UIP bir veri deposu değildir. Müşteri verilerini görmez, saklamaz,
          analiz etmez. Sadece servisler ile web siteleri arasında güvenli köprü
          kurar.
        </p>

        <h2>AI ne zaman devreye girer?</h2>
        <table>
          <thead>
            <tr>
              <th>Aşama</th>
              <th>AI var mı?</th>
              <th>Ne yapar?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>İlk kurulum</td>
              <td>Evet</td>
              <td>Site/API yapısını okur, manifest üretir, ortak dile çevirir</td>
            </tr>
            <tr>
              <td>Normal çalışma</td>
              <td>Hayır</td>
              <td>Deterministik kurallar, imza doğrulama, yönlendirme</td>
            </tr>
            <tr>
              <td>Site değişince</td>
              <td>Evet (kontrol)</td>
              <td>Yeni alan var mı, manifest güncellenmeli mi diye bakar</td>
            </tr>
          </tbody>
        </table>
        <p>
          Runtime&apos;da (günlük kullanımda) AI yoktur. Her görsel yükleme, her
          fatura, her sipariş — önceden tanımlanmış kurallarla çalışır.
        </p>

        <h2>UIP&apos;de ne saklanır?</h2>
        <ul>
          <li>Manifest — hangi event, hangi format (yapı tanımı, veri değil)</li>
          <li>İş akışı kuralları — A olunca B çalışsın</li>
          <li>Çalıştırma özeti — başarılı/başarısız, süre, hata kodu</li>
          <li>Şifreli API anahtarları — referans, içerik değil</li>
        </ul>

        <h2>UIP&apos;de ne saklanmaz?</h2>
        <ul>
          <li>Müşteri adı, fatura tutarı, sipariş detayları</li>
          <li>Görsel dosyaları, kişisel bilgiler</li>
          <li>Herhangi bir iş verisi</li>
        </ul>

        <h2>Veri nerede kalır?</h2>
        <pre>
          {`Site Agent  ←→  Servis (Zippr, e-fatura…)
     ↑
UIP (sadece: "şu workflow aktif, şu manifest geçerli")`}
        </pre>
        <p>
          Hedef mimari (Data Plane): iş akışı müşterinin kendi sunucusunda çalışır,
          veri hiç UIP&apos;ye uğramaz.
        </p>

        <h2>Tek tık entegrasyon nasıl güvenli?</h2>
        <p>
          Her iki taraf da kayıt sırasında verisini ortak dile çevirmiştir. Bağlantı
          anında sadece manifest eşleşmesi ve yetki kontrolü yapılır — ham veri
          paylaşılmaz.
        </p>
      </article>
    </div>
  );
}
