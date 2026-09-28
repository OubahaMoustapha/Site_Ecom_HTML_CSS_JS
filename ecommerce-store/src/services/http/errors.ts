import axios from 'axios';

export type ApiError = {
	status: number | null;
	message: string;
	errors: Record<string, string[]> | null;
};

export function normalizeApiError(error: unknown): ApiError {
	if (!axios.isAxiosError(error)) {
		return {
			status: null,
			message: 'An unexpected error occurred.',
			errors: null,
		};
	}

	if (!error.response) {
		if (error.code === 'ECONNABORTED') {
			return {
				status: null,
				message: 'The request timed out.',
				errors: null,
			};
		}

		return {
			status: null,
			message: 'Unable to connect to the server.',
			errors: null,
		};
	}

	const { status, data } = error.response;

	return {
		status,
		message:
			typeof data?.message === 'string'
				? data.message
				: 'An error occurred while processing the request.',
		errors:
			data?.errors && typeof data.errors === 'object'
				? data.errors
				: null,
	};
}