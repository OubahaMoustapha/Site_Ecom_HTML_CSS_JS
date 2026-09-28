import axios from 'axios';

import { defaultHeaders } from './headers';
import { setupInterceptors } from './interceptors';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  timeout: Number(import.meta.env.VITE_API_TIMEOUT),

  headers: defaultHeaders,
});

setupInterceptors(apiClient);