
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RequestConfig = {
    endpoint: string;
    method?: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
};

type ApiError = {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
};

class ApiRequestError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(error: ApiError) {
        super(error.message);

        this.name = "ApiRequestError";
        this.status = error.status;
        this.errors = error.errors;
    }
}

export default async function apiClient<T>(
    config: RequestConfig
): Promise<T> {
    let url = `${API_BASE_URL}${config.endpoint}`;

    if (config.query && Object.keys(config.query).length > 0) {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(config.query)) {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        }

        const queryString = params.toString();

        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const response = await fetch(url, {
        method: config.method ?? "GET",

        headers: {
            Accept: "application/json",
            ...(config.body !== undefined && {
                "Content-Type": "application/json",
            }),
            ...config.headers,
        },

        body: config.body !== undefined
            ? JSON.stringify(config.body)
            : undefined,
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

    const data: T = await response.json();
    return data;
}
