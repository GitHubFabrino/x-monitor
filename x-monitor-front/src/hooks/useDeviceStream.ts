import { useEffect } from 'react';
import { useDeviceStore } from '../store/useDeviceStore';
import type { Device } from '../store/useDeviceStore';

export const useDeviceStream = (): void => {
  const { setDevices } = useDeviceStore();

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/stream');

    const handleSnapshot = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Snapshot reçu:", data);
        setDevices(data.devices || []);
      } catch (error) {
        console.error('Erreur lors du traitement du snapshot:', error);
      }
    };

    const handleDeviceEvent = (eventType: string) => (event: MessageEvent) => {
      try {
        const device = JSON.parse(event.data);
        console.log(`Événement ${eventType} reçu:`, device);
        
        setDevices((prevDevices: Device[]) => {
          switch (eventType) {
            case 'device:new':
              return [...prevDevices, device];
            case 'device:seen':
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
      } catch (error) {
        console.error(`Erreur lors du traitement de l'événement ${eventType}:`, error);
      }
    };

    // S'abonner aux différents types d'événements
    eventSource.addEventListener('snapshot', handleSnapshot);
    eventSource.addEventListener('device:new', handleDeviceEvent('device:new'));
    eventSource.addEventListener('device:seen', handleDeviceEvent('device:seen'));
    eventSource.addEventListener('device:online', handleDeviceEvent('device:online'));
    eventSource.addEventListener('device:offline', handleDeviceEvent('device:offline'));

    eventSource.onerror = (error: Event) => {
      console.error('Erreur de connexion SSE:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [setDevices]);
};
