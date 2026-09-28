import { apiClient } from '@/services/http';

export const brandsApi = {
	getAll(params?: Record<string, unknown>) {
		return apiClient.get('/brands', {
			params,
		});
	},

	getById(id: number | string) {
		return apiClient.get(`/brands/${id}`);
	},

	create(data: unknown) {
		return apiClient.post('/brands', data);
	},

	update(id: number | string, data: unknown) {
		return apiClient.put(`/brands/${id}`, data);
	},

	delete(id: number | string) {
		return apiClient.delete(`/brands/${id}`);
	},
};