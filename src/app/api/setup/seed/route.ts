import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

/**
 * One-time bootstrap seed for Vercel deploy.
 * Call once: POST /api/setup/seed with header X-Setup-Secret: <SEED_SECRET>
 * Then remove SEED_SECRET or leave unset in production.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return apiError("SEED_SECRET not configured", 403);
  }

  const header = request.headers.get("x-setup-secret");
  if (header !== secret) {
    return apiError("Unauthorized", 401);
  }

  const existing = await prisma.user.findUnique({
    where: { email: "demo@uip.local" },
  });
  if (existing) {
    return apiSuccess({ message: "Already seeded", skipped: true });
  }

  const PROTOCOL_DIR = path.join(process.cwd(), "protocol");
  const loadJson = (p: string) =>
    JSON.parse(fs.readFileSync(path.join(PROTOCOL_DIR, p), "utf-8"));
  const loadSchema = (ref: string) => loadJson(`schemas/${ref}.json`);

  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@uip.local",
      name: "Demo User",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: { name: "Demo Workspace", billingPlan: "free" },
  });

  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: user.id, role: "owner" },
  });

  const zipprProvider = await prisma.provider.upsert({
    where: { slug: "zippr_ink" },
    update: {},
    create: {
      name: "Zippr.ink",
      slug: "zippr_ink",
      category: "media.v1",
      baseUrl: "https://zippr.ink",
      status: "active",
    },
  });

  const zipprManifestJson = loadJson("manifests/zippr-ink.manifest.v1.json");
  const zipprManifest = await prisma.manifest.create({
    data: {
      providerId: zipprProvider.id,
      protocolVersion: zipprManifestJson.protocol_version,
      version: "1.0.0",
      status: "active",
      manifestJson: zipprManifestJson,
    },
  });

  for (const cap of zipprManifestJson.capabilities) {
    await prisma.capability.create({
      data: {
        manifestId: zipprManifest.id,
        name: cap.name,
        category: cap.category,
        riskLevel: cap.risk_level,
        inputSchemaJson: loadSchema(cap.input_schema_ref),
        outputSchemaJson: loadSchema(cap.output_schema_ref),
        endpointJson: cap.endpoints ?? cap.endpoint ?? {},
        authRequirementJson: zipprManifestJson.auth,
        permissionsJson: cap.permissions ?? [],
      },
    });
  }

  const agentManifestJson = loadJson("manifests/basic-site-agent.manifest.v1.json");
  const agentManifest = await prisma.manifest.create({
    data: {
      workspaceId: workspace.id,
      protocolVersion: agentManifestJson.protocol_version,
      version: "1.0.0",
      status: "active",
      manifestJson: agentManifestJson,
    },
  });

  for (const cap of agentManifestJson.capabilities) {
    await prisma.capability.create({
      data: {
        manifestId: agentManifest.id,
        name: cap.name,
        category: cap.category,
        riskLevel: cap.risk_level,
        inputSchemaJson: loadSchema(cap.input_schema_ref),
        outputSchemaJson: loadSchema(cap.output_schema_ref),
        endpointJson: {},
        permissionsJson: cap.permissions ?? [],
      },
    });
  }

  for (const evt of agentManifestJson.events) {
    await prisma.event.create({
      data: {
        workspaceId: workspace.id,
        name: evt.name,
        schemaJson: loadSchema(evt.schema_ref),
      },
    });
  }

  const workflowJson = loadJson("examples/zippr-workflow.example.json");
  await prisma.workflow.create({
    data: {
      workspaceId: workspace.id,
      name: workflowJson.name,
      triggerEventName: workflowJson.trigger_event_name,
      stepsJson: workflowJson.steps,
      status: "active",
    },
  });

  return apiSuccess({
    message: "Seed completed",
    login: { email: "demo@uip.local", password: "password123" },
  });
}
