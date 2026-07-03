export type ZipprMode = "real" | "mock";

export function getZipprMode(): ZipprMode {
  const mode = process.env.ZIPPR_MODE ?? "mock";
  return mode === "real" ? "real" : "mock";
}

export type ImageOptimizeInput = {
  image_url: string;
  quality?: number;
  format?: string;
  max_width?: number | null;
  max_height?: number | null;
  strip_metadata?: boolean;
};

export type ImageOptimizeResult = {
  job_id: string;
  original_url?: string;
  optimized_url: string;
  original_size_bytes?: number;
  optimized_size_bytes?: number;
  compression_ratio?: number;
  format?: string;
  width?: number;
  height?: number;
  status: "pending" | "processing" | "completed" | "failed";
};

export type ConnectionConfig = {
  apiKey: string;
  baseUrl?: string;
  mode?: "test" | "live";
};

export type ProviderError = {
  code: string;
  message: string;
  httpStatus?: number;
};

export type OptimizeResponse =
  | { ok: true; data: ImageOptimizeResult; httpStatus: number }
  | { ok: false; error: ProviderError };

function mockOptimizeImage(input: ImageOptimizeInput): ImageOptimizeResult {
  const jobId = `job_mock_${Date.now()}`;
  const optimizedUrl = input.image_url.replace(
    /(\.[^.]+)?$/,
    "-optimized.webp"
  );

  return {
    job_id: jobId,
    original_url: input.image_url,
    optimized_url: optimizedUrl.startsWith("http")
      ? optimizedUrl
      : `https://cdn.zippr.ink/mock/${jobId}.webp`,
    original_size_bytes: 850000,
    optimized_size_bytes: 210000,
    compression_ratio: 75.29,
    format: input.format ?? "webp",
    width: input.max_width ?? 1600,
    height: 900,
    status: "completed",
  };
}

async function realOptimizeImage(
  input: ImageOptimizeInput,
  config: ConnectionConfig
): Promise<OptimizeResponse> {
  const baseUrl = config.baseUrl ?? "https://zippr.ink";
  const url = `${baseUrl}/api/v1/images/optimize-url`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: input.image_url,
        quality: input.quality ?? 80,
        format: input.format ?? "webp",
        max_width: input.max_width ?? undefined,
        max_height: input.max_height ?? undefined,
        strip_metadata: input.strip_metadata ?? true,
      }),
    });

    const httpStatus = response.status;

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "provider_error",
          message: "Zippr.ink image optimization failed.",
          httpStatus,
        },
      };
    }

    const body = (await response.json()) as {
      success?: boolean;
      data?: {
        job_id?: string;
        optimized_url?: string;
        original_url?: string;
        compression_ratio?: number;
        original_size_bytes?: number;
        optimized_size_bytes?: number;
        format?: string;
        width?: number;
        height?: number;
        status?: string;
      };
    };

    if (!body.data?.job_id || !body.data?.optimized_url) {
      return {
        ok: false,
        error: {
          code: "provider_error",
          message: "Zippr.ink returned an invalid response.",
          httpStatus,
        },
      };
    }

    return {
      ok: true,
      httpStatus,
      data: {
        job_id: body.data.job_id,
        original_url: body.data.original_url ?? input.image_url,
        optimized_url: body.data.optimized_url,
        original_size_bytes: body.data.original_size_bytes,
        optimized_size_bytes: body.data.optimized_size_bytes,
        compression_ratio: body.data.compression_ratio,
        format: body.data.format ?? input.format,
        width: body.data.width,
        height: body.data.height,
        status:
          (body.data.status as ImageOptimizeResult["status"]) ?? "completed",
      },
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "provider_error",
        message: "Zippr.ink image optimization failed.",
      },
    };
  }
}

export async function optimizeImage(
  input: ImageOptimizeInput,
  config: ConnectionConfig
): Promise<OptimizeResponse> {
  const mode = getZipprMode();

  if (mode === "mock") {
    return {
      ok: true,
      httpStatus: 200,
      data: mockOptimizeImage(input),
    };
  }

  return realOptimizeImage(input, config);
}

export async function getOptimizationJob(
  input: { job_id: string },
  config: ConnectionConfig
): Promise<OptimizeResponse> {
  const mode = getZipprMode();

  if (mode === "mock") {
    return {
      ok: true,
      httpStatus: 200,
      data: {
        job_id: input.job_id,
        optimized_url: `https://cdn.zippr.ink/mock/${input.job_id}.webp`,
        status: "completed",
      },
    };
  }

  const baseUrl = config.baseUrl ?? "https://zippr.ink";
  const url = `${baseUrl}/api/v1/images/jobs/${encodeURIComponent(input.job_id)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    const httpStatus = response.status;

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "provider_error",
          message: "Zippr.ink job lookup failed.",
          httpStatus,
        },
      };
    }

    const body = (await response.json()) as {
      data?: {
        job_id?: string;
        optimized_url?: string;
        status?: string;
        compression_ratio?: number;
      };
    };

    if (!body.data?.job_id || !body.data?.optimized_url) {
      return {
        ok: false,
        error: {
          code: "provider_error",
          message: "Zippr.ink returned an invalid job response.",
          httpStatus,
        },
      };
    }

    return {
      ok: true,
      httpStatus,
      data: {
        job_id: body.data.job_id,
        optimized_url: body.data.optimized_url,
        compression_ratio: body.data.compression_ratio,
        status:
          (body.data.status as ImageOptimizeResult["status"]) ?? "completed",
      },
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "provider_error",
        message: "Zippr.ink job lookup failed.",
      },
    };
  }
}
