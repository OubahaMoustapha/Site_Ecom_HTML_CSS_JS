import { ApiRequestError } from "../services/apiClient";

/** Field errors from a 422 response, keyed by field name (first message only). */
export function fieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiRequestError) || !error.errors) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(error.errors).map(([field, messages]) => [field, messages[0] ?? ""])
    );
}

/** A single human-readable message for any error. */
export function errorMessage(error: unknown, fallback: string, tooMany?: string): string {
    if (error instanceof ApiRequestError) {
        if (error.status === 429 && tooMany) {
            return tooMany;
        }

        const first = error.errors && Object.values(error.errors)[0]?.[0];
        return first ?? error.message;
    }

    return fallback;
}
