import { NextRequest } from "next/server";
import {
  authenticateUser,
  createSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Geçersiz giriş bilgileri", 400);
  }

  const session = await authenticateUser(
    parsed.data.email,
    parsed.data.password
  );
  if (!session) {
    return apiError("E-posta veya şifre hatalı", 401);
  }

  const token = await createSession(session);
  await setSessionCookie(token);

  return apiSuccess({ user: { email: session.email } });
}
