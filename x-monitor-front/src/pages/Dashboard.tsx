import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Server, Edit, Trash2, RefreshCcw , HatGlasses , User} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeviceStore, type Device } from '../store/useDeviceStore';
import { EditDeviceModal } from '../components/EditDeviceModal';
import { DeleteDeviceModal } from '../components/DeleteDeviceModal';
import { useDeviceDuration, vendorName } from '../utils/utils';
import { FormattedDate } from '../components/FormattedDate';

interface DeviceFormData {
  offre?: string;
  hostname?: string;
  type?: string;
}

const Dashboard = () => {
  const {
    getAllDevices,
    devicesAll,
    isLoading,
    updateDevice,
    refreshDevice,
    deleteDevice
  } = useDeviceStore();
  const [error, setError] = useState<Error | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState<DeviceFormData>({ offre: '', hostname: '' });
  
  // Filtres
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    offre: 'all'
  });


  // Options pour les filtres
  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'Utilisateur' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'online', label: 'En ligne' },
    { value: 'offline', label: 'Hors ligne' }
  ];

  const offreOptions = [
    { value: 'all', label: 'Toutes les offres' },
    { value: '1H', label: '1 Heure' },
    { value: '3H', label: '3 Heures' },
    { value: '4H', label: '4 Heures' },
    { value: '1D', label: '1 Jour' },
    { value: '1S', label: '1 Semaine' },
    { value: '2S', label: '2 Semaines' },
    { value: '3S', label: '3 Semaines' },
    { value: '1M', label: '1 Mois' }
  ];

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

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

  // Initialize devices array
  const devices = Array.isArray(devicesAll) ? devicesAll : [];

  // Créer un composant interne pour gérer l'affichage de la durée avec le hook
  const DeviceDuration = ({ device }: { device: Device }) => {
    const { formatted, isExpired, isAboutToExpire } = useDeviceDuration(device);

    const getDurationClass = () => {
      if (isExpired) return 'text-red-600 font-bold';
      if (isAboutToExpire) return 'text-yellow-600 font-medium';
      return 'text-green-600';
    };

    return <span className={getDurationClass()}>{formatted}</span>;
  };

  // Appliquer les filtres
  const filteredDevices = devices.filter(device => {
    // Filtre par type
    if (filters.type !== 'all' && device.type !== filters.type) {
      return false;
    }
    // Filtre par statut
    if (filters.status !== 'all') {
      if (filters.status === 'online' && !device.online) return false;
      if (filters.status === 'offline' && device.online) return false;
    }
    // Filtre par offre
    if (filters.offre !== 'all' && device.offre !== filters.offre) {
      return false;
    }
    return true;
  });

  const onlineDevices = filteredDevices.filter(device => device.online).length;
  const totalDevices = filteredDevices.length;

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


  const handleRefreshClick = (device: Device) => {
    if (!device._id) {
      console.error('Impossible de rafraîchir l\'appareil: ID manquant');
      return;
    }
    setSelectedDevice(device);
    setShowRefreshModal(true);
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
        offre: editForm.offre,
        type: editForm.type
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

  const handleRefreshConfirm = async () => {
    if (!selectedDevice || !selectedDevice._id) {
      console.error('Aucun appareil sélectionné ou ID manquant');
      return;
    }

    try {
      await refreshDevice(selectedDevice._id);
      setShowRefreshModal(false);
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
        type="delete"
      />

      <DeleteDeviceModal
        isOpen={showRefreshModal}
        onClose={() => setShowRefreshModal(false)}
        device={selectedDevice}
        onConfirm={handleRefreshConfirm}
        type="refresh"
      />




      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Monitor className="w-6 h-6" />
              </div>
              <div className="stat-title">En ligne</div>
              <div className="stat-value text-primary">{onlineDevices}</div>
              <div className="stat-desc">sur {totalDevices} appareils</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
           
            <div className="flex flex-wrap gap-4">
              <div className="form-control flex-1 min-w-[200px]">
                <label className="label">
                  <span className="label-text">Type</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-1 min-w-[200px]">
                <label className="label">
                  <span className="label-text">Statut</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-1 min-w-[200px]">
                <label className="label">
                  <span className="label-text">Offre</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={filters.offre}
                  onChange={(e) => handleFilterChange('offre', e.target.value)}
                >
                  {offreOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control justify-end">
                <button 
                  className="btn btn-outline"
                  onClick={() => setFilters({
                    type: 'all',
                    status: 'all',
                    offre: 'all'
                  })}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
         
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
                  {filteredDevices.map((device) => (
                    <tr 
                      key={device.id} 
                      className={`${device.type === 'admin' ? 'bg-blue-950/30 hover:bg-blue-900/40' : 'hover:bg-gray-800/50'} transition-colors`}
                    >
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${device.type === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {device.type === 'admin' ? (
                              <HatGlasses className="w-5 h-5" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-semibold text-white truncate">{device.hostname}</h2>
                            {vendorName(device) !== 'unknown' && (
                              <p className="text-sm text-gray-500">{vendorName(device)}</p>
                            )}
                            <p className="text-xs text-gray-400 font-mono">{device.mac}</p>
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
                      <td>
                        {device.type === 'admin' ? (
                          <span className="badge badge-warning">Admin</span>
                        ) : (
                          <DeviceDuration device={device} />
                        )}
                      </td>
                      <td>
                        <FormattedDate
                          date={device?.sessions?.[0]?.start}
                          defaultText="N/A"
                        />
                      </td>
                      <td>
                        <FormattedDate
                          date={device?.sessions?.[0]?.end}
                          defaultText="En cours..."
                        />
                      </td>
                      <td>{device?.offre}</td>
                      <td>
                        <FormattedDate
                          date={device.lastSeen}
                        />
                      </td>
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


                          <button
                            className="btn btn-ghost btn-xs text-success"
                            onClick={(e) => {
                              e.preventDefault();
                              handleRefreshClick(device);
                            }}
                            title="Delete device"
                          >
                            <RefreshCcw className="w-4 h-4" />
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
