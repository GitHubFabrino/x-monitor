import EventEmitter from 'events';

// Device schema (in-memory):
// {
//   id: string (MAC or IP as fallback),
//   ip: string,
//   mac?: string,
//   hostname?: string,
//   vendor?: string,
//   lastRttMs?: number | null,
//   netbios?: string,
//   osGuess?: string,
//   firstSeen: number (ms epoch),
//   lastSeen: number (ms epoch),
//   online: boolean,
//   sessions: Array<{ start: number, end?: number }>
// }

export function createStore({ offlineTimeoutMs = 30000 } = {}) {
  const byId = new Map(); // id -> device
  const emitter = new EventEmitter();

  function ensureDevice({ ip, mac, hostname, vendor, rttMs, netbios, osGuess }) {
    const id = mac || ip; // prefer mac if available
    let d = byId.get(id);
    const now = Date.now();
    if (!d) {
      d = {
        id,
        ip,
        mac,
        hostname,
        vendor,
        lastRttMs: rttMs ?? null,
        netbios,
        osGuess,
        firstSeen: now,
        lastSeen: now,
        online: true,
        sessions: [{ start: now }],
        offre: "1H"
      };
      byId.set(id, d);
      emitter.emit('device:new', d);
    } else {
      d.ip = ip || d.ip;
      d.mac = mac || d.mac;
      d.hostname = hostname || d.hostname;
      d.vendor = vendor || d.vendor;
      if (typeof rttMs === 'number' || rttMs === null) d.lastRttMs = rttMs;
      d.netbios = netbios || d.netbios;
      d.osGuess = osGuess || d.osGuess;
      d.lastSeen = now;
      if (!d.online) {
        d.online = true;
        d.sessions.push({ start: now });
        emitter.emit('device:online', d);
      }
    }
    return d;
  }

  function markSeen(entry) {
    const d = ensureDevice(entry);
    d.lastSeen = Date.now();
    emitter.emit('device:seen', d);
  }

  function markOffline(d) {
    if (!d.online) return;
    d.online = false;
    const last = d.sessions[d.sessions.length - 1];
    if (last && !last.end) {
      last.end = Date.now();
    }
    emitter.emit('device:offline', d);
  }

  function reapOffline() {
    const now = Date.now();
    for (const d of byId.values()) {
      if (d.online && now - d.lastSeen > offlineTimeoutMs) {
        markOffline(d);
      }
    }
  }

  function all() {
    return Array.from(byId.values()).map(enrich);
  }

  function get(id) {
    const d = byId.get(id);
    return d ? enrich(d) : null;
  }

  function enrich(d) {
    const now = Date.now();
    let total = 0;
    for (const s of d.sessions) {
      const end = s.end || (d.online ? now : s.end);
      if (end) total += end - s.start;
    }
    return {
      ...d,
      durationMs: total,
    };
  }

  return {
    markSeen,
    reapOffline,
    all,
    get,
    events: emitter,
  };
}
