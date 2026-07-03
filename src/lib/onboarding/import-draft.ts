import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadSchemaByRef } from "./reference-manifests";
import type { OnboardingDraft } from "./generate-manifest";

type ImportDraftInput = {
  workspaceId: string;
  agentId?: string;
  draft: OnboardingDraft;
};

function resolveSchema(
  schemaRef: string,
  inlineSchemas: Record<string, object>
): object {
  const inline = inlineSchemas[schemaRef];
  if (inline) return inline;

  const bundled = loadSchemaByRef(schemaRef);
  if (bundled) return bundled;

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    description: `Placeholder schema for ${schemaRef} — review and refine.`,
    additionalProperties: true,
  };
}

export async function importManifestDraft(input: ImportDraftInput) {
  const { manifest, inline_schemas } = input.draft;
  const service = manifest.service as {
    id: string;
    name: string;
    type: string;
    category?: string;
  };

  if (!service?.id || !service?.type) {
    throw new Error("Manifest service alanı geçersiz");
  }

  let providerId: string | undefined;

  if (service.type === "saas_provider") {
    const baseUrl = String(manifest.base_url ?? "");
    const slug = service.id;

    const existing = await prisma.provider.findUnique({ where: { slug } });
    if (existing) {
      providerId = existing.id;
    } else if (baseUrl) {
      const created = await prisma.provider.create({
        data: {
          name: service.name,
          slug,
          category: service.category ?? "custom.v1",
          baseUrl,
          status: "active",
        },
      });
      providerId = created.id;
    }
  }

  const createdManifest = await prisma.manifest.create({
    data: {
      workspaceId:
        service.type === "customer_agent" ? input.workspaceId : null,
      providerId,
      agentId: service.type === "customer_agent" ? input.agentId : undefined,
      protocolVersion: String(manifest.protocol_version ?? "0.1"),
      version: "1.0.0",
      status: "active",
      manifestJson: manifest as Prisma.InputJsonValue,
    },
  });

  const capabilities = (manifest.capabilities ?? []) as Array<{
    name: string;
    category: string;
    risk_level: string;
    input_schema_ref: string;
    output_schema_ref: string;
    endpoints?: unknown;
    endpoint?: unknown;
    permissions?: string[];
  }>;

  for (const cap of capabilities) {
    await prisma.capability.create({
      data: {
        manifestId: createdManifest.id,
        name: cap.name,
        category: cap.category,
        riskLevel: cap.risk_level,
        inputSchemaJson: resolveSchema(
          cap.input_schema_ref,
          inline_schemas
        ) as Prisma.InputJsonValue,
        outputSchemaJson: resolveSchema(
          cap.output_schema_ref,
          inline_schemas
        ) as Prisma.InputJsonValue,
        endpointJson: cap.endpoints ?? cap.endpoint ?? {},
        permissionsJson: cap.permissions ?? [],
      },
    });
  }

  const events = (manifest.events ?? []) as Array<{
    name: string;
    schema_ref: string;
  }>;

  if (service.type === "customer_agent" && events.length > 0) {
    const agent =
      input.agentId
        ? await prisma.agent.findFirst({
            where: { id: input.agentId, workspaceId: input.workspaceId },
          })
        : await prisma.agent.findFirst({
            where: { workspaceId: input.workspaceId, status: "active" },
            orderBy: { createdAt: "asc" },
          });

    for (const evt of events) {
      await prisma.event.upsert({
        where: {
          workspaceId_name: {
            workspaceId: input.workspaceId,
            name: evt.name,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          agentId: agent?.id,
          name: evt.name,
          schemaJson: resolveSchema(evt.schema_ref, inline_schemas),
        },
        update: {
          schemaJson: resolveSchema(evt.schema_ref, inline_schemas),
          agentId: agent?.id,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      action: "onboarding.manifest_imported",
      resource: createdManifest.id,
      metadata: {
        service_id: service.id,
        service_type: service.type,
        capability_count: capabilities.length,
        event_count: events.length,
      },
    },
  });

  return {
    manifest: createdManifest,
    providerId,
    serviceId: service.id,
  };
}
