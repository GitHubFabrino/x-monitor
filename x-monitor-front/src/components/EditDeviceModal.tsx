import type { Device } from "../store/useDeviceStore";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  formData: {
    offre?: string;
    hostname?: string;
    type?: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditDeviceModal = ({
  isOpen,
  onClose,
  device,
  formData,
  onInputChange,
  onSubmit,
}: EditDeviceModalProps) => {
  if (!device) return null;

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Modifier l'appareil</h3>
        <form onSubmit={onSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Nom de l'appareil</span>
            </label>
            <input
              type="text"
              name="hostname"
              value={formData.hostname || ''}
              onChange={onInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <select 
              name="type" 
              value={formData.type || ''}
              onChange={onInputChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Sélectionner un type</option>
              <option value="user">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Offre</span>
            </label>
            <select 
              name="offre" 
              value={formData.offre || ''}
              onChange={onInputChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Sélectionner une offre</option>
              <option value="NIGHT">Nuit</option>
              <option value="DAY">Jour</option>
              <option value="1H">1 Heure</option>
              <option value="3H">3 Heures</option>
              <option value="1S">1 Semaine</option>
              <option value="2S">2 Semaines</option>
              <option value="3S">3 Semaines</option>
              <option value="1M">1 Mois</option>
            </select>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
