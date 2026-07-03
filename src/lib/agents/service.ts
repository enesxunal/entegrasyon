import { prisma } from "@/lib/db";
import {
  generateAgentSecret,
  getSecretPrefix,
  hashAgentSecret,
} from "@/lib/crypto/agent-auth";
import { encryptSecret } from "@/lib/crypto/secrets";

export async function createAgentRecord(
  workspaceId: string,
  data: { name: string; type?: string }
) {
  const rawSecret = generateAgentSecret();
  const secretHash = await hashAgentSecret(rawSecret);
  const secretPrefix = getSecretPrefix(rawSecret);

  const agent = await prisma.agent.create({
    data: {
      workspaceId,
      name: data.name,
      type: data.type ?? "local_simulator",
      status: "active",
      secretHash,
      secretPrefix,
    },
  });

  await prisma.secret.create({
    data: {
      workspaceId,
      agentId: agent.id,
      keyName: "signing_key",
      encryptedValue: encryptSecret(rawSecret),
    },
  });

  return { agent, rawSecret };
}

export async function rotateAgentSecret(agentId: string, workspaceId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
  });
  if (!agent) return null;

  const rawSecret = generateAgentSecret();
  const secretHash = await hashAgentSecret(rawSecret);
  const secretPrefix = getSecretPrefix(rawSecret);

  await prisma.$transaction([
    prisma.agent.update({
      where: { id: agentId },
      data: { secretHash, secretPrefix },
    }),
    prisma.secret.deleteMany({
      where: { agentId, keyName: "signing_key" },
    }),
    prisma.secret.create({
      data: {
        workspaceId,
        agentId,
        keyName: "signing_key",
        encryptedValue: encryptSecret(rawSecret),
      },
    }),
  ]);

  return { agent, rawSecret };
}
