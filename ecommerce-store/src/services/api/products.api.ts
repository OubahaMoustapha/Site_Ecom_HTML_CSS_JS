import { apiClient } from '@/services/http';

export const productsApi = {
	getAll(params?: Record<string, unknown>) {
		return apiClient.get('/products', {
			params,
		});
	},

	getById(id: number | string) {
		return apiClient.get(`/products/${id}`);
	},

	create(data: unknown) {
		return apiClient.post('/products', data);
	},

	update(id: number | string, data: unknown) {
		return apiClient.put(`/products/${id}`, data);
	},

	delete(id: number | string) {
		return apiClient.delete(`/products/${id}`);
	},
};