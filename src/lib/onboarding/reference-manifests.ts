import fs from "fs";
import path from "path";

const PROTOCOL_DIR = path.join(process.cwd(), "protocol");

export function loadReferenceManifests() {
  const dir = path.join(PROTOCOL_DIR, "manifests");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((file) => ({
    name: file,
    content: JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")),
  }));
}

export function loadReferenceSchemaNames(): string[] {
  const dir = path.join(PROTOCOL_DIR, "schemas");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

export function loadSchemaByRef(schemaRef: string): object | null {
  const bundled = path.join(PROTOCOL_DIR, "schemas", `${schemaRef}.json`);
  if (!fs.existsSync(bundled)) return null;
  return JSON.parse(fs.readFileSync(bundled, "utf-8"));
}

export const ONBOARDING_SYSTEM_PROMPT = `You are UIP Onboarding Agent (design-time only). You analyze API specifications and produce UIP manifests.

RULES:
- Output ONLY valid JSON matching the response schema. No markdown.
- Map external APIs to UIP protocol_version "0.1".
- service.type must be "saas_provider" OR "customer_agent".
- service.id: lowercase slug with underscores (e.g. zippr_ink, my_shop_agent).
- Prefer reusing existing schema_ref names when semantically matching:
  media.image_uploaded_event.v1, media.image_optimize_request.v1, media.image_optimize_result.v1,
  media.image_replace_request.v1, standard.operation_result.v1, standard.job_get_request.v1
- For new schemas, add them to inline_schemas with unique refs like "category.name.v1".
- capabilities need: name, description, category, risk_level (low|medium|high), input_schema_ref, output_schema_ref, permissions array.
- saas_provider: include auth, base_url, endpoints on capabilities.
- customer_agent: include events array with name, description, schema_ref.
- Do NOT include real API keys, passwords, or customer data in output.
- Write analysis_summary_tr in Turkish for the user (plain language, non-technical).
- Write integration_notes_tr: bullet list in Turkish explaining what was mapped.

Response JSON schema:
{
  "manifest": { ... UIP manifest object ... },
  "inline_schemas": { "schema.ref.v1": { JSON Schema object } },
  "analysis_summary_tr": "string",
  "integration_notes_tr": ["string"],
  "confidence": "high|medium|low"
}`;
