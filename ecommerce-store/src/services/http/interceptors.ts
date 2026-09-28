import type { AxiosInstance } from 'axios';

import { handleApiError } from './error-handler';

export function setupInterceptors(client: AxiosInstance) {
	client.interceptors.request.use(
		(config) => {
			return config;
		},
		(error) => {
			return Promise.reject(error);
		},
	);

	client.interceptors.response.use(
		(response) => {
			return response;
		},
		(error) => {
			return handleApiError(error);
		},
	);
}