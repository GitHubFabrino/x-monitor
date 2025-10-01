import type { Device } from "../store/useDeviceStore";

interface DeleteDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteDeviceModal = ({
  isOpen,
  onClose,
  device,
  onConfirm,
  isDeleting = false,
}: DeleteDeviceModalProps) => {
  if (!device) return null;

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Confirmer la suppression</h3>
        <p className="py-4">
          Êtes-vous sûr de vouloir supprimer l'appareil <strong>{device.hostname || device.ip}</strong> ?
          Cette action est irréversible.
        </p>
        <div className="modal-action">
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button 
            type="button" 
            className="btn btn-error" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};
