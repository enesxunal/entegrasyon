import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold">UIP</div>
        <div className="flex gap-4">
          <Link href="/docs/guvenlik" className="text-sm text-slate-600 hover:text-slate-900">
            Güvenlik
          </Link>
          <Link href="/docs/protocol" className="text-sm text-slate-600 hover:text-slate-900">
            Protokol
          </Link>
          <Link
            href="/register/provider"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Servis sağlayıcı kaydı
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Site kaydı
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Giriş yap
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-blue-600">
          Evrensel Entegrasyon Platformu
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          SaaS servislerini web sitelerine bağlayın — verileri saklamadan.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
          Zippr, e-fatura, kargo ve daha fazlası… Her servis ve her site aynı ortak
          dili konuşur. UIP sadece köprüyü kurar; müşteri verilerini görmez.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Sitenizi kaydedin
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Panele gir
          </Link>
        </div>
      </main>
    </div>
  );
}
