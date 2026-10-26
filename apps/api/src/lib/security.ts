import bcrypt from 'bcrypt';
import type { CookieOptions } from 'express';
import { env } from './env.js';
export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};
export async function hashPassword(password: string) {
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72)
    throw new Error(
      'Password must be at least 12 characters and at most 72 UTF-8 bytes',
    );
  return bcrypt.hash(password, 12);
}
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
