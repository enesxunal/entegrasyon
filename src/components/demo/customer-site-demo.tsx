"use client";

import { useState } from "react";
import Link from "next/link";

export function CustomerSiteDemo() {
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/demo/trigger-image-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Yükleme başarısız");
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo müşteri sitesi
            </p>
            <h1 className="text-xl font-bold">Alpine Foto Mağazası</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← UIP Paneli
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Ürün görseli yükle</h2>
          <p className="mb-6 text-sm text-slate-600">
            Bu sayfa gerçek bir web sitesini simüle eder. Yüklediğinizde UIP
            agent&apos;ınız imzalı bir <code className="text-xs">image.uploaded</code>{" "}
            olayı gönderir. Zippr.ink iş akışı çalışır — UIP hassas veri saklamaz.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Görsel adresi (URL)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Herkese açık bir görsel URL&apos;si kullanın. Gerçek Zippr testi için
                Panel → Servis sağlayıcılar&apos;dan API anahtarını bağlayın.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Optimize ediliyor..." : "Yükle ve Zippr ile optimize et"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="font-medium text-emerald-900">İş akışı tetiklendi!</p>
            {typeof result.message === "string" && (
              <p className="mt-2 text-sm text-emerald-800">{result.message}</p>
            )}
            <pre className="mt-3 overflow-auto rounded bg-white p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
            {Array.isArray(result.execution_ids) && result.execution_ids[0] && (
              <Link
                href={`/dashboard/executions/${result.execution_ids[0]}`}
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                Panelde çalıştırmayı gör →
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Gerçek sitede nasıl çalışır?</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Site sahibi UIP&apos;ye kayıt olur</li>
            <li>Agent sunucusuna kurulur (PHP, Node, WordPress eklentisi…)</li>
            <li>Görsel yüklenince agent otomatik sinyal gönderir</li>
            <li>Zippr.ink API anahtarı ile görseli optimize eder</li>
            <li>Optimize görsel siteye geri yazılır</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
