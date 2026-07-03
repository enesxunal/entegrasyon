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
      setError(data.error ?? "Upload failed");
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
              Demo customer website
            </p>
            <h1 className="text-xl font-bold">Alpine Photo Shop</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← UIP Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Upload a product image</h2>
          <p className="mb-6 text-sm text-slate-600">
            This simulates a real website. When you upload, your UIP agent sends a
            signed <code className="text-xs">image.uploaded</code> event. UIP runs
            the Zippr.ink workflow — no sensitive data stored in UIP.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Use a public image URL. For real Zippr test, connect API key in
                Dashboard → Providers.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Optimizing..." : "Upload & Optimize with Zippr"}
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
            <p className="font-medium text-emerald-900">Workflow triggered!</p>
            <pre className="mt-3 overflow-auto rounded bg-white p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
            {Array.isArray(result.execution_ids) && result.execution_ids[0] && (
              <Link
                href={`/dashboard/executions/${result.execution_ids[0]}`}
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                View execution in dashboard →
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">How this works on a real site</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Site owner registers on UIP</li>
            <li>Installs agent on their server (PHP, Node, WordPress plugin)</li>
            <li>Agent sends signed events — secret never exposed in browser</li>
            <li>Zippr.ink optimizes images via API key stored in UIP</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
