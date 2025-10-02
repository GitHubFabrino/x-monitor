import { body, param } from 'express-validator';

export const createSoldeValidation = [
  body('mois')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM'),
  body('soldeInitial')
    .isFloat({ min: 0 })
    .withMessage('Le solde initial doit être un nombre positif'),
  body('createdBy')
    .optional()
    .isMongoId()
    .withMessage('ID utilisateur invalide')
];

export const updateSoldeValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de solde invalide'),
  body('montant')
    .isFloat({ min: 0.01 })
    .withMessage('Le montant doit être un nombre positif'),
  body('operation')
    .isIn(['ajout', 'retrait'])
    .withMessage("L'opération doit être 'ajout' ou 'retrait'"),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne doit pas dépasser 500 caractères'),
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La référence ne doit pas dépasser 100 caractères')
];

export const getSoldeValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de solde invalide')
];

export const deleteSoldeValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de solde invalide')
];

export default {
  createSoldeValidation,
  updateSoldeValidation,
  getSoldeValidation,
  deleteSoldeValidation
};
