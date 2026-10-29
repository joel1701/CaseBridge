import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { api, useMocks } from './client';
import { apiErrorCode } from './errors';
import type { ApiSuccess, AuthUser, Role } from '../types';

// Auth contract: docs/API_CONTRACT.md (POST /auth/login, GET /auth/me, POST /auth/logout).
// In mock mode nothing reaches the API: the seed's demo accounts sign in with a
// frontend-only password, and the signed-in user lives in sessionStorage.

export const MOCK_PASSWORD = 'synthetic-demo';

export const demoAccounts: {
  id: string;
  email: string;
  role: Role;
  bureauId: string | null;
}[] = [
  {
    id: 'PGRC-OFFICER',
    email: 'pgrc-officer@setu.example.invalid',
    role: 'OFFICER',
    bureauId: 'PGRC',
  },
  {
    id: 'PGRC-HEAD',
    email: 'pgrc-head@setu.example.invalid',
    role: 'BUREAU_HEAD',
    bureauId: 'PGRC',
  },
  {
    id: 'RB-OFFICER',
    email: 'rb-officer@setu.example.invalid',
    role: 'OFFICER',
    bureauId: 'RB',
  },
  {
    id: 'RB-HEAD',
    email: 'rb-head@setu.example.invalid',
    role: 'BUREAU_HEAD',
    bureauId: 'RB',
  },
  {
    id: 'ADMIN',
    email: 'admin@setu.example.invalid',
    role: 'ADMIN',
    bureauId: null,
  },
];

const STORE_KEY = 'setu.mockUser';

function readMockUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeMockUser(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(STORE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until reload.
  }
}

export class AuthError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function login(
  identifier: string,
  password: string,
): Promise<AuthUser> {
  const id = identifier.trim().toLowerCase();
  if (useMocks) {
    await new Promise((r) => setTimeout(r, 600));
    const account = demoAccounts.find(
      (a) => a.email === id || a.id.toLowerCase() === id,
    );
    if (!account || password !== MOCK_PASSWORD)
      throw new AuthError('INVALID_CREDENTIALS');
    const suffix = account.email.split('@')[0];
    const user: AuthUser = {
      id: `demo-user-${suffix}`,
      displayName: `Fictional ${suffix}`,
      role: account.role,
      bureauId: account.bureauId,
    };
    writeMockUser(user);
    return user;
  }
  const res = await api.post<ApiSuccess<{ user: AuthUser }>>('/auth/login', {
    email: id,
    password,
  });
  return res.data.data.user;
}

export async function getMe(): Promise<AuthUser | null> {
  if (useMocks) return readMockUser();
  try {
    return (await api.get<ApiSuccess<AuthUser>>('/auth/me')).data.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
}

export async function logout() {
  if (useMocks) {
    writeMockUser(null);
    return;
  }
  await api.post('/auth/logout', {});
}

// Maps any login failure to a code the form knows how to explain (see errors.ts).
export const authErrorCode = apiErrorCode;

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });
}
