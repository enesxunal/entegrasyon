import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { encryptSecret, maskSecret } from "@/lib/crypto/secrets";
import { z } from "zod";

const schema = z.object({
  api_key: z
    .string()
    .regex(/^zippr_(live|test)_[a-zA-Z0-9]+$/),
  mode: z.enum(["test", "live"]),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Invalid API key format. Expected zippr_live_... or zippr_test_..."
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { slug: "zippr_ink" },
  });
  if (!provider) return apiError("Zippr.ink provider not found", 404);

  const existing = await prisma.connection.findFirst({
    where: {
      workspaceId: session.workspaceId,
      providerId: provider.id,
    },
  });

  let connectionId: string;

  if (existing) {
    const updated = await prisma.connection.update({
      where: { id: existing.id },
      data: {
        status: "active",
        authType: "api_key",
        authMetadataJson: { mode: parsed.data.mode },
      },
    });
    connectionId = updated.id;
    await prisma.secret.deleteMany({
      where: { connectionId, keyName: "api_key" },
    });
  } else {
    const created = await prisma.connection.create({
      data: {
        workspaceId: session.workspaceId,
        providerId: provider.id,
        status: "active",
        authType: "api_key",
        authMetadataJson: { mode: parsed.data.mode },
      },
    });
    connectionId = created.id;
  }

  await prisma.secret.create({
    data: {
      workspaceId: session.workspaceId,
      connectionId,
      keyName: "api_key",
      encryptedValue: encryptSecret(parsed.data.api_key),
    },
  });

  return apiSuccess({
    connection: {
      id: connectionId,
      provider: provider.name,
      mode: parsed.data.mode,
      api_key_masked: maskSecret(parsed.data.api_key),
    },
  });
}

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const provider = await prisma.provider.findUnique({
    where: { slug: "zippr_ink" },
  });
  if (!provider) return apiSuccess({ connected: false });

  const connection = await prisma.connection.findFirst({
    where: {
      workspaceId: session.workspaceId,
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

  if (!connection) return apiSuccess({ connected: false });

  const metadata = connection.authMetadataJson as { mode?: string };

  return apiSuccess({
    connected: true,
    connection: {
      id: connection.id,
      mode: metadata.mode ?? "test",
      has_api_key: connection.secrets.length > 0,
    },
  });
}
