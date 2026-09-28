import { normalizeApiError } from './errors';

export function handleApiError(error: unknown): Promise<never> {
	const apiError = normalizeApiError(error);

	return Promise.reject(apiError);
}