import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { AppError } from './lib/errors.js';
import { errorHandler } from './middleware/errors.js';
import { requireTrustedOrigin } from './middleware/origin.js';
import { registerRoutes } from './modules/routes.js';
export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: new URL(env.FRONTEND_URL).origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'CaseBridge API is running' }),
);
app.use('/api', requireTrustedOrigin);
registerRoutes(app);
app.use((_req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', 'Route not found')),
);
app.use(errorHandler);
