import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const PROTOCOL_DIR = path.join(process.cwd(), "protocol");

function loadJson(relativePath: string) {
  const fullPath = path.join(PROTOCOL_DIR, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

function loadSchema(schemaRef: string) {
  return loadJson(`schemas/${schemaRef}.json`);
}

async function upsertAgentManifest(
  workspaceId: string,
  agentManifestJson: Prisma.InputJsonValue
) {
  const manifests = await prisma.manifest.findMany({
    where: { workspaceId },
  });

  const existing = manifests.find((m) => {
    const json = m.manifestJson as { service?: { id?: string } };
    return json.service?.id === "basic_site_agent";
  });

  if (existing) {
    return prisma.manifest.update({
      where: { id: existing.id },
      data: {
        protocolVersion: String((agentManifestJson as { protocol_version: string }).protocol_version),
        version: "1.0.0",
        status: "active",
        manifestJson: agentManifestJson,
      },
    });
  }

  return prisma.manifest.create({
    data: {
      workspaceId,
      protocolVersion: String((agentManifestJson as { protocol_version: string }).protocol_version),
      version: "1.0.0",
      status: "active",
      manifestJson: agentManifestJson,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@uip.local" },
    update: { passwordHash, name: "Demo User" },
    create: {
      email: "demo@uip.local",
      name: "Demo User",
      passwordHash,
    },
  });

  let workspace = await prisma.workspace.findFirst({
    where: { name: "Demo Workspace" },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Demo Workspace",
        billingPlan: "free",
      },
    });
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: { role: "owner" },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    },
  });

  const zipprProvider = await prisma.provider.upsert({
    where: { slug: "zippr_ink" },
    update: {
      name: "Zippr.ink",
      category: "media.v1",
      baseUrl: "https://zippr.ink",
      status: "active",
    },
    create: {
      name: "Zippr.ink",
      slug: "zippr_ink",
      category: "media.v1",
      baseUrl: "https://zippr.ink",
      status: "active",
    },
  });

  const zipprManifestJson = loadJson("manifests/zippr-ink.manifest.v1.json");

  const existingZipprManifest = await prisma.manifest.findFirst({
    where: { providerId: zipprProvider.id },
  });

  const zipprManifest = existingZipprManifest
    ? await prisma.manifest.update({
        where: { id: existingZipprManifest.id },
        data: {
          protocolVersion: zipprManifestJson.protocol_version,
          version: "1.0.0",
          status: "active",
          manifestJson: zipprManifestJson,
        },
      })
    : await prisma.manifest.create({
        data: {
          providerId: zipprProvider.id,
          protocolVersion: zipprManifestJson.protocol_version,
          version: "1.0.0",
          status: "active",
          manifestJson: zipprManifestJson,
        },
      });

  await prisma.capability.deleteMany({ where: { manifestId: zipprManifest.id } });

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
  const agentManifest = await upsertAgentManifest(workspace.id, agentManifestJson);

  await prisma.capability.deleteMany({ where: { manifestId: agentManifest.id } });

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
    await prisma.event.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: evt.name,
        },
      },
      update: {
        schemaJson: loadSchema(evt.schema_ref),
      },
      create: {
        workspaceId: workspace.id,
        name: evt.name,
        schemaJson: loadSchema(evt.schema_ref),
      },
    });
  }

  const workflowJson = loadJson("examples/zippr-workflow.example.json");

  const existingWorkflow = await prisma.workflow.findFirst({
    where: {
      workspaceId: workspace.id,
      name: workflowJson.name,
    },
  });

  if (existingWorkflow) {
    await prisma.workflow.update({
      where: { id: existingWorkflow.id },
      data: {
        triggerEventName: workflowJson.trigger_event_name,
        stepsJson: workflowJson.steps,
        status: "active",
      },
    });
  } else {
    await prisma.workflow.create({
      data: {
        workspaceId: workspace.id,
        name: workflowJson.name,
        triggerEventName: workflowJson.trigger_event_name,
        stepsJson: workflowJson.steps,
        status: "active",
      },
    });
  }

  console.log("Seed completed:");
  console.log(`  User: demo@uip.local / password123`);
  console.log(`  Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`  Provider: Zippr.ink`);
  console.log(`  Workflow: ${workflowJson.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
