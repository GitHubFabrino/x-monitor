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
      const device = await Device.findById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Appareil non trouvé' });
      }

      // Mettre à jour le type si fourni
      if (req.body.type) {
        if (!['user', 'admin'].includes(req.body.type)) {
          return res.status(400).json({ error: 'Type invalide. Doit être "user" ou "admin"' });
        }
        device.type = req.body.type;
      }

      // Si une offre est fournie dans le body et qu'il y a une session active
      if (req.body.offre && device.sessions && device.sessions.length > 0) {
        const lastSession = device.sessions[device.sessions.length - 1];
        if (lastSession.status === 'active') {
          // Durées des offres en millisecondes
          const OFFER_DURATIONS = {
            '1H': 60 * 60 * 1000,        // 1 heure
            '3H': 3 * 60 * 60 * 1000,    // 3 heures
            '4H': 4 * 60 * 60 * 1000,    // 4 heures
            '1D': 24 * 60 * 60 * 1000,   // 1 jour
            '1S': 7 * 24 * 60 * 60 * 1000, // 1 semaine
            '2S': 14 * 24 * 60 * 60 * 1000, // 2 semaines
            '3S': 21 * 24 * 60 * 60 * 1000, // 3 semaines
            '1M': 30 * 24 * 60 * 60 * 1000, // 1 mois
          };

          // Si l'offre est valide, mettre à jour la date de fin
          if (OFFER_DURATIONS[req.body.offre]) {
            lastSession.end = new Date(lastSession.start).getTime() + OFFER_DURATIONS[req.body.offre];
          }
        }
      }

      // Mettre à jour les autres champs de l'appareil (sauf le type déjà géré)
      const { type, ...otherUpdates } = req.body;
      Object.assign(device, otherUpdates);
      
      // Sauvegarder les modifications avec validation
      const updatedDevice = await device.save({ validateBeforeSave: true });
      
      res.json(updatedDevice);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'appareil:', error);
      res.status(400).json({ 
        error: 'Erreur lors de la mise à jour de l\'appareil',
        details: error.message 
      });
    }
  });

  // Rafraîchir la session d'un appareil
  router.put('/refresh/:id', async (req, res) => {
    try {
      // Vérifier d'abord si l'appareil existe
      const device = await Device.findById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Appareil non trouvé' });
      }

      // Mettre à jour l'offre à 1H
      device.offre = "1H";

      // Supprimer toutes les sessions existantes
      device.sessions = [];

      // Créer une nouvelle session
      const now = Date.now();
      const newSession = {
        start: now,
        end: now + 3600000, // 1 heure en millisecondes
        status: 'active'
      };
      
      // Ajouter la nouvelle session
      device.sessions.push(newSession);

      // Mettre à jour le lastSeen
      device.lastSeen = now;
      device.online = true;

      // Sauvegarder les modifications avec validation
      const updatedDevice = await device.save({ validateBeforeSave: true });
      
      // Retourner l'appareil mis à jour avec la nouvelle session
      res.json(updatedDevice);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'appareil:', error);
      res.status(500).json({ 
        error: 'Erreur lors du rafraîchissement de l\'appareil',
        details: error.message 
      });
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