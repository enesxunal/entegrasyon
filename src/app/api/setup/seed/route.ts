import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

/**
 * One-time bootstrap seed for Vercel deploy.
 * Call once: POST /api/setup/seed with header X-Setup-Secret: <SEED_SECRET>
 * Providers are NOT pre-seeded — add via AI Kurulum.
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

  try {
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

    return apiSuccess({
      message: "Seed completed (no providers — use AI Kurulum for Zippr)",
      login: { email: "demo@uip.local", password: "password123" },
    });
  } catch (error) {
    console.error("Seed failed:", error);
    const message = error instanceof Error ? error.message : "Seed failed";
    return apiError(`Seed failed: ${message}`, 500);
  }
}
