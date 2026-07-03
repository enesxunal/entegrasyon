import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { z } from "zod";

const importSchema = z.object({
  manifest: z.record(z.unknown()).optional(),
  manifest_json: z.record(z.unknown()).optional(),
});

function loadSchema(schemaRef: string) {
  const filePath = path.join(
    process.cwd(),
    "protocol/schemas",
    `${schemaRef}.json`
  );
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid import payload");

  const manifestJson = (body.manifest ?? body.manifest_json) as Record<
    string,
    unknown
  >;
  if (!manifestJson?.protocol_version || !manifestJson?.service) {
    return apiError("Invalid manifest: missing protocol_version or service");
  }

  const service = manifestJson.service as { id: string; type: string };

  let providerId: string | undefined;
  if (service.type === "saas_provider") {
    const provider = await prisma.provider.findUnique({
      where: { slug: service.id },
    });
    providerId = provider?.id;
  }

  const manifest = await prisma.manifest.create({
    data: {
      workspaceId: service.type === "customer_agent" ? session.workspaceId : null,
      providerId,
      protocolVersion: String(manifestJson.protocol_version),
      version: "1.0.0",
      status: "active",
      manifestJson: manifestJson as Prisma.InputJsonValue,
    },
  });

  const capabilities = (manifestJson.capabilities ?? []) as Array<{
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
        manifestId: manifest.id,
        name: cap.name,
        category: cap.category,
        riskLevel: cap.risk_level,
        inputSchemaJson: loadSchema(cap.input_schema_ref),
        outputSchemaJson: loadSchema(cap.output_schema_ref),
        endpointJson: cap.endpoints ?? cap.endpoint ?? {},
        permissionsJson: cap.permissions ?? [],
      },
    });
  }

  return apiSuccess({ manifest, valid: true }, 201);
}
