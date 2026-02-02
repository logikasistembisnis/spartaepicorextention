type ApiFetchOptions = RequestInit & {
  requireLicense?: boolean;
  authHeader?: string;
  apiMode?: "strict" | "epicor";
};

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  const isProd = process.env.NEXT_PUBLIC_ENV === "production";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY!,
  };

  // Authorization dari cookie (jika ada)
  if (options.authHeader) {
    headers["Authorization"] = options.authHeader;
  }

  // License hanya di production
  if (isProd && options.requireLicense) {
    headers["License"] = process.env.NEXT_PUBLIC_LICENSE_KEY!;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  // DEFAULT: STRICT
  if (!response.ok && options.apiMode !== "epicor") {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response;
}
