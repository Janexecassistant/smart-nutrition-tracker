// Normalise the base URL so callers don't have to care whether the env var
// was configured with or without a trailing "/api". We always want the host
// (no trailing slash) and then prepend "/api" ourselves — same convention
// as apps/mobile/src/lib/api.ts.
function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  // strip trailing slash(es) and a trailing "/api" so we end up with just the host
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const API_BASE = resolveApiBase();

function buildUrl(path: string, params?: Record<string, string>): string {
  // Ensure path starts with a single leading slash
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE}/api${normalisedPath}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }
  return url;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
    const res = await fetch(buildUrl(path, params), {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => ({})));
    }

    return res.json();
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => ({})));
    }

    return res.json();
  }

  async put<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(path), {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => ({})));
    }

    return res.json();
  }

  async patch<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => ({})));
    }

    return res.json();
  }

  async delete<T = any>(path: string): Promise<T> {
    const res = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json().catch(() => ({})));
    }

    return res.json();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: any
  ) {
    super(body?.error || `API error ${status}`);
  }
}

export const api = new ApiClient();
