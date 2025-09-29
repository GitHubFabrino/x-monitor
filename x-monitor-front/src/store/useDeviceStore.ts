import { create } from "zustand";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";

export interface Device {
  id: string; // MAC or IP as fallback
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
  setDevices: (devices: SetStateAction<Device[]>) => void;
  // Add other store methods and state here
}

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3001" : "/";

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
        }finally {
            set({ isLoading : false });
        }
    },
    
}))
