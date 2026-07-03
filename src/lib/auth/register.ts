import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAgentRecord } from "@/lib/agents/service";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const PROTOCOL_DIR = path.join(process.cwd(), "protocol");

function loadJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(PROTOCOL_DIR, relativePath), "utf-8"));
}

function loadSchema(schemaRef: string) {
  return loadJson(`schemas/${schemaRef}.json`);
}

export async function registerWorkspace(input: {
  email: string;
  password: string;
  workspaceName: string;
  siteUrl?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    return { ok: false as const, error: "Bu e-posta zaten kayıtlı" };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.workspaceName,
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: input.workspaceName,
      billingPlan: "free",
    },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    },
  });

  const { agent, rawSecret } = await createAgentRecord(workspace.id, {
    name: input.siteUrl ? `Agent for ${input.siteUrl}` : "Website Agent",
    type: "local_simulator",
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
        agentId: agent.id,
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

  const session = {
    userId: user.id,
    workspaceId: workspace.id,
    email: user.email,
  };

  const token = await createSession(session);
  await setSessionCookie(token);

  return {
    ok: true as const,
    user: { email: user.email, id: user.id },
    workspace: { id: workspace.id, name: workspace.name },
    agent: { id: agent.id, secretPrefix: agent.secretPrefix },
    agentSecret: rawSecret,
  };
}
