import { EventEmitter } from 'events';
import Device from './model/Device.js';

export function createStore({ offlineTimeoutMs = 30000, io } = {}) {
  const events = new EventEmitter();
  const byMac = new Map(); // Cache local pour les performances

  // Charger les appareils au démarrage
  async function loadDevices() {
    const devices = await Device.find({});
    devices.forEach(device => {
      byMac.set(device.mac, device.toObject());
    });
  }

  // Fonction pour émettre les événements via Socket.IO
  function emitEvent(event, data) {
    events.emit(event, data);
    if (io) {
      io.emit(event, data);
      // console.log("new device emit" , event);
    }
  }



  // Fonction utilitaire pour obtenir la durée maximale d'une session en millisecondes
  function getMaxDurationMs(offre) {
    const durations = {
      '1H': 60 * 60 * 1000,    // 1 heure
      '3H': 3 * 60 * 60 * 1000, // 3 heures
      'NIGHT': 8 * 60 * 60 * 1000, // 8 heures (nuit)
      'DAY': 12 * 60 * 60 * 1000, // 12 heures (journée)
      '1S': 24 * 60 * 60 * 1000,  // 1 jour
      '2S': 2 * 24 * 60 * 60 * 1000, // 2 jours
      '3S': 3 * 24 * 60 * 60 * 1000, // 3 jours
      '1M': 30 * 24 * 60 * 60 * 1000 // 1 mois
    };
    return durations[offre] || 60 * 60 * 1000; // Par défaut 1 heure
  }

  async function markSeen(entry) {
    const now = new Date();
    const { ip, mac, hostname, vendor, netbios, osGuess, lastRttMs } = entry;

    let device = await Device.findOne({ mac });
    const isNew = !device;

    if (!device) {
      // Créer un nouvel appareil avec une nouvelle session
      const endDate = calculateEndDate(now, "1H"); // Offre par défaut
      device = new Device({
        ip,
        mac,
        hostname: hostname || `unknown-${mac}`,
        vendor: vendor || 'unknown',
        netbios: netbios || '',
        osGuess: osGuess || '',
        lastRttMs: lastRttMs || null,
        firstSeen: now,
        lastSeen: now,
        online: true,
        sessions: [{
          start: now,
          end: endDate,
          status: 'active'
        }],
        offre: "1H" // Offre par défaut
      });

      await device.save();
      byMac.set(mac, device.toObject());
      emitEvent('device:new', device);
    } else {
      // Vérifier si la dernière session est expirée
      const lastSession = device.sessions[device.sessions.length - 1];
      const offre = device.offre;
      const maxDurationMs = getMaxDurationMs(offre);
      const sessionDuration = now - lastSession.start;

      // Si la session est expirée
      if (sessionDuration > maxDurationMs && lastSession.status !== 'expired') {
        // Marquer l'ancienne session comme expirée
        lastSession.status = 'expired';
        lastSession.end = new Date(lastSession.start.getTime() + maxDurationMs);

        // Ne pas créer de nouvelle session
        device.online = false; // Mettre l'appareil hors ligne
      }

      // Mettre à jour les informations de l'appareil
      const updates = {
        lastSeen: now,
        online: device.online, // Utiliser la valeur mise à jour
        sessions: device.sessions
      };
      if (ip) updates.ip = ip;
      if (vendor) updates.vendor = vendor;
      if (netbios) updates.netbios = netbios;
      if (osGuess) updates.osGuess = osGuess;
      if (lastRttMs) updates.lastRttMs = lastRttMs;

      device = await Device.findOneAndUpdate(
        { mac },
        { $set: updates },
        { new: true }
      );

      byMac.set(mac, device.toObject());
      emitEvent('device:seen', device);
    }

    return device;
  }

  function calculateEndDate(startDate, offre) {
    const endDate = new Date(startDate);

    switch (offre) {
      case '1H':
        endDate.setHours(endDate.getHours() + 1);
        break;
      case '3H':
        endDate.setHours(endDate.getHours() + 3);
        break;
      case 'NIGHT':
        // Définir à 5h du matin du jour suivant
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(5, 0, 0, 0);
        break;
      case 'DAY':
        // Définir à 18h du même jour
        endDate.setHours(18, 0, 0, 0);
        // Si l'heure actuelle est après 18h, passer au jour suivant
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        break;
      case '1S':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case '2S':
        endDate.setDate(endDate.getDate() + 14);
        break;
      case '3S':
        endDate.setDate(endDate.getDate() + 21);
        break;
      case '1M':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      default:
        // Par défaut, 1 heure
        endDate.setHours(endDate.getHours() + 1);
    }

    return endDate;
  }

  // Marquer les appareils hors ligne
  async function markOffline() {
    const now = new Date();
    const offlineThreshold = new Date(now.getTime() - offlineTimeoutMs);

    const devices = await Device.find({
      lastSeen: { $lt: offlineThreshold },
      online: true
    });

    for (const device of devices) {
      const updatedDevice = await device.updateStatus(false);
      byMac.set(device.mac, updatedDevice.toObject());
      emitEvent('device:offline', updatedDevice);
    }
  }

  async function reapOffline() {
    const offlineThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    const offlineTime = new Date(now.getTime() - offlineThreshold);

    const result = await Device.updateMany(
      {
        online: true,
        lastSeen: { $lt: offlineTime }
      },
      {
        $set: { online: false }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Marqué ${result.modifiedCount} appareils comme hors ligne`);
    }

    return result;
  }
  // Charger les appareils au démarrage
  loadDevices().catch(console.error);

  return {
    markSeen,
    markOffline,
    reapOffline,
    events,
    // Méthodes supplémentaires pour la compatibilité
    get: (mac) => byMac.get(mac),
    all: () => Array.from(byMac.values()),
    getOnline: () => Array.from(byMac.values()).filter(d => d.online)
  };
}