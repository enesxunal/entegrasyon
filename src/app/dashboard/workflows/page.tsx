"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statusLabel } from "@/lib/i18n/tr";

type Workflow = {
  id: string;
  name: string;
  triggerEventName: string;
  status: string;
  createdAt: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  async function load() {
    const res = await fetch("/api/workflows");
    const data = await res.json();
    setWorkflows(data.workflows ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleWorkflow(id: string, action: "enable" | "disable") {
    await fetch(`/api/workflows/${id}/${action}`, { method: "POST" });
    await load();
  }

  async function testWorkflow(id: string) {
    const res = await fetch(`/api/workflows/${id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.executionId) {
      window.location.href = `/dashboard/executions/${data.executionId}`;
    }
  }

  async function createFromTemplate() {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Zippr.ink ile yüklenen görseli optimize et",
        trigger_event_name: "image.uploaded",
        steps: [
          {
            id: "step_1",
            name: "Görseli optimize et",
            service: "zippr_ink",
            capability: "image.optimize",
            input: {
              image_url: "{{trigger.data.image_url}}",
              quality: 80,
              format: "webp",
              max_width: 1600,
              strip_metadata: true,
            },
            retry: { max_attempts: 3, backoff: "exponential" },
            idempotency_key: "{{trigger.event_id}}:image.optimize",
          },
          {
            id: "step_2",
            name: "Optimize görseli kaydet",
            service: "basic_site_agent",
            capability: "image.replace",
            input: {
              old_image_url: "{{trigger.data.image_url}}",
              new_image_url: "{{steps.step_1.output.optimized_url}}",
              job_id: "{{steps.step_1.output.job_id}}",
              metadata: {
                compression_ratio: "{{steps.step_1.output.compression_ratio}}",
                optimized_size_bytes:
                  "{{steps.step_1.output.optimized_size_bytes}}",
              },
            },
            retry: { max_attempts: 1 },
            idempotency_key: "{{trigger.event_id}}:image.replace",
          },
        ],
        status: "active",
      }),
    });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold">İş akışları</h1>
          <p className="text-slate-600">
            Olayları servis yeteneklerine deterministik adımlarla bağlar.
          </p>
        </div>
        <button
          onClick={createFromTemplate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Şablondan oluştur
        </button>
      </div>

      <div className="divide-y rounded-xl border bg-white">
        {workflows.map((wf) => (
          <div key={wf.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">{wf.name}</p>
              <p className="text-sm text-slate-500">
                Tetikleyici: {wf.triggerEventName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {statusLabel(wf.status)}
              </span>
              {wf.status !== "active" ? (
                <button
                  onClick={() => toggleWorkflow(wf.id, "enable")}
                  className="text-sm text-blue-600"
                >
                  Etkinleştir
                </button>
              ) : (
                <button
                  onClick={() => toggleWorkflow(wf.id, "disable")}
                  className="text-sm text-slate-500"
                >
                  Devre dışı bırak
                </button>
              )}
              <button
                onClick={() => testWorkflow(wf.id)}
                className="text-sm text-blue-600"
              >
                Test et
              </button>
              <Link
                href={`/dashboard/executions?workflow=${wf.id}`}
                className="text-sm text-slate-500"
              >
                Loglar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
