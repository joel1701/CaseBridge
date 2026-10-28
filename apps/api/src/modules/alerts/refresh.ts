/** Run from an OS/platform scheduler; no HTTP authentication bypass is exposed. */
import { getPrisma, disconnectPrisma } from '../../lib/prisma.js';
import { refreshAlerts } from './service.js';
async function run() {
  const db = getPrisma();
  const result = await refreshAlerts(db, {
    id: 'system-alert-monitor',
    role: 'ADMIN',
    bureauId: null,
  });
  const cutoff = new Date(Date.now() - 86400000);
  await db.authSession.deleteMany({ where: { expiresAt: { lt: cutoff } } });
  await db.loginThrottle.deleteMany({ where: { windowStart: { lt: cutoff } } });
  console.log(
    `Alert refresh completed: ${result.processed} complaints checked.`,
  );
}
run()
  .catch((error: unknown) => {
    // Codes only (e.g. P1001, DATABASE_NOT_CONFIGURED); messages may embed connection details.
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String(error.code)
        : 'UNKNOWN';
    console.error(
      `Alert refresh failed (${code}); inspect database connectivity and configuration.`,
    );
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
