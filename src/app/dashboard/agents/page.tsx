"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type Agent = {
  id: string;
  name: string;
  type: string;
  status: string;
  secretPrefix: string;
  lastSeenAt: string | null;
  createdAt: string;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("Local Simulator");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadAgents() {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data.agents ?? []);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "local_simulator" }),
    });
    const data = await res.json();
    if (data.secret) setNewSecret(data.secret);
    setName("Local Simulator");
    await loadAgents();
    setLoading(false);
  }

  async function rotateSecret(id: string) {
    const res = await fetch(`/api/agents/${id}/rotate-secret`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.secret) setNewSecret(data.secret);
    await loadAgents();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Agents</h1>
      <p className="mb-8 text-slate-600">
        Agents run in customer environments and execute workflows without
        sending full payloads to the control plane.
      </p>

      {newSecret && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="mb-2 font-medium text-amber-900">
            Agent secret (shown once — copy now)
          </p>
          <code className="block break-all rounded bg-white p-3 text-sm">
            {newSecret}
          </code>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-3 text-sm text-amber-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={createAgent} className="mb-8 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Agent name"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Agent
        </button>
      </form>

      <div className="rounded-xl border bg-white divide-y">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">{agent.name}</p>
              <p className="text-sm text-slate-500">
                {agent.type} · {agent.secretPrefix}... · Last seen:{" "}
                {formatDate(agent.lastSeenAt)}
              </p>
              <p className="text-xs text-slate-400">ID: {agent.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs capitalize">
                {agent.status}
              </span>
              <button
                onClick={() => rotateSecret(agent.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                Rotate secret
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
