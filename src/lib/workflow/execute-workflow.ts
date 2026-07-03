import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto/secrets";
import { optimizeImage } from "@/connectors/zippr-ink";
import { simulateImageReplace } from "@/lib/capabilities/basic-site-agent";
import { validateAgainstSchema } from "@/lib/validation/schema-validator";
import {
  resolveTemplate,
  type TriggerContext,
  type WorkflowStep,
} from "@/lib/workflow/template-resolver";

export type ExecuteWorkflowInput = {
  workspaceId: string;
  workflowId: string;
  agentId?: string;
  trigger: TriggerContext;
};

async function getZipprConnectionConfig(workspaceId: string) {
  const provider = await prisma.provider.findUnique({
    where: { slug: "zippr_ink" },
  });
  if (!provider) return null;

  const connection = await prisma.connection.findFirst({
    where: {
      workspaceId,
      providerId: provider.id,
      status: "active",
    },
    include: {
      secrets: {
        where: { keyName: "api_key" },
        take: 1,
      },
    },
  });

  if (!connection?.secrets[0]) return null;

  const apiKey = decryptSecret(connection.secrets[0].encryptedValue);
  const metadata = connection.authMetadataJson as { mode?: "test" | "live" };

  return {
    apiKey,
    baseUrl: provider.baseUrl,
    mode: metadata.mode ?? "test",
  };
}

async function executeStep(
  step: WorkflowStep,
  context: {
    trigger: TriggerContext;
    steps: Record<string, { output: Record<string, unknown> }>;
  },
  workspaceId: string
): Promise<{
  ok: boolean;
  output?: Record<string, unknown>;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
}> {
  const resolvedInput = resolveTemplate(step.input, context) as Record<
    string,
    unknown
  >;

  const handlerKey = `${step.service}.${step.capability}`;

  if (handlerKey === "zippr_ink.image.optimize") {
    const validation = validateAgainstSchema(
      "media.image_optimize_request.v1",
      resolvedInput
    );
    if (!validation.valid) {
      return {
        ok: false,
        errorCode: "schema_validation_error",
        errorMessage: "Invalid image.optimize input",
      };
    }

    const config = await getZipprConnectionConfig(workspaceId);
    if (!config) {
      return {
        ok: false,
        errorCode: "connection_missing",
        errorMessage: "Zippr.ink connection not configured for this workspace.",
      };
    }

    const result = await optimizeImage(
      {
        image_url: String(resolvedInput.image_url),
        quality: resolvedInput.quality as number | undefined,
        format: resolvedInput.format as string | undefined,
        max_width: resolvedInput.max_width as number | null | undefined,
        max_height: resolvedInput.max_height as number | null | undefined,
        strip_metadata: resolvedInput.strip_metadata as boolean | undefined,
      },
      config
    );

    if (!result.ok) {
      return {
        ok: false,
        httpStatus: result.error.httpStatus,
        errorCode: result.error.code,
        errorMessage: result.error.message,
      };
    }

    const outputValidation = validateAgainstSchema(
      "media.image_optimize_result.v1",
      result.data
    );
    if (!outputValidation.valid) {
      return {
        ok: false,
        errorCode: "schema_validation_error",
        errorMessage: "Invalid image.optimize output",
      };
    }

    return {
      ok: true,
      output: result.data as unknown as Record<string, unknown>,
      httpStatus: result.httpStatus,
    };
  }

  if (handlerKey === "basic_site_agent.image.replace") {
    const validation = validateAgainstSchema(
      "media.image_replace_request.v1",
      resolvedInput
    );
    if (!validation.valid) {
      return {
        ok: false,
        errorCode: "schema_validation_error",
        errorMessage: "Invalid image.replace input",
      };
    }

    const output = simulateImageReplace({
      old_image_url: String(resolvedInput.old_image_url),
      new_image_url: String(resolvedInput.new_image_url),
      job_id: resolvedInput.job_id as string | undefined,
      metadata: resolvedInput.metadata as Record<string, unknown> | undefined,
    });

    const outputValidation = validateAgainstSchema(
      "standard.operation_result.v1",
      output
    );
    if (!outputValidation.valid) {
      return {
        ok: false,
        errorCode: "schema_validation_error",
        errorMessage: "Invalid image.replace output",
      };
    }

    return { ok: true, output: output as unknown as Record<string, unknown> };
  }

  return {
    ok: false,
    errorCode: "unsupported_capability",
    errorMessage: `Unsupported capability: ${handlerKey}`,
  };
}

export async function executeWorkflow(input: ExecuteWorkflowInput) {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: input.workflowId,
      workspaceId: input.workspaceId,
      status: "active",
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found or not active");
  }

  const eventValidation = validateAgainstSchema(
    "media.image_uploaded_event.v1",
    input.trigger
  );
  if (!eventValidation.valid) {
    throw new Error("Invalid event payload");
  }

  const steps = workflow.stepsJson as WorkflowStep[];
  const startedAt = new Date();

  const execution = await prisma.execution.create({
    data: {
      workspaceId: input.workspaceId,
      workflowId: workflow.id,
      agentId: input.agentId,
      status: "running",
      startedAt,
    },
  });

  const stepContext: {
    trigger: TriggerContext;
    steps: Record<string, { output: Record<string, unknown> }>;
  } = {
    trigger: input.trigger,
    steps: {},
  };

  try {
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      const stepStart = Date.now();

      const maxAttempts = step.retry?.max_attempts ?? 1;
      let lastResult: Awaited<ReturnType<typeof executeStep>> | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        lastResult = await executeStep(step, stepContext, input.workspaceId);
        if (lastResult.ok) break;
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
        }
      }

      const durationMs = Date.now() - stepStart;
      const result = lastResult!;

      await prisma.executionStep.create({
        data: {
          executionId: execution.id,
          stepIndex: index,
          stepId: step.id,
          stepName: step.name,
          capabilityName: step.capability,
          providerSlug: step.service,
          status: result.ok ? "completed" : "failed",
          durationMs,
          httpStatus: result.httpStatus,
          errorCode: result.errorCode,
          errorMessageSafe: result.errorMessage,
        },
      });

      if (!result.ok) {
        const finishedAt = new Date();
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: "failed",
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            errorCode: result.errorCode,
            errorMessageSafe: result.errorMessage,
          },
        });
        return execution.id;
      }

      stepContext.steps[step.id] = { output: result.output! };
    }

    const finishedAt = new Date();
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: "completed",
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    });

    return execution.id;
  } catch (error) {
    const finishedAt = new Date();
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: "failed",
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        errorCode: "execution_error",
        errorMessageSafe:
          error instanceof Error ? error.message : "Workflow execution failed",
      },
    });
    throw error;
  }
}

export async function processEventForWorkspace(
  workspaceId: string,
  agentId: string,
  trigger: TriggerContext
) {
  const workflows = await prisma.workflow.findMany({
    where: {
      workspaceId,
      triggerEventName: trigger.event_type,
      status: "active",
    },
  });

  const executionIds: string[] = [];

  for (const workflow of workflows) {
    const id = await executeWorkflow({
      workspaceId,
      workflowId: workflow.id,
      agentId,
      trigger,
    });
    executionIds.push(id);
  }

  return executionIds;
}
