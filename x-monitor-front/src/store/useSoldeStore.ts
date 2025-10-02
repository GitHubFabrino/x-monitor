import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosInstance from "../lib/axios";
import { toast } from 'react-hot-toast';

interface Solde {
  _id: string;
  mois: string;
  soldeInitial: number;
  soldeActuel: number;
  statut: 'actif' | 'cloture';
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  historique: Array<{
    _id: string;
    createdAt: string;
    montant: number;
    operation: 'ajout' | 'retrait' | 'mise_a_jour';
    description?: string;
    reference?: string;
  }>;
}

interface SoldeState {
  soldes: Solde[];
  currentSolde: Solde | null;
  currentSoldeId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchAllSoldes: (params?: { page?: number; limit?: number; sortBy?: string }) => Promise<void>;
  fetchCurrentSolde: () => Promise<void>;
  createSolde: (data: { mois: string; soldeInitial: number }) => Promise<Solde | null>;
  updateSolde: (id: string, data: { 
    montant: number; 
    operation: 'ajout' | 'retrait'; 
    description?: string; 
    reference?: string 
  }) => Promise<Solde | null>;
  deleteSolde: (id: string) => Promise<boolean>;
  getSoldeById: (id: string) => Promise<Solde | null>;
  reset: () => void;
}

const useSoldeStore = create<SoldeState>()(
  devtools(
    (set, get) => ({
      soldes: [],
      currentSolde: null,
      isLoading: false,
      error: null,

      fetchAllSoldes: async (params = {}) => {
        try {
          set({ isLoading: true, error: null });
          const { page = 1, limit = 10, sortBy = '-mois' } = params;
          const response = await axiosInstance.get('/soldes', {
            params: { page, limit, sortBy }
          });
          set({ soldes: response.data.docs || response.data });
        } catch (error: any) {
          console.error('Error fetching soldes:', error);
          set({ 
            error: error.response?.data?.message || 'Erreur lors de la récupération des soldes',
            soldes: []
          });
          toast.error('Erreur lors de la récupération des soldes');
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCurrentSolde: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await axiosInstance.get('/soldes/current');
          console.log('/////////////////////', response.data._id);
          
          set({ currentSolde: response.data });
          set({ currentSoldeId: response.data._id });
        } catch (error: any) {
          console.error('Error fetching current solde:', error);
          set({ 
            error: error.response?.data?.message || 'Erreur lors de la récupération du solde actuel',
            currentSolde: null
          });
        } finally {
          set({ isLoading: false });
        }
      },

      createSolde: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await axiosInstance.post('/soldes', data);
          await get().fetchAllSoldes();
          toast.success('Solde créé avec succès');
          return response.data;
        } catch (error: any) {
          console.error('Error creating solde:', error);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la création du solde';
          set({ error: errorMessage });
          toast.error(errorMessage);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateSolde: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Envoi des données au serveur:', { id, data }); // Ajoutez cette ligne
          const response = await axiosInstance.put(`/soldes/${id}`, data);
          console.log('Réponse du serveur:', response.data); // Et cette ligne
    
          // Mettre à jour le solde actuel si c'est le solde actuel qui a été modifié
          if (get().currentSolde?._id === id) {
            set({ currentSolde: response.data });
          }
          
          // Mettre à jour la liste des soldes
          await get().fetchAllSoldes();
          
          toast.success(
            data.operation === 'ajout' 
              ? 'Montant ajouté avec succès' 
              : 'Montant retiré avec succès'
          );
          
          return response.data;
        } catch (error: any) {
          console.error('Error updating solde:', error);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du solde';
          set({ error: errorMessage });
          toast.error(errorMessage);
          console.error('Détails de l\'erreur:', {
            message: error.message,
            response: {
              status: error.response?.status,
              data: error.response?.data,
              headers: error.response?.headers
            },
            request: error.request
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteSolde: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await axiosInstance.delete(`/soldes/${id}`);
          
          // Si le solde supprimé est le solde actuel, on le met à jour
          if (get().currentSolde?._id === id) {
            await get().fetchCurrentSolde();
          }
          
          // Mettre à jour la liste des soldes
          await get().fetchAllSoldes();
          
          toast.success('Solde supprimé avec succès');
          return true;
        } catch (error: any) {
          console.error('Error deleting solde:', error);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du solde';
          set({ error: errorMessage });
          toast.error(errorMessage);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      getSoldeById: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const response = await axiosInstance.get(`/soldes/${id}`);
          return response.data;
        } catch (error: any) {
          console.error('Error fetching solde by id:', error);
          const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération du solde';
          set({ error: errorMessage });
          toast.error(errorMessage);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        set({
          soldes: [],
          currentSolde: null,
          error: null,
          isLoading: false
        });
      }
    }),
    {
      name: 'solde-storage',
    }
  )
);

export default useSoldeStore;
