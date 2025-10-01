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

  // Marquer un appareil comme vu
  // async function markSeen(entry) {
  //   const now = new Date();
  //   const { ip, mac, hostname, vendor, netbios, osGuess, lastRttMs } = entry;
    
  //   let device = await Device.findOne({ mac });
  //   const isNew = !device;

  //   if (!device) {
  //     // Créer un nouvel appareil
  //     device = new Device({
  //       ip,
  //       mac,
  //       hostname: hostname || `unknown-${mac}`,
  //       vendor: vendor || 'unknown',
  //       netbios: netbios || '',
  //       osGuess: osGuess || '',
  //       lastRttMs: lastRttMs || null,
  //       firstSeen: now,
  //       lastSeen: now,
  //       online: true,
  //       sessions: [{ start: now }],
  //       offre: "1H"
  //     });
      
  //     await device.save();
  //     byMac.set(mac, device.toObject());
  //     emitEvent('device:new', device);
  //   } else {
  //     // Mettre à jour un appareil existant
  //     const updates = {
  //       lastSeen: now,
  //       online: true
  //     };

  //     if (ip) updates.ip = ip;
  //     if (hostname) updates.hostname = hostname;
  //     if (vendor) updates.vendor = vendor;
  //     if (netbios) updates.netbios = netbios;
  //     if (osGuess) updates.osGuess = osGuess;
  //     if (lastRttMs) updates.lastRttMs = lastRttMs;

  //     // Si l'appareil était hors ligne, démarrer une nouvelle session
  //     if (!device.online) {
  //       updates.$push = { sessions: { start: now } };
  //     }

  //     device = await Device.findOneAndUpdate(
  //       { mac },
  //       updates,
  //       { new: true, upsert: true }
  //     );

  //     byMac.set(mac, device.toObject());
  //     emitEvent('device:seen', device);
  //   }

  //   return device;
  // }


  // async function markSeen(entry) {
  //   const now = new Date();
  //   const { ip, mac, hostname, vendor, netbios, osGuess, lastRttMs } = entry;
    
  //   let device = await Device.findOne({ mac });
  //   const isNew = !device;
  
  //   if (!device) {
  //     // Créer un nouvel appareil avec une nouvelle session
  //     const endDate = calculateEndDate(now, "1H"); // Offre par défaut
  //     device = new Device({
  //       ip,
  //       mac,
  //       hostname: hostname || `unknown-${mac}`,
  //       vendor: vendor || 'unknown',
  //       netbios: netbios || '',
  //       osGuess: osGuess || '',
  //       lastRttMs: lastRttMs || null,
  //       firstSeen: now,
  //       lastSeen: now,
  //       online: true,
  //       sessions: [{
  //         start: now,
  //         end: endDate,
  //         durationMs: endDate - now,
  //         status: 'active'
  //       }],
  //       offre: "1H" // Offre par défaut
  //     });
      
  //     await device.save();
  //     byMac.set(mac, device.toObject());
  //     emitEvent('device:new', device);
  //   } else {
  //     // Mettre à jour un appareil existant
  //     const updates = {
  //       lastSeen: now,
  //       online: true
  //     };
  
  //     if (ip) updates.ip = ip;
  //     if (hostname) updates.hostname = hostname;
  //     if (vendor) updates.vendor = vendor;
  //     if (netbios) updates.netbios = netbios;
  //     if (osGuess) updates.osGuess = osGuess;
  //     if (lastRttMs) updates.lastRttMs = lastRttMs;
  
  //     // Vérifier si une nouvelle session doit être démarrée
  //     const activeSession = device.sessions.find(s => 
  //       s.status === 'active' && 
  //       new Date(s.start) <= now && 
  //       new Date(s.end) >= now
  //     );
  
  //     if (!activeSession) {
  //       // Démarrer une nouvelle session
  //       const endDate = calculateEndDate(now, device.offre || "1H");
  //       updates.$push = {
  //         sessions: {
  //           start: now,
  //           end: endDate,
  //           durationMs: endDate - now,
  //           status: 'active'
  //         }
  //       };
  //     }
  
  //     device = await Device.findOneAndUpdate(
  //       { mac },
  //       updates,
  //       { new: true }
  //     );
  
  //     byMac.set(mac, device.toObject());
  //     emitEvent('device:seen', device);
  //   }
  
  //   return device;
  // }

  // Dans store.js, modifiez la fonction markSeen comme suit :

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
    // Mettre à jour un appareil existant
    const updates = {
      lastSeen: now,
      online: true
    };
  
    if (ip) updates.ip = ip;
    if (hostname) updates.hostname = hostname;
    if (vendor) updates.vendor = vendor;
    if (netbios) updates.netbios = netbios;
    if (osGuess) updates.osGuess = osGuess;
    if (lastRttMs) updates.lastRttMs = lastRttMs;
  
    // Vérifier si une nouvelle session doit être démarrée
    const activeSession = device.sessions && device.sessions.length > 0 
      ? device.sessions[device.sessions.length - 1]
      : null;

    if (!activeSession || activeSession.status !== 'active' || 
        (activeSession.end && new Date(activeSession.end) <= now)) {
      // Démarrer une nouvelle session
      const endDate = calculateEndDate(now, device.offre || "1H");
      updates.$push = {
        sessions: {
          start: now,
          end: endDate,
          status: 'active'
        }
      };
    } else {
      // Mettre à jour la durée de la session active
      updates.$set = updates.$set || {};
      updates.$set['sessions.$[].durationMs'] = now - new Date(activeSession.start);
    }
  
    device = await Device.findOneAndUpdate(
      { mac },
      updates,
      { new: true }
    );
  
    byMac.set(mac, device.toObject());
    emitEvent('device:seen', device);
    console.log("device seen" , device);
  }
  
  return device;
}

  function calculateEndDate(startDate, offre) {
    const endDate = new Date(startDate);
    
    switch(offre) {
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