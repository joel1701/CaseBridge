import type { Express } from 'express';
import { router as auth } from './auth/routes.js';
import { router as complaints } from './complaints/routes.js';
import { router as institutions } from './institutions/routes.js';
import { router as alerts } from './alerts/routes.js';
import { router as reports } from './reports/routes.js';
import { router as casehistory } from './case-history/routes.js';
import { router as matching } from './matching/routes.js';
import { router as caselinks } from './case-links/routes.js';
import { router as graph } from './graph/routes.js';
import { router as actionfirewall } from './action-firewall/routes.js';
import { router as coordination } from './coordination/routes.js';
export function registerRoutes(app: Express) {
  app.use('/api', auth);
  app.use('/api', complaints);
  app.use('/api', institutions);
  app.use('/api', alerts);
  app.use('/api', reports);
  app.use('/api', casehistory);
  app.use('/api', matching);
  app.use('/api', caselinks);
  app.use('/api', graph);
  app.use('/api', actionfirewall);
  app.use('/api', coordination);
}
