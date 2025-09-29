import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import dns from 'node:dns/promises';
import oui from 'oui';
import mdns from 'multicast-dns';

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
    const { stdout } = await exec(`ping -c 1 -W 1 ${ip}`);
    // try to parse time=XX ms
    const m = stdout.match(/time=([0-9]+(?:\.[0-9]+)?)\s*ms/);
    if (m) return parseFloat(m[1]);
    return 0; // reachable but time not parsed
  } catch {
    return null; // unreachable or timeout
  }
}

async function pingSweep(cidr, { maxConcurrent = 64 } = {}) {
  const [startInt, endInt] = cidrToRange(cidr);
  const ips = [];
  for (let i = startInt; i <= endInt; i++) ips.push(intToIp(i));

  const results = new Map(); // ip -> rttMs|null
  let idx = 0;
  const workers = Array.from({ length: Math.min(maxConcurrent, ips.length) }, async () => {
    while (idx < ips.length) {
      const i = idx++;
      const ip = ips[i];
      const rtt = await pingOnce(ip);
      results.set(ip, rtt);
      // small jitter
      await sleep(5);
    }
  });
  await Promise.all(workers);
  return results; // Map<ip, rttMs|null>
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

export function createScanner({ networkCidr, interface: netIface, scanIntervalMs = 10000, onSeen = () => {}, onSweep = () => {}, enableMdns = true, enableNbtscan = false, enableNmapOs = false, nmapPath = 'nmap', nbtscanPath = 'nbtscan' } = {}) {
  let running = false;
  let timer = null;
  let currentCIDR = networkCidr;
  const vendorCache = new Map(); // mac -> vendor
  const hostCache = new Map();   // ip -> hostname
  const mdnsCache = new Map();   // ip -> hostname (mDNS)
  const nbtCache = new Map();    // ip -> netbios
  const osCache = new Map();     // ip -> osGuess

  console.log("scanner created");

  // mDNS resolver (reverse PTR)
  const mdnsInstance = enableMdns ? mdns() : null;
  function toReversePtr(ip) {
    return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  }
  async function resolveMdns(ip, { timeoutMs = 1000 } = {}) {
    if (!mdnsInstance) return undefined;
    if (mdnsCache.has(ip)) return mdnsCache.get(ip);
    const name = toReversePtr(ip);
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        resolve(undefined);
      }, timeoutMs);
      const onResponse = (res) => {
        if (done) return;
        const ptr = res.answers?.find(a => a.type === 'PTR');
        if (ptr && typeof ptr.data === 'string') {
          clearTimeout(timer);
          done = true;
          mdnsCache.set(ip, ptr.data);
          mdnsInstance.removeListener('response', onResponse);
          resolve(ptr.data);
        }
      };
      mdnsInstance.on('response', onResponse);
      mdnsInstance.query([{ name, type: 'PTR' }]);
    });
  }

  async function resolveHostname(ip) {
    if (hostCache.has(ip)) return hostCache.get(ip);
    try {
      const names = await dns.reverse(ip);
      const host = names && names[0];
      if (host) hostCache.set(ip, host);
      return host || undefined;
    } catch {
      return undefined;
    }
  }

  function resolveVendor(mac) {
    if (!mac) return undefined;
    const key = mac.toLowerCase();
    if (vendorCache.has(key)) return vendorCache.get(key);
    try {
      const v = oui(mac) || undefined;
      if (v) vendorCache.set(key, v);
      return v;
    } catch {
      return undefined;
    }
  }

  async function resolveNetbios(ip) {
    if (!enableNbtscan) return undefined;
    if (nbtCache.has(ip)) return nbtCache.get(ip);
    try {
      // Quiet format tends to print lines like: "192.168.1.10   NAME         <...>"
      const { stdout } = await exec(`${nbtscanPath} -q ${ip}`);
      const line = stdout.split(/\n+/).find(l => l.trim().startsWith(ip));
      if (line) {
        const parts = line.trim().split(/\s+/);
        const name = parts[1];
        if (name && name !== '-') {
          nbtCache.set(ip, name);
          return name;
        }
      }
    } catch {}
    return undefined;
  }

  async function resolveOsGuess(ip) {
    if (!enableNmapOs) return undefined;
    if (osCache.has(ip)) return osCache.get(ip);
    try {
      const { stdout } = await exec(`${nmapPath} -O -F -Pn ${ip}`);
      // Parse a short OS string
      const lines = stdout.split(/\n+/);
      const osDetails = lines.find(l => l.startsWith('OS details:'))
        || lines.find(l => l.startsWith('Running:'))
        || lines.find(l => l.startsWith('Aggressive OS guesses:'));
      if (osDetails) {
        const guess = osDetails.replace(/^OS details:\s*|^Running:\s*|^Aggressive OS guesses:\s*/,'').trim();
        if (guess) {
          osCache.set(ip, guess);
          return guess;
        }
      }
    } catch {}
    return undefined;
  }

  async function scanOnce() {
    console.log(`[${new Date().toISOString()}] Début du scan réseau...`);
    if (!currentCIDR) currentCIDR = await detectLocalCIDR(netIface);

    // 1) Ping sweep to refresh ARP/neigh table and capture RTTs
    const rtts = await pingSweep(currentCIDR);

    // 2) Read neighbor table for MAC/IP with states
    const neigh = await readNeighbors();

    // Consider states that imply recently seen
    const SEEN_STATES = new Set(['REACHABLE', 'STALE', 'DELAY', 'PROBE']);

    // Enrich and emit with limited concurrency
    const tasks = [];
    const maxConcurrent = 16; // keep modest due to external tools
    let idx = 0;
    const items = neigh.filter(n => n.ip && SEEN_STATES.has(n.state));
    const worker = async () => {
      while (idx < items.length) {
        const i = idx++;
        const n = items[i];
        const [hostnameDns, hostnameMdns, netbios, osGuess] = await Promise.all([
          resolveHostname(n.ip),
          resolveMdns(n.ip),
          resolveNetbios(n.ip),
          resolveOsGuess(n.ip),
        ]);
        const vendor = resolveVendor(n.mac);
        const rttMs = rtts.get(n.ip) ?? null;
        const hostname = hostnameDns || hostnameMdns;
        onSeen({ ip: n.ip, mac: n.mac, hostname, vendor, rttMs, netbios, osGuess });
      }
    };
    for (let i = 0; i < Math.min(maxConcurrent, items.length); i++) tasks.push(worker());
    await Promise.all(tasks);

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
