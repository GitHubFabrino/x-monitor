import { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}
function intToIp(int) {
  return [24, 16, 8, 0].map(shift => (int >>> shift) & 255).join('.');
}

function cidrToRange(cidr) {
  const [base, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  const baseInt = ipToInt(base);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const network = baseInt & mask;
  const broadcast = network | (~mask >>> 0);
  const start = network + 1;
  const end = broadcast - 1;
  if (bits === 32) return [baseInt, baseInt];
  if (bits === 31) return [network, broadcast];
  return [start >>> 0, end >>> 0];
}

async function detectLocalCIDR(netIface) {
  // Try: ip -o -4 addr show <iface?> | awk '{print $4}'
  try {
    const cmd = netIface
      ? `ip -o -4 addr show ${netIface} | awk '{print $4}'`
      : `ip -o -4 addr show scope global | awk '{print $4}'`;
    const { stdout } = await exec(cmd);
    const lines = stdout.trim().split(/\n+/).filter(Boolean);
    if (lines.length > 0) return lines[0];
  } catch {}
  throw new Error('Impossible de détecter le réseau local (CIDR). Définissez NETWORK_CIDR dans .env');
}

async function pingOnce(ip) {
  // -c 1 one packet, -W 1 timeout 1s (GNU ping)
  try {
    await exec(`ping -c 1 -W 1 ${ip}`);
    return true;
  } catch {
    return false;
  }
}

async function pingSweep(cidr, { maxConcurrent = 64 } = {}) {
  const [startInt, endInt] = cidrToRange(cidr);
  const ips = [];
  for (let i = startInt; i <= endInt; i++) ips.push(intToIp(i));

  const results = new Map();
  let idx = 0;
  const workers = Array.from({ length: Math.min(maxConcurrent, ips.length) }, async () => {
    while (idx < ips.length) {
      const i = idx++;
      const ip = ips[i];
      const ok = await pingOnce(ip);
      results.set(ip, ok);
      // small jitter
      await sleep(5);
    }
  });
  await Promise.all(workers);
  return results; // Map<ip, boolean>
}

async function readNeighbors() {
  // Parse: ip neigh
  try {
    const { stdout } = await exec('ip neigh');
    // Example line: 192.168.1.10 dev wlp2s0 lladdr aa:bb:cc:dd:ee:ff REACHABLE
    const lines = stdout.trim().split(/\n+/).filter(Boolean);
    const entries = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const ip = parts[0];
      const devIdx = parts.indexOf('dev');
      const llIdx = parts.indexOf('lladdr');
      const state = parts[parts.length - 1];
      const mac = llIdx !== -1 ? parts[llIdx + 1] : undefined;
      const iface = devIdx !== -1 ? parts[devIdx + 1] : undefined;
      entries.push({ ip, mac, iface, state });
    }
    return entries; // [{ip, mac, state, iface}]
  } catch (e) {
    return [];
  }
}

export function createScanner({ networkCidr, interface: netIface, scanIntervalMs = 10000, onSeen = () => {}, onSweep = () => {} } = {}) {
  let running = false;
  let timer = null;
  let currentCIDR = networkCidr;

  async function scanOnce() {
    if (!currentCIDR) currentCIDR = await detectLocalCIDR(netIface);

    // 1) Ping sweep to refresh ARP/neigh table
    await pingSweep(currentCIDR);

    // 2) Read neighbor table for MAC/IP with states
    const neigh = await readNeighbors();

    // Consider states that imply recently seen
    const SEEN_STATES = new Set(['REACHABLE', 'STALE', 'DELAY', 'PROBE']);

    for (const n of neigh) {
      if (!n.ip) continue;
      if (SEEN_STATES.has(n.state)) {
        onSeen({ ip: n.ip, mac: n.mac });
      }
    }

    onSweep();
  }

  async function start() {
    if (running) return;
    running = true;
    // initial scan without waiting
    try { await scanOnce(); } catch (e) { /* ignore first errors */ }
    timer = setInterval(async () => {
      try { await scanOnce(); } catch (e) { /* log and continue */ console.error('scan error', e.message); }
    }, scanIntervalMs);
  }

  function stop() {
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
  }

  function isRunning() { return running; }

  return { start, stop, isRunning, scanOnce };
}
