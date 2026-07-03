"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterProviderForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register/provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        company_name: companyName,
        service_url: serviceUrl || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kayıt başarısız");
      setLoading(false);
      return;
    }

    router.push("/dashboard/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Servis sağlayıcı hesabı</p>
        <p className="mt-1">
          Kayıt sonrası <strong>AI Kurulum</strong> ile Zippr veya servisinizin
          OpenAPI&apos;sini UIP formatına çevireceksiniz.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Şirket / servis adı</label>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Zippr.ink"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Servis web adresi (isteğe bağlı)
        </label>
        <input
          type="url"
          value={serviceUrl}
          onChange={(e) => setServiceUrl(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="https://zippr.ink"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Şifre (en az 8 karakter)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Hesap oluşturuluyor..." : "Sağlayıcı olarak kayıt ol"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Web sitesi sahibi misiniz?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Site kaydı
        </Link>
      </p>
    </form>
  );
}
