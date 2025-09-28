import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Server, Activity, Clock, Info, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ipAddress: string;
  os: string;
  uptime: number;
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    sent: number;
    received: number;
  };
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    memory: number;
  }>;
}

const fetchDevice = async (id: string): Promise<Device> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/devices/${id}`);
  // if (!response.ok) {
  //   throw new Error('Failed to fetch device');
  // }
  // return response.json();
  
  // Mock data for now
  return {
    id,
    name: 'Main Server',
    status: 'online',
    lastSeen: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    os: 'Ubuntu 22.04.3 LTS',
    uptime: 1234567, // in seconds
    cpu: {
      usage: 45,
      cores: 8,
      model: 'Intel Xeon E5-2680 v4 @ 2.40GHz',
    },
    memory: {
      total: 32,
      used: 12,
      free: 20,
    },
    disk: {
      total: 1000,
      used: 450,
      free: 550,
    },
    network: {
      sent: 1234567890,
      received: 9876543210,
    },
    processes: [
      { pid: 1, name: 'systemd', cpu: 0.5, memory: 0.8 },
      { pid: 2, name: 'kthreadd', cpu: 0, memory: 0 },
      { pid: 3, name: 'docker', cpu: 12.5, memory: 2.3 },
      { pid: 4, name: 'node', cpu: 8.2, memory: 1.5 },
      { pid: 5, name: 'nginx', cpu: 3.7, memory: 0.9 },
    ],
  };
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0 || days > 0) result.push(`${hours}h`);
  result.push(`${minutes}m`);
  
  return result.join(' ');
};

const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: device, isLoading, error } = useQuery<Device>({
    queryKey: ['device', id],
    queryFn: () => fetchDevice(id!),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (error) {
    toast.error('Failed to load device details');
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>Error loading device. Please try again later.</span>
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

  const memoryUsage = (device.memory.used / device.memory.total) * 100;
  const diskUsage = (device.disk.used / device.disk.total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-ghost btn-circle"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">{device.name}</h1>
        <div className={`badge ${device.status === 'online' ? 'badge-success' : 'badge-error'} gap-2`}>
          <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Info Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Info className="w-5 h-5" />
              System Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Device ID:</span>
                <span className="font-mono">{device.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IP Address:</span>
                <span>{device.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Operating System:</span>
                <span>{device.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime:</span>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatUptime(device.uptime)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Seen:</span>
                <span>{new Date(device.lastSeen).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Cpu className="w-5 h-5" />
              CPU
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Usage: {device.cpu.usage}%</span>
                  <span className="text-sm text-gray-500">{device.cpu.cores} Cores</span>
                </div>
                <progress 
                  className="progress progress-primary w-full" 
                  value={device.cpu.usage} 
                  max="100"
                ></progress>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span className="text-right">{device.cpu.model}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <MemoryStick className="w-5 h-5" />
              Memory
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  {formatBytes(device.memory.used * 1024 * 1024 * 1024)} / {device.memory.total} GB
                </span>
                <span className="text-sm text-gray-500">{memoryUsage.toFixed(1)}% used</span>
              </div>
              <progress 
                className="progress progress-info w-full" 
                value={memoryUsage} 
                max="100"
              ></progress>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-500">Used</div>
                  <div className="font-medium">{device.memory.used} GB</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Free</div>
                  <div className="font-medium">{device.memory.free} GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <HardDrive className="w-5 h-5" />
              Disk
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  {formatBytes(device.disk.used * 1024 * 1024 * 1024)} / {device.disk.total} GB
                </span>
                <span className="text-sm text-gray-500">{diskUsage.toFixed(1)}% used</span>
              </div>
              <progress 
                className="progress progress-warning w-full" 
                value={diskUsage} 
                max="100"
              ></progress>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-500">Used</div>
                  <div className="font-medium">{device.disk.used} GB</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Free</div>
                  <div className="font-medium">{device.disk.free} GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Activity className="w-5 h-5" />
              Network
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Download</div>
                <div className="font-mono">{formatBytes(device.network.received)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Upload</div>
                <div className="font-mono">{formatBytes(device.network.sent)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Running Processes */}
        <div className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title">
              <Server className="w-5 h-5" />
              Running Processes
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Name</th>
                    <th>CPU %</th>
                    <th>Memory %</th>
                  </tr>
                </thead>
                <tbody>
                  {device.processes.map((process) => (
                    <tr key={process.pid}>
                      <td>{process.pid}</td>
                      <td>{process.name}</td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(process.cpu * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span>{process.cpu.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(process.memory * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span>{process.memory.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
