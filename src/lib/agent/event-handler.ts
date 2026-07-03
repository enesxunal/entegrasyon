import { prisma } from "@/lib/db";
import {
  isTimestampValid,
  verifyAgentSignature,
} from "@/lib/crypto/agent-auth";
import { decryptSecret } from "@/lib/crypto/secrets";
import { validateAgainstSchema } from "@/lib/validation/schema-validator";
import { processEventForWorkspace } from "@/lib/workflow/execute-workflow";
import type { TriggerContext } from "@/lib/workflow/template-resolver";

const NONCE_CLEANUP_AGE_MS = 10 * 60 * 1000;

async function getAgentSigningKey(agentId: string): Promise<string | null> {
  const secret = await prisma.secret.findFirst({
    where: {
      agentId,
      keyName: "signing_key",
    },
  });
  if (!secret) return null;
  try {
    return decryptSecret(secret.encryptedValue);
  } catch {
    return null;
  }
}

export async function validateAgentEventRequest(
  agentId: string,
  timestamp: string,
  nonce: string,
  signature: string,
  rawBody: string
): Promise<
  | { ok: true; agent: { id: string; workspaceId: string } }
  | { ok: false; status: number; error: string }
> {
  if (!isTimestampValid(timestamp)) {
    return { ok: false, status: 401, error: "Timestamp expired or invalid" };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent || agent.status !== "active") {
    return { ok: false, status: 401, error: "Agent not found or disabled" };
  }

  const existingNonce = await prisma.usedNonce.findUnique({
    where: {
      agentId_nonce: { agentId, nonce },
    },
  });

  if (existingNonce) {
    return { ok: false, status: 401, error: "Nonce already used" };
  }

  const signingKey = await getAgentSigningKey(agentId);
  if (!signingKey) {
    return { ok: false, status: 401, error: "Agent signing key not found" };
  }

  if (!verifyAgentSignature(signingKey, timestamp, nonce, rawBody, signature)) {
    return { ok: false, status: 401, error: "Invalid signature" };
  }

  await prisma.usedNonce.create({
    data: {
      agentId,
      nonce,
      timestamp: new Date(Number(timestamp)),
    },
  });

  await prisma.usedNonce.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - NONCE_CLEANUP_AGE_MS) },
    },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { lastSeenAt: new Date() },
  });

  return {
    ok: true,
    agent: { id: agent.id, workspaceId: agent.workspaceId },
  };
}

export async function handleAgentEvent(
  agentId: string,
  timestamp: string,
  nonce: string,
  signature: string,
  rawBody: string,
  event: TriggerContext
) {
  const validation = validateAgainstSchema(
    "media.image_uploaded_event.v1",
    event
  );
  if (!validation.valid) {
    return { ok: false as const, status: 400, error: "Invalid event schema" };
  }

  const auth = await validateAgentEventRequest(
    agentId,
    timestamp,
    nonce,
    signature,
    rawBody
  );

  if (!auth.ok) {
    return { ok: false as const, status: auth.status, error: auth.error };
  }

  const executionIds = await processEventForWorkspace(
    auth.agent.workspaceId,
    auth.agent.id,
    event
  );

  return {
    ok: true as const,
    executionIds,
  };
}
