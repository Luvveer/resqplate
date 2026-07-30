const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const apiClient = {
  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...(body != undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || error?.error || "Request failed");
    }

    return response.json() as Promise<T>;
  },

  async requestFormData<T>(
    method: HttpMethod,
    path: string,
    formData: FormData,
  ): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);

      throw new Error(error?.message || error?.error || "Request failed");
    }
    return response.json() as Promise<T>;
  },
};
