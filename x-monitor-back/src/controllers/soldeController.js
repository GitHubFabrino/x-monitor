import Solde from '../model/Solde.js';
import { validationResult } from 'express-validator';
// Méthode utilitaire pour formater la date au format YYYY-MM
const formatDateToMonthYear = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // Créer un nouveau solde
  export const createSolde = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { mois, soldeInitial } = req.body;
      
      // Validation du format de la date
      if (!/^\d{4}-\d{2}$/.test(mois)) {
        return res.status(400).json({ message: 'Format de mois invalide. Utilisez le format YYYY-MM' });
      }
  
      // Vérifier si un solde existe déjà pour ce mois
      const existingSolde = await Solde.findOne({ mois });
      if (existingSolde) {
        return res.status(400).json({ message: 'Un solde existe déjà pour ce mois' });
      }
  
      const solde = new Solde({
        mois,
        soldeInitial: parseFloat(soldeInitial) || 0,
        soldeActuel: parseFloat(soldeInitial) || 0,
        createdBy: req.user?.id,
        statut: 'actif'
      });
  
      await solde.save();
      
      // Ajouter l'entrée d'historique initiale
      if (solde.soldeInitial > 0) {
        await solde.ajouterHistorique(
          solde.soldeInitial,
          'ajout',
          'Solde initial',
          `INIT-${new Date().getTime()}`
        );
      }
  
      res.status(201).json(solde);
    } catch (error) {
      console.error('Erreur lors de la création du solde:', error);
      res.status(500).json({ 
        message: 'Erreur serveur lors de la création du solde',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
// Modifiez la fonction getAllSoldes comme suit :
// Remplacer la fonction getAllSoldes par :
export const getAllSoldes = async (req, res) => {
    try {
      const soldes = await Solde.find({})
        .sort({ createdAt: -1 })
        .populate('createdBy updatedBy')
        .lean();
  
      res.json(soldes);
    } catch (error) {
      console.error('Erreur lors de la récupération des soldes:', error);
      res.status(500).json({ 
        message: 'Erreur serveur lors de la récupération des soldes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  // Récupérer le solde actuel
//   export const getCurrentSolde = async (req, res) => {
//     try {
//       const currentDate = new Date();
//       const currentMonth = formatDateToMonthYear(currentDate);
      
//       let solde = await Solde.findOne({ 
//         mois: currentMonth,
//         statut: 'actif'
//       }).select('mois soldeActuel statut updatedAt');
      
//       // Si aucun solde n'existe pour le mois en cours, en créer un avec un solde de 0
//       if (!solde) {
//         solde = new Solde({
//           mois: currentMonth,
//           soldeInitial: 0,
//           soldeActuel: 0,
//           createdBy: req.user?.id,
//           statut: 'actif'
//         });
//         await solde.save();
//       }
  
//       res.json({
//         mois: solde.mois,
//         soldeActuel: solde.soldeActuel || 0,
//         statut: solde.statut,
//         updatedAt: solde.updatedAt,
//         _id: solde._id
//       });
//     } catch (error) {
//       console.error('Erreur lors de la récupération du solde actuel:', error);
//       res.status(500).json({ 
//         message: 'Erreur serveur lors de la récupération du solde actuel',
//         error: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }
//   };


export const getCurrentSolde = async (req, res) => {
    try {
      const currentDate = new Date();
      const currentMonth = formatDateToMonthYear(currentDate);
  
      let solde = await Solde.findOne({
        mois: currentMonth,
        statut: 'actif'
      })
      .populate('historique') // Si historique est une référence à un autre modèle
      .select('mois soldeActuel statut updatedAt historique soldeInitial'); // <-- Ajoute historique et soldeInitial
  
      // Si aucun solde n'existe pour le mois en cours, en créer un avec un solde de 0
      if (!solde) {
        solde = new Solde({
          mois: currentMonth,
          soldeInitial: 0,
          soldeActuel: 0,
          historique: [], // <-- Initialise historique comme tableau vide
          createdBy: req.user?.id,
          statut: 'actif'
        });
        await solde.save();
      }
  
      res.json({
        mois: solde.mois,
        soldeActuel: solde.soldeActuel || 0,
        soldeInitial: solde.soldeInitial || 0, // <-- Ajoute soldeInitial
        statut: solde.statut,
        updatedAt: solde.updatedAt,
        historique: solde.historique || [], // <-- Ajoute historique
        _id: solde._id
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du solde actuel:', error);
      res.status(500).json({
        message: 'Erreur serveur lors de la récupération du solde actuel',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  


  // Récupérer un solde par son ID
export const getSoldeById = async (req, res) => {
    try {
      const solde = await Solde.findById(req.params.id)
        .populate('createdBy updatedBy')
        .lean();
  
      if (!solde) {
        return res.status(404).json({ message: 'Solde non trouvé' });
      }
  
      res.json(solde);
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
      res.status(500).json({ 
        message: 'Erreur serveur lors de la récupération du solde',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  // Supprimer un solde
  export const deleteSolde = async (req, res) => {
    try {
      const solde = await Solde.findByIdAndDelete(req.params.id);
  
      if (!solde) {
        return res.status(404).json({ message: 'Solde non trouvé' });
      }
  
      res.json({ message: 'Solde supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du solde:', error);
      res.status(500).json({ 
        message: 'Erreur serveur lors de la suppression du solde',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  // Mettre à jour un solde
  export const updateSolde = async (req, res) => {
    try {
      const { montant, operation, description, reference } = req.body;
      
      // Validation des entrées
      if (!['ajout', 'retrait'].includes(operation)) {
        return res.status(400).json({ message: 'Opération non valide' });
      }
      
      if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
        return res.status(400).json({ message: 'Montant invalide' });
      }
  
      const solde = await Solde.findById(req.params.id);
      if (!solde) {
        return res.status(404).json({ message: 'Solde non trouvé' });
      }
  
      const montantNum = parseFloat(montant);
      
      // Mettre à jour le solde actuel en fonction de l'opération
      if (operation === 'ajout') {
        solde.soldeActuel += montantNum;
      } else {
        if (solde.soldeActuel < montantNum) {
          return res.status(400).json({ message: 'Solde insuffisant' });
        }
        solde.soldeActuel -= montantNum;
      }
  
      // Ajouter l'opération à l'historique
      if (solde.ajouterHistorique) {
        await solde.ajouterHistorique(
          montantNum,
          operation,
          description || 'Opération sans description',
          reference || `OP-${Date.now()}`
        );
      }
  
      solde.updatedBy = req.user?.id;
      await solde.save();
  
      res.json({
        ...solde.toObject(),
        soldeActuel: solde.soldeActuel
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      res.status(500).json({ 
        message: 'Erreur serveur lors de la mise à jour du solde',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };