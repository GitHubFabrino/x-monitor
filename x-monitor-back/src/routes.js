import express from 'express';
import Device from './model/Device.js';

export function createRoutes({ store, scanner }) {
  const router = express.Router();

  // Récupérer tous les appareils
  router.get('/devices', async (req, res) => {
    try {
      const devices = await Device.find({});
      res.json({ count: devices.length, devices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Récupérer un appareil par son ID
  router.get('/devices/:id', async (req, res) => {
    try {
      const device = await Device.findById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Appareil non trouvé' });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mettre à jour un appareil
  router.put('/devices/:id', async (req, res) => {
    try {
      const device = await Device.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!device) {
        return res.status(404).json({ error: 'Appareil non trouvé' });
      }
      res.json(device);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Supprimer un appareil
  router.delete('/devices/:id', async (req, res) => {
    try {
      const device = await Device.findByIdAndDelete(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Appareil non trouvé' });
      }
      res.json({ message: 'Appareil supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Déclencher un scan manuel
  router.post('/scan', async (req, res) => {
    try {
      await scanner.scanOnce();
      res.json({ status: 'Scan démarré' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flux SSE pour les mises à jour en temps réel
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Envoyer l'état initial
    Device.find({}).then(devices => {
      send('snapshot', { devices });
    });

    const onNew = (d) => send('device:new', d);
    const onSeen = (d) => send('device:seen', d);
    const onOffline = (d) => send('device:offline', d);

    store.events.on('device:new', onNew);
    store.events.on('device:seen', onSeen);
    store.events.on('device:offline', onOffline);

    req.on('close', () => {
      store.events.off('device:new', onNew);
      store.events.off('device:seen', onSeen);
      store.events.off('device:offline', onOffline);
      res.end();
    });
  });

  return router;
}