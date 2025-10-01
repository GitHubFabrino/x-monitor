import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Server, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeviceStore, type Device } from '../store/useDeviceStore';
import { EditDeviceModal } from '../components/EditDeviceModal';
import { DeleteDeviceModal } from '../components/DeleteDeviceModal';
import { formatDuration } from '../utils/utils';

interface DeviceFormData {
  offre?: string;
  hostname?: string;
}

const Dashboard = () => {
  const { 
    getAllDevices, 
    devicesAll, 
    isLoading, 
    updateDevice, 
    deleteDevice 
  } = useDeviceStore();
  const [error, setError] = useState<Error | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState<DeviceFormData>({ offre: '', hostname: '' });
  
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

  const handleEditClick = (device: Device) => {
    if (!device._id) {
      console.error('Impossible de modifier l\'appareil: ID manquant');
      return;
    }
    setSelectedDevice(device);
    setEditForm({
      offre: device.offre,
      hostname: device.hostname || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (device: Device) => {
    if (!device._id) {
      console.error('Impossible de supprimer l\'appareil: ID manquant');
      return;
    }
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedDevice._id) {
      console.error('Aucun appareil sélectionné ou ID manquant');
      return;
    }
    
    try {
      await updateDevice(selectedDevice._id, {
        hostname: editForm.hostname,
        offre: editForm.offre
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'appareil:', err);
      // L'erreur est déjà gérée dans le store
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDevice || !selectedDevice._id) {
      console.error('Aucun appareil sélectionné ou ID manquant');
      return;
    }
    
    try {
      await deleteDevice(selectedDevice._id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'appareil:', err);
      // L'erreur est déjà gérée dans le store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Edit Device Modal */}
      <EditDeviceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        device={selectedDevice}
        formData={editForm}
        onInputChange={handleInputChange}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDeviceModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        device={selectedDevice}
        onConfirm={handleDeleteConfirm}
      />



      
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
                        <div>
                          <h2>{device.hostname}</h2>
                          <p>{device.mac}</p>
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
                      <td>{device?.offre}</td>
                      <td>{new Date(device.lastSeen).toLocaleString()}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Link to={`/devices/${device.id || device.ip}`} className="btn btn-ghost btn-xs">Details</Link>
                        <button 
                          className="btn btn-ghost btn-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditClick(device);
                          }}
                          title="Edit device"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(device);
                          }}
                          title="Delete device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
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
