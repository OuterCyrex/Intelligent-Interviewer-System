export interface ApiErrorPayload {
  message?: string;
}

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export function toQueryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function requestJson<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {})
  };

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    ...init
    ,
    headers: mergedHeaders
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore non-JSON error payloads
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
