import express from 'express';

export function createRoutes({ store, scanner }) {
  const router = express.Router();

  router.get('/devices', (req, res) => {
    const devices = store.all();
    res.json({ count: devices.length, devices });
  });

  router.get('/devices/:id', (req, res) => {
    const d = store.get(req.params.id);
    if (!d) return res.status(404).json({ error: 'Device non trouvé' });
    res.json(d);
  });

  // Déclencher un scan manuel
  router.post('/scan', async (req, res) => {
    try {
      await scanner.scanOnce();
      res.json({ status: 'ok' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Flux SSE pour mises à jour en temps réel
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Envoyer l'état initial
    send('snapshot', { devices: store.all() });

    const onNew = (d) => send('device:new', d);
    const onSeen = (d) => send('device:seen', d);
    const onOnline = (d) => send('device:online', d);
    const onOffline = (d) => send('device:offline', d);

    store.events.on('device:new', onNew);
    store.events.on('device:seen', onSeen);
    store.events.on('device:online', onOnline);
    store.events.on('device:offline', onOffline);

    req.on('close', () => {
      store.events.off('device:new', onNew);
      store.events.off('device:seen', onSeen);
      store.events.off('device:online', onOnline);
      store.events.off('device:offline', onOffline);
      res.end();
    });
  });

  return router;
}
