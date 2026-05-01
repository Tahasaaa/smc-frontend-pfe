const AUTH_API_BASE_URL = "http://127.0.0.1:8000/api";
const KPI_API_BASE_URL = "http://127.0.0.1:8001/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  query?: Record<string, QueryValue>;
  baseUrl?: string;
};

function buildUrl(
  baseUrl: string,
  endpoint: string,
  query?: RequestOptions["query"]
) {
  const url = new URL(`${baseUrl}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function getStoredToken() {
  return localStorage.getItem("token");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    query,
    baseUrl = AUTH_API_BASE_URL,
  } = options;

  const authToken = token || getStoredToken();
  const url = buildUrl(baseUrl, endpoint, query);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      `Network error while calling ${endpoint}. Check that the service is running and CORS is configured.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pending_verification_email");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      data?.error ||
      `Request failed: ${response.status} ${response.statusText} for ${endpoint}`;

    throw new Error(message);
  }

  return data as T;
}

export { AUTH_API_BASE_URL, KPI_API_BASE_URL };