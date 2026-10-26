import axios from 'axios';
export const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000,
});
