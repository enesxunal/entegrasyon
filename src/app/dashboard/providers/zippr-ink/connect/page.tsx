"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ZipprConnectPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/providers/zippr-ink/connect")
      .then((r) => r.json())
      .then((data) => setConnected(data.connected ?? false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/providers/zippr-ink/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, mode }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to save connection");
    } else {
      setMessage(`Connected (${data.connection.api_key_masked})`);
      setConnected(true);
      setApiKey("");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to Providers
      </button>
      <h1 className="mb-2 text-2xl font-bold">Connect Zippr.ink</h1>
      <p className="mb-8 text-slate-600">
        Add your Zippr API key. The key is encrypted and never shown again after
        save.
      </p>

      {connected && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Zippr.ink connection is configured for this workspace.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="zippr_test_..."
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Format: zippr_live_... or zippr_test_...
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "test" | "live")}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white"
        >
          {loading ? "Saving..." : "Save Connection"}
        </button>
      </form>
    </div>
  );
}
