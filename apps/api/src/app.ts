import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { AppError } from './lib/errors.js';
import { getPrisma } from './lib/prisma.js';
import { errorHandler } from './middleware/errors.js';
import { requireTrustedOrigin } from './middleware/origin.js';
import { registerRoutes } from './modules/routes.js';
export const app = express();
app.disable('x-powered-by');
if (env.TRUST_PROXY_HOPS) app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(cors({ origin: new URL(env.FRONTEND_URL).origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'CaseBridge API is running' }),
);
// Readiness for deploy health checks: reports booleans only, never URLs or secrets. AI is
// optional for readiness because matching already fails closed with 503 AI_UNAVAILABLE.
app.get('/api/health/ready', async (_req, res) => {
  const checks = {
    database: false,
    auth: Boolean(env.JWT_SECRET),
    aiConfigured: (process.env.AI_SERVICE_TOKEN?.length ?? 0) >= 32,
  };
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    // Unconfigured or unreachable database; reported below without details.
  }
  if (checks.database && checks.auth)
    res.json({ success: true, data: { ready: true, checks } });
  else
    res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Database or authentication is not ready',
        details: checks,
      },
    });
});
app.use('/api', requireTrustedOrigin);
registerRoutes(app);
app.use((_req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', 'Route not found')),
);
app.use(errorHandler);
