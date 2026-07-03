"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [agentSecret, setAgentSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        workspace_name: workspaceName,
        site_url: siteUrl || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kayıt başarısız");
      setLoading(false);
      return;
    }

    setAgentSecret(data.agent_secret);
    setLoading(false);

    setTimeout(() => {
      router.push("/dashboard/integrate");
      router.refresh();
    }, 8000);
  }

  if (agentSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">Kayıt başarılı!</p>
          <p className="mt-2 text-sm text-emerald-800">
            Agent gizli anahtarınızı şimdi kopyalayın. 8 saniye içinde entegrasyon
            rehberine yönlendirileceksiniz…
          </p>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-900">
            Agent gizli anahtarı (bir kez gösterilir)
          </p>
          <code className="block break-all rounded bg-white p-3 text-xs">
            {agentSecret}
          </code>
        </div>
        <Link
          href="/dashboard/integrate"
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Entegrasyona devam et →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Çalışma alanı / Şirket adı
        </label>
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Online Mağazam"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Web sitesi adresi (isteğe bağlı)
        </label>
        <input
          type="url"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="https://magazam.com"
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
        <label className="mb-1 block text-sm font-medium">
          Şifre (en az 8 karakter)
        </label>
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
        {loading ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
      </button>
    </form>
  );
}
