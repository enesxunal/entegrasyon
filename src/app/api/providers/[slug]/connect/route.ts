import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { encryptSecret, maskSecret } from "@/lib/crypto/secrets";
import { z } from "zod";

type RouteParams = { params: Promise<{ slug: string }> };

const connectSchema = z.object({
  api_key: z.string().min(8),
  mode: z.enum(["test", "live"]).optional().default("test"),
});

function validateApiKeyForProvider(slug: string, apiKey: string): string | null {
  if (slug === "zippr_ink" && !/^zippr_(live|test)_[a-zA-Z0-9]+$/.test(apiKey)) {
    return "Geçersiz Zippr anahtarı. zippr_live_... veya zippr_test_... beklenir.";
  }
  return null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { slug } = await params;
  const body = await request.json();
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Geçersiz API anahtarı");
  }

  const keyError = validateApiKeyForProvider(slug, parsed.data.api_key);
  if (keyError) return apiError(keyError);

  const provider = await prisma.provider.findUnique({ where: { slug } });
  if (!provider) {
    return apiError(
      "Servis sağlayıcı bulunamadı. Önce AI Kurulum ile manifest ekleyin.",
      404
    );
  }

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
      slug: provider.slug,
      mode: parsed.data.mode,
      api_key_masked: maskSecret(parsed.data.api_key),
    },
  });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { slug } = await params;
  const provider = await prisma.provider.findUnique({ where: { slug } });
  if (!provider) return apiSuccess({ connected: false, exists: false });

  const connection = await prisma.connection.findFirst({
    where: {
      workspaceId: session.workspaceId,
      providerId: provider.id,
      status: "active",
    },
    include: {
      secrets: { where: { keyName: "api_key" }, take: 1 },
    },
  });

  if (!connection) {
    return apiSuccess({ connected: false, exists: true, provider: provider.name });
  }

  const metadata = connection.authMetadataJson as { mode?: string };

  return apiSuccess({
    connected: true,
    exists: true,
    provider: provider.name,
    connection: {
      id: connection.id,
      mode: metadata.mode ?? "test",
      has_api_key: connection.secrets.length > 0,
    },
  });
}
