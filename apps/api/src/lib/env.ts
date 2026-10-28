import 'dotenv/config';
import { z } from 'zod';
const optional = (value: unknown) => (value === '' ? undefined : value);
export const env = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    FRONTEND_URL: z.url().default('http://localhost:5173'),
    AI_SERVICE_URL: z.url().default('http://localhost:8000'),
    DATABASE_URL: z.preprocess(optional, z.string().min(1).optional()),
    JWT_SECRET: z.preprocess(optional, z.string().min(32).optional()),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  })
  .parse(process.env);
if (env.NODE_ENV === 'production' && !env.JWT_SECRET)
  throw new Error('JWT_SECRET is required in production');
if (env.COOKIE_SAME_SITE === 'none' && env.NODE_ENV !== 'production')
  throw new Error('SameSite=None requires production HTTPS');
