import type { Device } from "@/store/useDeviceStore";
import { useEffect, useState } from 'react';

interface DurationResult {
  formatted: string;
  isExpired: boolean;
  isAboutToExpire: boolean;
}

// Durées des offres en millisecondes
const OFFER_DURATIONS: Record<string, number> = {
  '1H': 60 * 60 * 1000,        // 1 heure
  '3H': 3 * 60 * 60 * 1000,    // 2 heures
  '4H': 4 * 60 * 60 * 1000,    // 4 heures
  '1D': 24 * 60 * 60 * 1000,   // 1 jour
  '1S': 7 * 24 * 60 * 60 * 1000, // 1 semaine
  '2S': 14 * 24 * 60 * 60 * 1000, // 2 semaines
  '3S': 21 * 24 * 60 * 60 * 1000, // 3 semaines
  '1M': 30 * 24 * 60 * 60 * 1000, // 1 mois (approximatif)
};

export const formatDuration = (ms: number): string => {
  if (!ms && ms !== 0) return 'Inconnu';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

/**
 * Calcule la durée écoulée depuis le début de la session
 * et vérifie si l'offre a expiré
 */
const calculateDuration = (device: Device): DurationResult => {
  try {
    const sessions = device?.sessions;
  
    const lastSession = sessions?.[sessions.length - 1];

    console.log("lastSession", sessions?.length);
    
    if (!sessions?.length || !lastSession?.start) {
      return { formatted: 'N/A', isExpired: false, isAboutToExpire: false };
    }

    const sessionStart = new Date(lastSession.start);
    const now = new Date();
    
    if (isNaN(sessionStart.getTime())) {
      console.error('Date de début de session invalide');
      return { formatted: 'N/A', isExpired: false, isAboutToExpire: false };
    }

    const durationMs = Math.max(0, now.getTime() - sessionStart.getTime());
    const formatted = formatDuration(durationMs);
    
    // Vérifier l'expiration de l'offre
    const offerDuration = device.offre ? OFFER_DURATIONS[device.offre] : null;
    let isExpired = false;
    let isAboutToExpire = false;

    if (offerDuration) {
      isExpired = durationMs > offerDuration;
      // 10% du temps restant avant expiration
      isAboutToExpire = !isExpired && (durationMs > offerDuration * 0.9);
    }

    return {
      formatted,
      isExpired,
      isAboutToExpire
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la durée:', error);
    return { formatted: 'Erreur', isExpired: false, isAboutToExpire: false };
  }
};

/**
 * Hook personnalisé pour suivre la durée en temps réel
 */
export const useDeviceDuration = (device: Device) => {
  const [duration, setDuration] = useState<DurationResult>(() => calculateDuration(device));

  useEffect(() => {
    // Mise à jour initiale
    setDuration(calculateDuration(device));
    
    // Mise à jour chaque seconde
    const interval = setInterval(() => {
      setDuration(calculateDuration(device));
    }, 1000);

    return () => clearInterval(interval);
  }, [device]);

  return duration;
};

/**
 * Fonction de compatibilité pour les composants non-hooks
 */
export const calculeDuration = (device: Device): string => {
  return calculateDuration(device).formatted;
};



export const vendorName = (device: Device) => {
  return device?.vendor?.split(' ').slice(0, 1).join(' ');
}