
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const TOKEN_STORAGE_KEY = "durra.token";

type RequestConfig = {
    endpoint: string;
    method?: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
    responseType?: "json" | "blob";
};

type ApiError = {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(error: ApiError) {
        super(error.message);

        this.name = "ApiRequestError";
        this.status = error.status;
        this.errors = error.errors;
    }
}

function readToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export default async function apiClient<T>(
    config: RequestConfig
): Promise<T> {
    let url = `${API_BASE_URL}${config.endpoint}`;

    if (config.query && Object.keys(config.query).length > 0) {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(config.query)) {
            if (value !== undefined && value !== null && value !== "") {
                params.append(key, String(value));
            }
        }

        const queryString = params.toString();

        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const isFormData = config.body instanceof FormData;
    const token = readToken();

    const response = await fetch(url, {
        method: config.method ?? "GET",

        headers: {
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(config.body !== undefined && !isFormData && {
                "Content-Type": "application/json",
            }),
            ...config.headers,
        },

        body: config.body === undefined
            ? undefined
            : isFormData
                ? config.body as FormData
                : JSON.stringify(config.body),
    });

    if (!response.ok) {
        const errorData: ApiError = {
            status: response.status,
            message: `HTTP Error: ${response.status}`,
        };

        try {
            const data: unknown = await response.json();

            if (typeof data === "object" && data !== null) {
                const errorBody = data as {
                    message?: unknown;
                    errors?: unknown;
                };

                if (typeof errorBody.message === "string") {
                    errorData.message = errorBody.message;
                }

                if (
                    typeof errorBody.errors === "object"
                    && errorBody.errors !== null
                    && !Array.isArray(errorBody.errors)
                ) {
                    errorData.errors = errorBody.errors as Record<string, string[]>;
                }
            }
        } catch {
            // Keep the default error message.
        }

        throw new ApiRequestError(errorData);
    }

    if (config.responseType === "blob") {
        return await response.blob() as T;
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const data: T = await response.json();
    return data;
}
