import crypto from "crypto";
import { signAgentRequest } from "@/lib/crypto/agent-auth";
import { decryptSecret } from "@/lib/crypto/secrets";
import { prisma } from "@/lib/db";
import { handleAgentEvent } from "@/lib/agent/event-handler";
import type { TriggerContext } from "@/lib/workflow/template-resolver";

async function getAgentSigningKey(agentId: string): Promise<string | null> {
  const secret = await prisma.secret.findFirst({
    where: { agentId, keyName: "signing_key" },
  });
  if (!secret) return null;
  try {
    return decryptSecret(secret.encryptedValue);
  } catch {
    return null;
  }
}

export type ImageUploadedEventInput = {
  imageUrl: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
};

export async function triggerImageUploadedEvent(
  workspaceId: string,
  agentId: string,
  input: ImageUploadedEventInput
) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId, status: "active" },
  });
  if (!agent) {
    return { ok: false as const, error: "Agent not found", status: 404 };
  }

  const signingKey = await getAgentSigningKey(agentId);
  if (!signingKey) {
    return { ok: false as const, error: "Agent signing key missing", status: 500 };
  }

  const event: TriggerContext = {
    event_id: `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    event_type: "image.uploaded",
    source: "basic_site_agent",
    created_at: new Date().toISOString(),
    data: {
      image_url: input.imageUrl,
      filename: input.filename ?? "upload.jpg",
      mime_type: input.mimeType ?? "image/jpeg",
      size_bytes: input.sizeBytes ?? 500000,
    },
  };

  const rawBody = JSON.stringify(event);
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString("hex");
  const signature = signAgentRequest(signingKey, timestamp, nonce, rawBody);

  const result = await handleAgentEvent(
    agentId,
    timestamp,
    nonce,
    signature,
    rawBody,
    event
  );

  if (!result.ok) {
    return { ok: false as const, error: result.error, status: result.status };
  }

  return {
    ok: true as const,
    eventId: event.event_id,
    executionIds: result.executionIds,
  };
}

export async function getDefaultWebsiteAgent(workspaceId: string) {
  return prisma.agent.findFirst({
    where: { workspaceId, status: "active" },
    orderBy: { createdAt: "asc" },
  });
}
