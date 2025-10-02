import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const historiqueSchema = new mongoose.Schema({
  montant: {
    type: Number,
    required: true
  },
  operation: {
    type: String,
    required: true,
    enum: ['ajout', 'retrait', 'mise_a_jour']
  },
  description: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const soldeSchema = new mongoose.Schema({
  mois: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{4}-\d{2}$/, 'Le format du mois doit être YYYY-MM']
  },
  soldeInitial: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  soldeActuel: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif'],
    default: 'actif'
  },
  historique: [historiqueSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Méthode pour ajouter une opération à l'historique
soldeSchema.methods.ajouterHistorique = async function(montant, operation, description = '', reference = '') {
  this.historique.push({
    montant,
    operation,
    description,
    reference
  });
  return this.save();
};

// Appliquer le plugin de pagination
soldeSchema.plugin(mongoosePaginate);

// Créer un index composé pour optimiser les recherches par mois et statut
soldeSchema.index({ mois: 1, statut: 1 });

const Solde = mongoose.model('Solde', soldeSchema);

export default Solde;