export const BASE_URL = "https://your-api-url.com"; // replace with env variable

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    status?: number;
    message?: string;
    raw?: any;
  };
}

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function apiRequest<T = any>(
  route: string,
  method: RequestMethod = "GET",
  body?: any,
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${route}`, options);

    let data: any = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          status: response.status,
          message: data?.message || "Request failed",
          raw: data,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.log("API ERROR:", error);

    return {
      success: false,
      error: {
        message: error?.message || "Network error",
        raw: error,
      },
    };
  }
}
