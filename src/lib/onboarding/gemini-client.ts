type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export type GeminiGenerateOptions = {
  systemInstruction: string;
  userPrompt: string;
  jsonMode?: boolean;
};

export async function generateWithGemini(
  options: GeminiGenerateOptions
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY tanımlı değil. Vercel ortam değişkenlerine Google AI anahtarını ekleyin."
    );
  }

  const model = process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: {
      parts: [{ text: options.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: options.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    throw new Error(
      data.error?.message ?? `Google AI isteği başarısız (HTTP ${res.status})`
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Google AI boş yanıt döndü");
  }

  return text;
}

export function isOnboardingEnabled(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}
