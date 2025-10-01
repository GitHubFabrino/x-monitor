import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createScanner } from './scanner.js';
import { createStore } from './store.js';
import { createRoutes } from './routes.js';
import { connectToDB } from './lib/db.js';
const PORT = process.env.PORT || 3001;
const SCAN_INTERVAL_MS = Number(process.env.SCAN_INTERVAL_MS || 10000); // 10s
const OFFLINE_TIMEOUT_MS = Number(process.env.OFFLINE_TIMEOUT_MS || 30000); // 30s without seeing -> offline
const ENABLE_MDNS = String(process.env.ENABLE_MDNS || 'true').toLowerCase() === 'true';
const ENABLE_NBTSCAN = String(process.env.ENABLE_NBTSCAN || 'false').toLowerCase() === 'true';
const ENABLE_NMAP_OS = String(process.env.ENABLE_NMAP_OS || 'false').toLowerCase() === 'true';
const NMAP_PATH = process.env.NMAP_PATH || 'nmap';
const NBTSCAN_PATH = process.env.NBTSCAN_PATH || 'nbtscan';

async function main() {
  const app = express();
  const httpServer = createServer(app);
  await connectToDB();
  // Configuration CORS pour Express
  const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  
  // Configuration de Socket.IO avec CORS
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  // Gestion des connexions Socket.IO
  io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });

  const store = createStore({ 
    offlineTimeoutMs: OFFLINE_TIMEOUT_MS,
    io // Passer l'instance Socket.IO au store
  });
  const scanner = createScanner({
    networkCidr: process.env.NETWORK_CIDR || undefined,
    interface: process.env.NET_IFACE || undefined,
    scanIntervalMs: SCAN_INTERVAL_MS,
    onSeen: (entry) => store.markSeen(entry),
    onSweep: () => store.reapOffline(),
    enableMdns: ENABLE_MDNS,
    enableNbtscan: ENABLE_NBTSCAN,
    enableNmapOs: ENABLE_NMAP_OS,
    nmapPath: NMAP_PATH,
    nbtscanPath: NBTSCAN_PATH,
    io,
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

  // Démarrer le serveur HTTP au lieu du serveur Express
  httpServer.listen(PORT, () => {
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
