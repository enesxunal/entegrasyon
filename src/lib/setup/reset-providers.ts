import { prisma } from "@/lib/db";

/**
 * Removes all global SaaS providers and their manifests from the ecosystem.
 * Customer workspace agents/manifests are kept.
 */
export async function resetProvidersEcosystem() {
  const providers = await prisma.provider.findMany({ select: { id: true } });
  const providerIds = providers.map((p) => p.id);

  if (providerIds.length === 0) {
    return { deletedProviders: 0, deletedManifests: 0 };
  }

  const providerManifests = await prisma.manifest.findMany({
    where: { providerId: { in: providerIds } },
    select: { id: true },
  });
  const manifestIds = providerManifests.map((m) => m.id);

  if (manifestIds.length > 0) {
    await prisma.capability.deleteMany({
      where: { manifestId: { in: manifestIds } },
    });
  }

  await prisma.secret.deleteMany({
    where: { connection: { providerId: { in: providerIds } } },
  });

  await prisma.connection.deleteMany({
    where: { providerId: { in: providerIds } },
  });

  const deletedManifests = await prisma.manifest.deleteMany({
    where: { providerId: { in: providerIds } },
  });

  const deletedProviders = await prisma.provider.deleteMany({
    where: { id: { in: providerIds } },
  });

  return {
    deletedProviders: deletedProviders.count,
    deletedManifests: deletedManifests.count,
  };
}
