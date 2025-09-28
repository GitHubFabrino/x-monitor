# x-monitor

API REST (Node.js + Express) pour surveiller en temps réel les appareils connectés à votre réseau Wi‑Fi et suivre la durée de connexion de chaque appareil.

Le service effectue périodiquement un balayage du sous-réseau local (ping sweep) afin d'alimenter la table ARP/"ip neigh", puis lit cette table pour identifier les IP/MAC récemment vues. Un magasin en mémoire garde l'état en ligne et l'historique des sessions pour calculer les durées.

## Prérequis

- Linux (utilise les outils système `ip`, `ping`)
- Node.js 18+
- Accès au réseau local (idéalement sur l'interface Wi‑Fi)

## Installation

```bash
npm install
```

## Configuration

Copiez le fichier `.env.example` en `.env` et adaptez si besoin :

```bash
cp .env.example .env
```

Variables disponibles :

- `PORT` : port HTTP (par défaut 3000)
- `SCAN_INTERVAL_MS` : intervalle entre scans (par défaut 10000 ms)
- `OFFLINE_TIMEOUT_MS` : délai d'inactivité avant de marquer un appareil hors-ligne (par défaut 30000 ms)
- `NETWORK_CIDR` (optionnel) : sous-réseau à scanner, ex. `192.168.1.0/24`. Si non défini, l'app détecte automatiquement.
- `NET_IFACE` (optionnel) : interface réseau à cibler, ex. `wlan0`.

## Démarrage

En mode développement (auto-reload avec nodemon) :

```bash
npm run dev
```

En mode production :

```bash
npm start
```

L'API sera disponible sur `http://localhost:3000` (ou le port configuré).

## Endpoints

- `GET /` : info service et liste des endpoints.
- `GET /api/health` : statut du scanner.
- `GET /api/devices` : liste des appareils connus.
- `GET /api/devices/:id` : détail d'un appareil (id = MAC si connue, sinon IP).
- `POST /api/scan` : déclenche un scan manuel immédiat.
- `GET /api/stream` (SSE) : flux d'événements en temps réel (`device:new`, `device:seen`, `device:online`, `device:offline`, plus `snapshot` initial).

## Exemple de réponses

`GET /api/devices`
```json
{
  "count": 2,
  "devices": [
    {
      "id": "aa:bb:cc:dd:ee:ff",
      "ip": "192.168.1.10",
      "mac": "aa:bb:cc:dd:ee:ff",
      "firstSeen": 1690000000000,
      "lastSeen": 1690000030000,
      "online": true,
      "sessions": [{ "start": 1690000000000 }],
      "durationMs": 30000
    }
  ]
}
```

## Notes techniques

- Le scanner utilise :
  - `ping` pour rendre les hôtes réactifs et peupler la table ARP
  - `ip neigh` pour lire les couples IP/MAC et leurs états (`REACHABLE`, `STALE`, `DELAY`, `PROBE` considérés comme "vus récemment")
- La durée de connexion est calculée à partir des sessions ouvertes/fermées selon l'état `online` et `lastSeen`.
- Le stockage est en mémoire (volatile). Pour persister les données, un backend (ex. SQLite/PostgreSQL) pourrait être ajouté ultérieurement.

## Limitations

- Sur certains réseaux, la résolution MAC peut être partielle (isolations client/AP, VLANs).
- Les résultats dépendent des droits et politiques réseau (ICMP, ARP). Sur Linux classiques, `ping` est setuid root et fonctionnera sans privilèges supplémentaires.

## Licence

MIT
