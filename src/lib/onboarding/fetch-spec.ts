const MAX_SPEC_BYTES = 120_000;

export async function fetchOpenApiSpec(url: string): Promise<string> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Yalnızca http/https URL desteklenir");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json, application/yaml, text/yaml, */*" },
    });

    if (!res.ok) {
      throw new Error(`OpenAPI indirilemedi (HTTP ${res.status})`);
    }

    const text = await res.text();
    if (text.length > MAX_SPEC_BYTES) {
      return text.slice(0, MAX_SPEC_BYTES) + "\n/* ... truncated for analysis ... */";
    }
    return sanitizeSpecText(text);
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizeSpecText(text: string): string {
  return text
    .replace(/"(api[_-]?key|password|secret|token|authorization)"\s*:\s*"[^"]*"/gi, '"$1": "[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]");
}

export function normalizeOpenApiInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length > MAX_SPEC_BYTES) {
    return trimmed.slice(0, MAX_SPEC_BYTES) + "\n/* ... truncated ... */";
  }
  return sanitizeSpecText(trimmed);
}
