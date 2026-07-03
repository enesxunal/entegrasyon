import { NextRequest } from "next/server";
import { registerProviderWorkspace } from "@/lib/auth/register";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  company_name: z.string().min(2),
  service_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Geçersiz kayıt bilgileri");
  }

  const result = await registerProviderWorkspace({
    email: parsed.data.email,
    password: parsed.data.password,
    companyName: parsed.data.company_name,
    serviceUrl: parsed.data.service_url,
  });

  if (!result.ok) {
    return apiError(result.error, 409);
  }

  return apiSuccess(
    {
      user: result.user,
      workspace: result.workspace,
      message:
        "Sağlayıcı hesabı oluşturuldu. Sırada: AI Kurulum ile servisinizi ekosisteme tanıtın.",
      next_step: "/dashboard/onboarding",
    },
    201
  );
}
