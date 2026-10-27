import { randomUUID, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { env } from '../../lib/env.js';
import { AppError } from '../../lib/errors.js';
import { verifyPassword } from '../../lib/security.js';
// Same cost as real credentials; nonexistent accounts still perform a password comparison.
const dummyHash = bcrypt.hash('unusable-' + randomUUID(), 12);
export const publicUser = (u: {
  id: string;
  displayName: string;
  role: string;
  bureauId: string | null;
}) => ({
  id: u.id,
  displayName: u.displayName,
  role: u.role,
  bureauId: u.bureauId,
});
export async function login(
  db: PrismaClient,
  email: string,
  password: string,
  ip: string,
) {
  if (!env.JWT_SECRET)
    throw new AppError(
      503,
      'AUTH_NOT_CONFIGURED',
      'Authentication is not configured',
    );
  // Atomic database counters work across API workers. Never store raw addresses/email in throttle keys.
  const throttleKey = (raw: string) =>
    createHash('sha256').update(raw).digest('hex');
  for (const [raw, maximum] of [
    [`ip:${ip}`, 60],
    [`account:${email}`, 10],
  ] as const) {
    const key = throttleKey(raw);
    const rows = await db.$queryRaw<
      Array<{ attempts: number }>
    >`INSERT INTO "LoginThrottle" ("key","attempts","windowStart") VALUES (${key},1,NOW()) ON CONFLICT ("key") DO UPDATE SET "attempts" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN 1 ELSE "LoginThrottle"."attempts"+1 END, "windowStart" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE "LoginThrottle"."windowStart" END RETURNING "attempts"`;
    if (rows[0].attempts > maximum)
      throw new AppError(
        429,
        'RATE_LIMITED',
        'Too many sign-in attempts; retry after 15 minutes',
      );
  }
  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!valid || !user?.active || (user.role !== 'ADMIN' && !user.bureauId))
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  const id = randomUUID();
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    jwtid: id,
    issuer: 'casebridge-api',
    audience: 'casebridge-web',
    algorithm: 'HS256',
    expiresIn: '8h',
  });
  await db.$transaction(async (tx) => {
    await tx.authSession.create({
      data: {
        id,
        userId: user.id,
        expiresAt: new Date(Date.now() + 8 * 3600000),
      },
    });
    await tx.auditLog.create({
      data: { actorId: user.id, event: 'AUTH_LOGIN', metadata: {} },
    });
    // Only a correct password clears the account counter; the per-IP window keeps counting.
    await tx.loginThrottle.deleteMany({
      where: { key: throttleKey(`account:${email}`) },
    });
  });
  return { token, user: publicUser(user) };
}
export async function logout(db: PrismaClient, token: unknown) {
  if (typeof token !== 'string' || !env.JWT_SECRET) return;
  let claims: jwt.JwtPayload;
  try {
    const value = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'casebridge-api',
      audience: 'casebridge-web',
    });
    if (typeof value === 'string' || !value.jti || !value.sub) return;
    claims = value;
  } catch {
    return;
  }
  await db.$transaction(async (tx) => {
    const revoked = await tx.authSession.updateMany({
      where: { id: claims.jti, userId: claims.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count)
      await tx.auditLog.create({
        data: { actorId: claims.sub!, event: 'AUTH_LOGOUT', metadata: {} },
      });
  });
}
