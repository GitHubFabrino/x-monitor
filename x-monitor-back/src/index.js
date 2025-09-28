import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createScanner } from './scanner.js';
import { createStore } from './store.js';
import { createRoutes } from './routes.js';

const PORT = process.env.PORT || 3000;
const SCAN_INTERVAL_MS = Number(process.env.SCAN_INTERVAL_MS || 10000); // 10s
const OFFLINE_TIMEOUT_MS = Number(process.env.OFFLINE_TIMEOUT_MS || 30000); // 30s without seeing -> offline

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const store = createStore({ offlineTimeoutMs: OFFLINE_TIMEOUT_MS });
  const scanner = createScanner({
    networkCidr: process.env.NETWORK_CIDR || undefined,
    interface: process.env.NET_IFACE || undefined,
    scanIntervalMs: SCAN_INTERVAL_MS,
    onSeen: (entry) => store.markSeen(entry),
    onSweep: () => store.reapOffline(),
  });

  // Routes
  app.use('/api', createRoutes({ store, scanner }));

  app.get('/', (req, res) => {
    res.json({
      name: 'x-monitor',
      status: 'ok',
      now: new Date().toISOString(),
      endpoints: [
        '/api/devices',
        '/api/devices/:id',
        '/api/stream',
        '/api/health',
      ],
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      scanning: scanner.isRunning(),
      intervalMs: SCAN_INTERVAL_MS,
    });
  });

  app.listen(PORT, () => {
    console.log(`x-monitor API listening on http://localhost:${PORT}`);
  });

  // Start scanning after server starts
  scanner.start().catch((err) => {
    console.error('Scanner failed to start', err);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
