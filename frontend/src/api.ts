export type RecordData = { id: number; [key: string]: any };
export type User = {
  id: number;
  username: string;
  role: "Admin" | "Pharmacist" | "Patient" | null;
  first_name: string;
  last_name: string;
  email: string;
};
export class ApiError extends Error {
  constructor(
    public code: string,
    public fields: string[] = [],
  ) {
    super(code);
  }
}
export async function api(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (method !== "GET") {
      const res = await fetch("/api/auth/csrf/", {
        credentials: "same-origin",
      });
      if (!res.ok) throw new ApiError("offline");
      headers["X-CSRFToken"] = (await res.json()).csrfToken;
    }
    const res = await fetch("/api/" + path, {
      method,
      credentials: "same-origin",
      headers,
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new ApiError(
        typeof body.code === "string"
          ? body.code
          : res.status === 429
            ? "rateLimited"
            : res.status === 403
              ? "unauthorized"
              : "validation",
        Object.keys(body),
      );
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("offline");
  }
}
