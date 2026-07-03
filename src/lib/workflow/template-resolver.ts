export type WorkflowStep = {
  id: string;
  name: string;
  service: string;
  capability: string;
  input: Record<string, unknown>;
  retry?: {
    max_attempts?: number;
    backoff?: string;
  };
  idempotency_key?: string;
};

export type WorkflowDefinition = {
  name: string;
  trigger_event_name: string;
  steps: WorkflowStep[];
};

export type TriggerContext = {
  event_id: string;
  event_type: string;
  source: string;
  created_at: string;
  data: Record<string, unknown>;
};

export type StepOutput = Record<string, unknown>;

export function resolveTemplate(
  template: unknown,
  context: {
    trigger: TriggerContext;
    steps: Record<string, { output: StepOutput }>;
  }
): unknown {
  if (typeof template === "string") {
    const match = template.match(/^\{\{(.+)\}\}$/);
    if (!match) return template;

    const path = match[1].trim();
    return getPathValue(context, path);
  }

  if (Array.isArray(template)) {
    return template.map((item) => resolveTemplate(item, context));
  }

  if (template !== null && typeof template === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = resolveTemplate(value, context);
    }
    return result;
  }

  return template;
}

function getPathValue(
  context: {
    trigger: TriggerContext;
    steps: Record<string, { output: StepOutput }>;
  },
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
