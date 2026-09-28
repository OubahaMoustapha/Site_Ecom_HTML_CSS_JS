import { apiClient } from '@/services/http';

export const categoriesApi = {
	getAll(params?: Record<string, unknown>) {
		return apiClient.get('/categories', {
			params,
		});
	},

	getById(id: number | string) {
		return apiClient.get(`/categories/${id}`);
	},

	create(data: unknown) {
		return apiClient.post('/categories', data);
	},

	update(id: number | string, data: unknown) {
		return apiClient.put(`/categories/${id}`, data);
	},

	delete(id: number | string) {
		return apiClient.delete(`/categories/${id}`);
	},
};