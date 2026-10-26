import { app } from './app.js';
import { env } from './lib/env.js';
import { disconnectPrisma } from './lib/prisma.js';
const server = app.listen(env.API_PORT, () =>
  console.log(`CaseBridge API: http://localhost:${env.API_PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      void disconnectPrisma().finally(() => process.exit(0));
    });
  });
