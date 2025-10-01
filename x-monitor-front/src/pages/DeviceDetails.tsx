import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useDeviceStore } from '../store/useDeviceStore';



const formatDate = (timestamp?: number | string | null) => {
  if (timestamp === undefined || timestamp === null) return '-';
  try {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '-';
    
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

const formatDuration = (ms: number) => {
  // Convert to seconds
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};


const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devicesAll, isLoading, getAllDevices } = useDeviceStore();
  
  useEffect(() => {
    const fetchData = async () => {
      await getAllDevices();
    };
    fetchData();
    
    // Set up auto-refresh every 5 seconds
    // const interval = setInterval(fetchData, 20000);
    // return () => clearInterval(interval);
  }, [id]); // Only re-run if id changes
  
  // Find the current device in the store
  const device = devicesAll.find(d => d._id === id);

  if (!device && !isLoading) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>Appareil non trouvé</span>
      </div>
    );
  }

  if (isLoading || !device) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Format sessions for display
  const sessions = (device?.sessions || []).map((session) => {
    const startTime = new Date(session.start).getTime();
    const endTime = session.end ? new Date(session.end).getTime() : undefined;
    const now = Date.now();
    
    // Determine status based on end time or use the provided status
    const status = session.status || (endTime && endTime < now ? 'expired' : 'active');
    
    return {
      ...session,
      start: startTime,
      end: endTime,
      status,
      durationMs: endTime ? endTime - startTime : now - startTime
    };
  }) || [];
  
  const activeSessions = sessions.filter(s => s.status === 'active');
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  
  const sessionDuration = lastSession?.end && lastSession.start
    ? formatDuration(
        lastSession.end - lastSession.start
      )
    : 'En cours...';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-ghost btn-circle"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{device.hostname}</h1>
            <p className="text-sm text-gray-500">{device.netbios || 'Aucun nom NetBIOS'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`badge ${device.online ? 'badge-success' : 'badge-error'} gap-2`}>
            <div className={`w-2 h-2 rounded-full ${device.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {device.online ? 'En ligne' : 'Hors ligne'}
          </div>
          {device.type === 'admin' && (
            <div className="badge badge-primary gap-2">
              <Server className="w-3 h-3" />
              Admin
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Informations</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Adresse IP</span>
                <span className="font-mono">{device.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Adresse MAC</span>
                <span className="font-mono">{device.mac}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fournisseur</span>
                <span>{device.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">OS détecté</span>
                <span>{device.osGuess || 'Inconnu'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Statut</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${device.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{device.online ? 'En ligne' : 'Hors ligne'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Temps de réponse</span>
                <span>{device.lastRttMs ? `${device.lastRttMs} ms` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Première connexion</span>
                <span>{formatDate(device?.firstSeen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière activité</span>
                <span>{formatDate(device?.lastSeen)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Session</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Type d'offre</span>
                <span className="font-medium">{device.offre || 'Non défini'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sessions actives</span>
                <span>{activeSessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière session</span>
                <span>{sessionDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total des sessions</span>
                <span>{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Historique des sessions</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Durée</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {[...sessions].reverse().map((session) => (
                  <tr key={session._id}>
                    <td>{formatDate(session.start)}</td>
                    <td>{session.end ? formatDate(session.end) : '-'}</td>
                    <td>
                      {session.end && session.start
                        ? formatDuration(session.end - session.start)
                        : 'En cours...'}
                    </td>
                    <td>
                      <span className={`badge ${session.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                        {session.status === 'active' ? 'Active' : 'Terminée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
