import { z } from "zod";
import {
  loadReferenceManifests,
  loadReferenceSchemaNames,
  ONBOARDING_SYSTEM_PROMPT,
} from "./reference-manifests";
import { fetchOpenApiSpec, normalizeOpenApiInput } from "./fetch-spec";
import { generateWithGemini } from "./gemini-client";

export const analyzeInputSchema = z.object({
  service_type: z.enum(["saas_provider", "customer_agent"]),
  service_name: z.string().min(2).max(120),
  site_url: z.string().url().optional(),
  source_type: z.enum(["openapi_url", "openapi_json", "description"]),
  openapi_url: z.string().url().optional(),
  openapi_json: z.string().max(200_000).optional(),
  description: z.string().max(8000).optional(),
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export type OnboardingDraft = {
  manifest: Record<string, unknown>;
  inline_schemas: Record<string, object>;
  analysis_summary_tr: string;
  integration_notes_tr: string[];
  confidence: "high" | "medium" | "low";
};

const draftResponseSchema = z.object({
  manifest: z.record(z.unknown()),
  inline_schemas: z.record(z.record(z.unknown())).optional().default({}),
  analysis_summary_tr: z.string(),
  integration_notes_tr: z.array(z.string()).optional().default([]),
  confidence: z.enum(["high", "medium", "low"]).optional().default("medium"),
});

function parseJsonFromModel(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI yanıtı JSON formatında değil");
    return JSON.parse(match[0]);
  }
}

async function resolveSpecContent(input: AnalyzeInput): Promise<string> {
  if (input.source_type === "openapi_url") {
    if (!input.openapi_url) throw new Error("OpenAPI URL gerekli");
    return fetchOpenApiSpec(input.openapi_url);
  }
  if (input.source_type === "openapi_json") {
    if (!input.openapi_json) throw new Error("OpenAPI JSON gerekli");
    return normalizeOpenApiInput(input.openapi_json);
  }
  if (!input.description?.trim()) {
    throw new Error("Servis açıklaması gerekli");
  }
  return input.description.trim();
}

export async function generateManifestDraft(
  input: AnalyzeInput
): Promise<OnboardingDraft> {
  const specContent = await resolveSpecContent(input);
  const references = loadReferenceManifests();
  const schemaNames = loadReferenceSchemaNames();

  const serviceTypeLabel =
    input.service_type === "saas_provider"
      ? "SaaS servis sağlayıcı (hizmet veren — örn. Zippr, e-fatura)"
      : "Müşteri web sitesi agent (hizmet alan — örn. e-ticaret sitesi)";

  const userPrompt = `Analyze the following and produce a UIP manifest draft.

Service type: ${input.service_type} (${serviceTypeLabel})
Service display name: ${input.service_name}
${input.site_url ? `Site URL: ${input.site_url}` : ""}
Source type: ${input.source_type}

Reference manifest examples:
${JSON.stringify(references.map((r) => r.content), null, 2)}

Available bundled schema refs (prefer reuse):
${schemaNames.join(", ")}

API / site specification to analyze:
---
${specContent}
---`;

  const raw = await generateWithGemini({
    systemInstruction: ONBOARDING_SYSTEM_PROMPT,
    userPrompt,
    jsonMode: true,
  });

  const parsed = draftResponseSchema.parse(parseJsonFromModel(raw));

  const manifest = parsed.manifest;
  const service = manifest.service as Record<string, unknown> | undefined;
  if (!service) {
    throw new Error("Manifest içinde service alanı eksik");
  }

  service.type = input.service_type;
  if (!service.name) service.name = input.service_name;
  if (!manifest.protocol_version) manifest.protocol_version = "0.1";

  return {
    manifest,
    inline_schemas: parsed.inline_schemas as Record<string, object>,
    analysis_summary_tr: parsed.analysis_summary_tr,
    integration_notes_tr: parsed.integration_notes_tr,
    confidence: parsed.confidence,
  };
}

export async function recheckManifestDraft(input: {
  service_type: "saas_provider" | "customer_agent";
  service_name: string;
  current_manifest: Record<string, unknown>;
  change_description: string;
}): Promise<OnboardingDraft> {
  const references = loadReferenceManifests();
  const schemaNames = loadReferenceSchemaNames();

  const userPrompt = `The service "${input.service_name}" changed. Review and update the UIP manifest if needed.

Service type: ${input.service_type}
Change description from site owner:
${input.change_description}

Current manifest:
${JSON.stringify(input.current_manifest, null, 2)}

Reference manifests:
${JSON.stringify(references.map((r) => r.content), null, 2)}

Available schema refs: ${schemaNames.join(", ")}

If no manifest update needed, return the same manifest with updated analysis_summary_tr explaining why.`;

  const raw = await generateWithGemini({
    systemInstruction: ONBOARDING_SYSTEM_PROMPT,
    userPrompt,
    jsonMode: true,
  });

  const parsed = draftResponseSchema.parse(parseJsonFromModel(raw));

  return {
    manifest: parsed.manifest,
    inline_schemas: parsed.inline_schemas as Record<string, object>,
    analysis_summary_tr: parsed.analysis_summary_tr,
    integration_notes_tr: parsed.integration_notes_tr,
    confidence: parsed.confidence,
  };
}
