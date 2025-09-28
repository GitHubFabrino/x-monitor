import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Monitor, Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ipAddress: string;
  os: string;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
  };
  disk: {
    total: number;
    used: number;
  };
}

const fetchDevices = async (): Promise<Device[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/devices');
  // if (!response.ok) {
  //   throw new Error('Failed to fetch devices');
  // }
  // return response.json();
  
  // Mock data for now
  return [
    {
      id: '1',
      name: 'Main Server',
      status: 'online',
      lastSeen: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      os: 'Ubuntu 22.04',
      cpu: {
        usage: 45,
        cores: 8,
      },
      memory: {
        total: 32,
        used: 12,
      },
      disk: {
        total: 1000,
        used: 450,
      },
    },
    {
      id: '2',
      name: 'Backup Server',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      ipAddress: '192.168.1.101',
      os: 'CentOS 8',
      cpu: {
        usage: 0,
        cores: 4,
      },
      memory: {
        total: 16,
        used: 0,
      },
      disk: {
        total: 2000,
        used: 0,
      },
    },
  ];
};

const Dashboard = () => {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (error) {
    toast.error('Failed to load devices');
    return <div className="alert alert-error">Error loading devices. Please try again later.</div>;
  }

  const onlineDevices = devices?.filter(device => device.status === 'online').length || 0;
  const totalDevices = devices?.length || 0;

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
                    <th>OS</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Disk</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices?.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-12 h-12">
                              <Server className="w-8 h-8 mx-auto mt-2" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{device.name}</div>
                            <div className="text-sm opacity-50">{device.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${device.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <span className="capitalize">{device.status}</span>
                        </div>
                      </td>
                      <td>{device.ipAddress}</td>
                      <td>{device.os}</td>
                      <td>
                        <div className="flex items-center">
                          <Cpu className="w-4 h-4 mr-1" />
                          {device.status === 'online' ? `${device.cpu.usage}%` : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <MemoryStick className="w-4 h-4 mr-1" />
                          {device.status === 'online' ? 
                            `${Math.round((device.memory.used / device.memory.total) * 100)}%` : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          {device.status === 'online' ? 
                            `${Math.round((device.disk.used / device.disk.total) * 100)}%` : 'N/A'}
                        </div>
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
