import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeviceStore } from '../store/useDeviceStore';
import { useDeviceStream } from '../hooks/useDeviceStream';

const formatDuration = (ms: number): string => {
  if (!ms && ms !== 0) return 'Unknown';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

const Dashboard = () => {
  const { getAllDevices, devicesAll, isLoading } = useDeviceStore();
  const [error, setError] = useState<Error | null>(null);
  
  // Activer le flux SSE
  useDeviceStream();

  // Charger les appareils initiaux
  useEffect(() => {
    const loadDevices = async () => {
      try {
        await getAllDevices();
      } catch (err) {
        setError(err as Error);
      }
    };
    
    loadDevices();
  }, [getAllDevices]);

  if (error) {
    toast.error('Failed to load devices');
    return <div className="alert alert-error">Error loading devices. Please try again later.</div>;
  }

  // S'assurer que devicesAll est un tableau avant d'utiliser filter
  const devices = Array.isArray(devicesAll) ? devicesAll : [];
  const onlineDevices = devices.filter(device => device.online).length;
  const totalDevices = devices.length;
  
  // Log pour déboguer les mises à jour des appareils
  useEffect(() => {
    console.log('Appareils dans le Dashboard:', devices);
  }, [devices]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Server className="w-6 h-6" />
            </div>
            <div className="stat-title">Total Devices</div>
            <div className="stat-value">{totalDevices}</div>
            <div className="stat-desc">Connected to the network</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="stat-title">Online Now</div>
            <div className="stat-value">{onlineDevices}</div>
            <div className="stat-desc">Active connections</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Connected Devices</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Duration</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Offre</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-12 h-12">
                              <Server className="w-8 h-8 mx-auto mt-2" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{
                              device.vendor 
                                ? device.vendor.split(' ').slice(0, 2).join(' ')
                                : device.ip
                            }</div>
                            <div className="text-sm opacity-50">{device.mac || device.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${device.online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <span className="capitalize">{device.online ? 'online' : 'offline'}</span>
                        </div>
                      </td>
                      <td>{device.ip}</td>
                      <td>{formatDuration(device.durationMs || 0)}</td>
                      <td>
                        {device?.sessions?.[0]?.start ? new Date(device.sessions[0].start).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        {device?.sessions?.[0]?.end ? new Date(device.sessions[0].end).toLocaleString() : 'En cours...'}
                      </td>
                      <td>
                        {device?.offre}
                      </td>
                      <td>{new Date(device.lastSeen).toLocaleString()}</td>
                      <td>
                        <Link to={`/devices/${device.id}`} className="btn btn-ghost btn-xs">Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
