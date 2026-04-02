const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
    let url = `${API_BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }

    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json());
    }

    return res.json();
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json());
    }

    return res.json();
  }

  async put<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json());
    }

    return res.json();
  }

  async delete<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new ApiError(res.status, await res.json());
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
