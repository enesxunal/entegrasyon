"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProviderConnectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug ?? "");

  const [providerName, setProviderName] = useState(slug);
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [connected, setConnected] = useState(false);
  const [exists, setExists] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/providers/${slug}/connect`)
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected ?? false);
        setExists(data.exists !== false);
        if (data.provider) setProviderName(data.provider);
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch(`/api/providers/${slug}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, mode }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Bağlantı kaydedilemedi");
    } else {
      setMessage(`Bağlandı (${data.connection.api_key_masked})`);
      setConnected(true);
      setApiKey("");
    }
    setLoading(false);
  }

  if (!exists) {
    return (
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Geri
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-semibold text-amber-900">
            Servis henüz ekosistemde yok
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            <strong>{slug}</strong> bulunamadı. Önce AI Kurulum ile servis manifestini
            ekleyin.
          </p>
          <button
            onClick={() => router.push("/dashboard/onboarding")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            AI Kuruluma git
          </button>
        </div>
      </div>
    );
  }

  const isZippr = slug === "zippr_ink";

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Servis sağlayıcılara dön
      </button>
      <h1 className="mb-2 text-2xl font-bold">{providerName} bağla</h1>
      <p className="mb-8 text-slate-600">
        API anahtarınızı ekleyin. Anahtar şifrelenir ve bir daha gösterilmez.
      </p>

      {connected && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {providerName} bağlantısı yapılandırıldı.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">API Anahtarı</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={isZippr ? "zippr_test_..." : "API anahtarınız"}
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
            required
          />
          {isZippr && (
            <p className="mt-1 text-xs text-slate-500">
              Format: zippr_live_... veya zippr_test_...
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mod</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "test" | "live")}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="test">Test</option>
            <option value="live">Canlı</option>
          </select>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white"
        >
          {loading ? "Kaydediliyor..." : "Bağlantıyı kaydet"}
        </button>
      </form>
    </div>
  );
}
