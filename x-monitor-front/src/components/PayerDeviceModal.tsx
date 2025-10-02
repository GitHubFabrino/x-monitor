import type { Device } from "../store/useDeviceStore";
import { Wallet, AlertTriangle, X } from 'lucide-react';

interface PayerDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const PayerDeviceModal = ({
  isOpen,
  onClose,
  device,
  onConfirm,
  isLoading = false,
}: PayerDeviceModalProps) => {
  if (!device) return null;

  const calculSolde = (offre: string) => {
    switch (offre) {
      case '1H': return 500;
      case '3H': return 1000;
      case '4H': return 1500;
      case '1D': return 2000;
      case '1S': return 5000;
      case '2S': return 10000;
      case '3S': return 15000;
      case '1M': return 20000;
      default: return 0;
    }
  };

  const solde = calculSolde(device.offre || '1H');

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} z-50`}>
      <div className="modal-box max-w-md relative">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="font-bold text-xl mb-2">Confirmer le paiement</h2>
          <p className="text-gray-600 mb-4">
            Vous êtes sur le point de payer l'appareil suivant :
          </p>
          <div className="bg-gray-50 rounded-lg p-4 w-full mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Nom :</span>
                <span className="font-semibold text-blue-600">{device.hostname || 'Inconnu'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Adresse MAC :</span>
                <span className="font-mono text-sm text-blue-600">{device.mac}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Marque :</span>
                <span className="font-semibold text-blue-600">{device.vendor?.split(' ').slice(0, 1).join(' ') || 'Inconnu'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Offre :</span>
                <span className="font-semibold text-blue-600">{device.offre || 'Non spécifiée'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Montant :</span>
                <span className="font-bold text-blue-600">{solde.toLocaleString()} AR</span>
              </div>
            </div>
          </div>
        
          <div className="modal-action w-full">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Confirmer le paiement'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
