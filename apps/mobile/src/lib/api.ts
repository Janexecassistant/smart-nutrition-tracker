import Constants from "expo-constants";

const API_BASE =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3001";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T = any>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${API_BASE}/api${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }

    const res = await fetch(url, { headers: this.getHeaders() });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body);
    }

    return res.json();
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data);
    }

    return res.json();
  }

  async put<T = any>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data);
    }

    return res.json();
  }

  async delete<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data);
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
