import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDeviceStore } from '../store/useDeviceStore';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export const useSocketIo = () => {
  const { setDevices } = useDeviceStore();

  useEffect(() => {
    // Se connecter au serveur Socket.IO
    const socket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Gérer les événements de connexion
    socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });

    // Gérer les événements de déconnexion
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
    });

    // Écouter les événements de mise à jour des appareils
    const handleDeviceEvent = (eventType: string) => (device: any) => {
      console.log(`Événement ${eventType} reçu:`, device);
      
      setDevices((prevDevices) => {
        switch (eventType) {
          case 'device:new':
            return [...prevDevices, device];
          case 'device:seen':
            console.log("device seen", device);
            return prevDevices;
          case 'device:online':
          case 'device:offline':
            const existingIndex = prevDevices.findIndex(d => d.id === device.id);
            if (existingIndex >= 0) {
              const updatedDevices = [...prevDevices];
              updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...device };
              return updatedDevices;
            }
            return [...prevDevices, device];
          default:
            return prevDevices;
        }
      });
    };

    // S'abonner aux événements
    socket.on('device:new', handleDeviceEvent('device:new'));
    socket.on('device:seen', handleDeviceEvent('device:seen'));
    socket.on('device:online', handleDeviceEvent('device:online'));
    socket.on('device:offline', handleDeviceEvent('device:offline'));

    // Nettoyer lors du démontage du composant
    return () => {
      socket.off('device:new');
      socket.off('device:seen');
      socket.off('device:online');
      socket.off('device:offline');
      socket.disconnect();
    };
  }, [setDevices]);

  return null;
};
