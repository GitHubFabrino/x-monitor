import { create } from "zustand";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";

export interface Device {
  _id: string; // Toujours défini pour les appareils provenant du backend
  id?: string; // Pour la rétrocompatibilité
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  lastRttMs?: number | null;
  netbios?: string;
  osGuess?: string;
  firstSeen: number; // ms epoch
  lastSeen: number;  // ms epoch
  online: boolean;
  sessions: Array<{
    start: number;
    end?: number;
  }>;
  durationMs?: number;
  offre?: string;
}

type SetStateAction<S> = S | ((prevState: S) => S);

interface DeviceStore {
  devicesAll: Device[];
  isLoading: boolean;
  getAllDevices: () => Promise<void>;
  updateDevice: (id: string, data: { hostname?: string; offre?: string }) => Promise<Device | null>;
  deleteDevice: (id: string) => Promise<boolean>;
  setDevices: (devices: SetStateAction<Device[]>) => void;
}



export const useDeviceStore = create<DeviceStore>((set, get) => ({
    devicesAll: [],
    isLoading: false,
    setDevices: (devices) => {
      const newDevices = typeof devices === 'function' ? devices(get().devicesAll) : devices;
      console.log('Mise à jour des appareils:', newDevices);
      return { devicesAll: newDevices };
    },

    getAllDevices: async () => {
        try {
            set({ isLoading: true });
            const res = await axiosInstance.get<any>("/devices");
            set({ devicesAll: res.data.devices });
            console.log("devices", get().devicesAll );
        } catch (error) {
            console.error("Error getting devices", error);
            toast.error("Failed to fetch devices");
            toast.error(error as string);
        } finally {
            set({ isLoading: false });
        }
    },
    
    updateDevice: async (id: string, data: { hostname?: string; offre?: string }) => {
        try {
            set({ isLoading: true });
            const response = await axiosInstance.put(`/devices/${id}`, data);
            // Mettre à jour la liste des appareils après la modification
            await get().getAllDevices();
            toast.success("Appareil mis à jour avec succès");
            return response.data;
        } catch (error) {
            console.error("Error updating device", error);
            toast.error("Échec de la mise à jour de l'appareil");
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteDevice: async (id: string) => {
        try {
            set({ isLoading: true });
            await axiosInstance.delete(`/devices/${id}`);
            // Mettre à jour la liste des appareils après la suppression
            await get().getAllDevices();
            toast.success("Appareil supprimé avec succès");
            return true;
        } catch (error) {
            console.error("Error deleting device", error);
            toast.error("Échec de la suppression de l'appareil");
            return false;
        } finally {
            set({ isLoading: false });
        }
    },
}))
