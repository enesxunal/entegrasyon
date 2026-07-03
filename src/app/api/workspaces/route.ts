import { NextRequest } from "next/server";
import { requireSession, isSession, apiError, apiSuccess } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid workspace name");

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId: session.userId,
          role: "owner",
        },
      },
    },
  });

  return apiSuccess({ workspace }, 201);
}
