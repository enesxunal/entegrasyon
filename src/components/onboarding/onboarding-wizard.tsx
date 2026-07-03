"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OnboardingDraft = {
  manifest: Record<string, unknown>;
  inline_schemas?: Record<string, object>;
  analysis_summary_tr: string;
  integration_notes_tr?: string[];
  confidence?: string;
};

type Agent = { id: string; name: string };

export function OnboardingWizard() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [model, setModel] = useState("");

  const [serviceType, setServiceType] = useState<
    "saas_provider" | "customer_agent"
  >("customer_agent");
  const [serviceName, setServiceName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [sourceType, setSourceType] = useState<
    "openapi_url" | "openapi_json" | "description"
  >("openapi_url");
  const [openapiUrl, setOpenapiUrl] = useState("https://zippr.ink/openapi.json");
  const [openapiJson, setOpenapiJson] = useState("");
  const [description, setDescription] = useState("");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");

  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [draftJson, setDraftJson] = useState("");
  const [disclaimer, setDisclaimer] = useState("");

  const [recheckMode, setRecheckMode] = useState(false);
  const [changeDescription, setChangeDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/onboarding/analyze")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled ?? false);
        setModel(data.model ?? "");
      });

    fetch("/api/workspaces/current")
      .then((r) => r.json())
      .then((data) => {
        const ws = data.workspace;
        if (ws?.billingPlan === "provider") {
          setServiceType("saas_provider");
          if (ws.name) setServiceName(ws.name);
          setSourceType("openapi_url");
          setOpenapiUrl("https://zippr.ink/openapi.json");
        }
      });

    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        const list = data.agents ?? [];
        setAgents(list);
        if (list[0]) setAgentId(list[0].id);
      });
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setDraft(null);

    const payload = recheckMode
      ? {
          mode: "recheck" as const,
          service_type: serviceType,
          service_name: serviceName,
          current_manifest: JSON.parse(draftJson || "{}"),
          change_description: changeDescription,
        }
      : {
          service_type: serviceType,
          service_name: serviceName,
          site_url: siteUrl || undefined,
          source_type: sourceType,
          openapi_url: sourceType === "openapi_url" ? openapiUrl : undefined,
          openapi_json: sourceType === "openapi_json" ? openapiJson : undefined,
          description: sourceType === "description" ? description : undefined,
        };

    const res = await fetch("/api/onboarding/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Analiz başarısız");
      return;
    }

    setDraft(data.draft);
    setDraftJson(JSON.stringify(data.draft.manifest, null, 2));
    setDisclaimer(data.disclaimer ?? "");
  }

  async function handleImport() {
    setImporting(true);
    setError("");
    setSuccess("");

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(draftJson);
    } catch {
      setError("Manifest JSON geçersiz");
      setImporting(false);
      return;
    }

    const res = await fetch("/api/onboarding/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: {
          ...draft,
          manifest,
        },
        agent_id: serviceType === "customer_agent" ? agentId : undefined,
      }),
    });

    const data = await res.json();
    setImporting(false);

    if (!res.ok) {
      setError(data.error ?? "İçe aktarma başarısız");
      return;
    }

    setSuccess(data.message ?? "Kaydedildi");
    setTimeout(() => {
      router.push(
        serviceType === "saas_provider"
          ? "/dashboard/providers"
          : "/dashboard/manifests"
      );
      router.refresh();
    }, 2000);
  }

  if (enabled === null) {
    return <p className="text-sm text-slate-500">Yükleniyor...</p>;
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-semibold text-amber-900">Google AI yapılandırılmamış</h2>
        <p className="mt-2 text-sm text-amber-800">
          Onboarding agent çalışması için Vercel&apos;de{" "}
          <code className="text-xs">GOOGLE_AI_API_KEY</code> ortam değişkenini
          ekleyin. Anahtarı{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Google AI Studio
          </a>
          &apos;dan alabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-blue-50 p-5 text-sm text-blue-900">
        <p className="font-medium">Kurulum AI — Google Gemini ({model})</p>
        <p className="mt-1">
          AI yalnızca manifest taslağı üretir. Runtime&apos;da devreye girmez.
          API verileriniz veritabanına kaydedilmez.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRecheckMode(false)}
          className={`rounded-lg px-4 py-2 text-sm ${!recheckMode ? "bg-slate-900 text-white" : "border"}`}
        >
          Yeni analiz
        </button>
        <button
          type="button"
          onClick={() => setRecheckMode(true)}
          className={`rounded-lg px-4 py-2 text-sm ${recheckMode ? "bg-slate-900 text-white" : "border"}`}
        >
          Site değişti — kontrol et
        </button>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-6 rounded-xl border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Servis tipi</label>
            <select
              value={serviceType}
              onChange={(e) =>
                setServiceType(e.target.value as "saas_provider" | "customer_agent")
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
              disabled={recheckMode}
            >
              <option value="customer_agent">Web sitesi (hizmet alan)</option>
              <option value="saas_provider">SaaS servisi (hizmet veren)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Servis / site adı</label>
            <input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Örn: Zippr.ink veya Mağazam"
              required
            />
          </div>
        </div>

        {!recheckMode && (
          <>
            {serviceType === "customer_agent" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Site adresi (isteğe bağlı)
                </label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="https://magazam.com"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">API kaynağı</label>
              <select
                value={sourceType}
                onChange={(e) =>
                  setSourceType(
                    e.target.value as "openapi_url" | "openapi_json" | "description"
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="openapi_url">OpenAPI URL</option>
                <option value="openapi_json">OpenAPI JSON yapıştır</option>
                <option value="description">Metin açıklama</option>
              </select>
            </div>

            {sourceType === "openapi_url" && (
              <div>
                <label className="mb-1 block text-sm font-medium">OpenAPI URL</label>
                <input
                  type="url"
                  value={openapiUrl}
                  onChange={(e) => setOpenapiUrl(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                  placeholder="https://servis.com/openapi.json"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Zippr test: https://zippr.ink/openapi.json
                </p>
              </div>
            )}

            {sourceType === "openapi_json" && (
              <div>
                <label className="mb-1 block text-sm font-medium">OpenAPI JSON</label>
                <textarea
                  value={openapiJson}
                  onChange={(e) => setOpenapiJson(e.target.value)}
                  className="h-40 w-full rounded-lg border px-3 py-2 font-mono text-xs"
                  placeholder='{"openapi":"3.0.0", ...}'
                  required
                />
              </div>
            )}

            {sourceType === "description" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Site / API açıklaması
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-32 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Sitemde ürün fotoğrafı yüklendiğinde webhook tetiklenir..."
                  required
                />
              </div>
            )}

            {serviceType === "customer_agent" && agents.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium">Bağlı agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {recheckMode && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Mevcut manifest (JSON)
              </label>
              <textarea
                value={draftJson}
                onChange={(e) => setDraftJson(e.target.value)}
                className="h-48 w-full rounded-lg border px-3 py-2 font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ne değişti?
              </label>
              <textarea
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                className="h-24 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Yeni alan eklendi: hediye paketi seçeneği..."
                required
                minLength={10}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Google AI analiz ediyor..."
            : recheckMode
              ? "Değişiklikleri kontrol et"
              : "AI ile manifest üret"}
        </button>
      </form>

      {draft && (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
          <div>
            <p className="font-semibold text-emerald-900">AI analiz özeti</p>
            <p className="mt-2 text-sm text-emerald-800">
              {draft.analysis_summary_tr}
            </p>
            {draft.confidence && (
              <p className="mt-1 text-xs text-emerald-700">
                Güven: {draft.confidence}
              </p>
            )}
          </div>

          {draft.integration_notes_tr && draft.integration_notes_tr.length > 0 && (
            <ul className="list-inside list-disc text-sm text-emerald-800">
              {draft.integration_notes_tr.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          )}

          {disclaimer && (
            <p className="text-xs text-slate-600">{disclaimer}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Manifest taslağı (düzenleyebilirsiniz)
            </label>
            <textarea
              value={draftJson}
              onChange={(e) => setDraftJson(e.target.value)}
              className="h-64 w-full rounded-lg border bg-white px-3 py-2 font-mono text-xs"
            />
          </div>

          {success && (
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {importing ? "Kaydediliyor..." : "Manifesti onayla ve kaydet"}
            </button>
            <Link
              href="/docs/guvenlik"
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Güvenlik modeli
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
