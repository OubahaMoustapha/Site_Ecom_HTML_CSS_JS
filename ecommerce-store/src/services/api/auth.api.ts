import { apiClient } from '@/services/http';

export const authApi = {
	register(data: unknown) {
		return apiClient.post('/auth/register', data);
	},

	login(data: unknown) {
		return apiClient.post('/auth/login', data);
	},

	logout() {
		return apiClient.post('/auth/logout');
	},

	getMe() {
		return apiClient.get('/auth/me');
	},

	updateProfile(data: unknown) {
		return apiClient.put('/auth/profile', data);
	},

	changePassword(data: unknown) {
		return apiClient.put('/auth/change-password', data);
	},

	forgotPassword(data: unknown) {
		return apiClient.post('/auth/forgot-password', data);
	},

	resetPassword(data: unknown) {
		return apiClient.post('/auth/reset-password', data);
	},

	verifyEmail(id: string | number, hash: string) {
		return apiClient.get(`/auth/email/verify/${id}/${hash}`);
	},

	resendVerification() {
		return apiClient.post('/auth/email/resend');
	},
};