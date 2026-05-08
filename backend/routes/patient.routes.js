import express from 'express';
import {
  getPatients, getPatientById, createPatient,
  updatePatient, deletePatient, updateDossierMedical, getPortalData
} from '../controllers/patient.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent d'être connecté
router.use(protect);

router.get('/', getPatients);
router.get('/portal', getPortalData);

router.get('/:id', getPatientById);

router.post('/', authorize('admin', 'medecin', 'secretaire'), createPatient);
router.put('/:id', authorize('admin', 'medecin', 'secretaire'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);
router.put('/:id/dossier', authorize('admin', 'medecin'), updateDossierMedical);

export default router;