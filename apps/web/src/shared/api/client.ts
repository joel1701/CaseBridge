import axios from 'axios';
// import.meta.env is Vite's; the guard lets Node scripts (tsx checks) import this module too.
const env = (import.meta.env ?? {}) as Partial<ImportMetaEnv>;
export const useMocks = env.VITE_USE_MOCKS === 'true';
export const api = axios.create({
  baseURL: env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000,
});
