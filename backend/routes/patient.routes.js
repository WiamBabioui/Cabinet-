import express from 'express';
import {
  getPatients, getPatientById, createPatient,
  updatePatient, deletePatient, updateDossierMedical, getPortalData,
  getPatientConsultations, updatePatientAdmin
} from '../controllers/patient.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent d'être connecté
router.use(protect);

router.get('/', getPatients);
// ⚠️ /portal et /portal/consultations MUST be before /:id — otherwise Express matches 'portal' as the :id param
router.get('/portal', getPortalData);
router.get('/portal/consultations', authorize('patient'), getPatientConsultations);

router.get('/:id', getPatientById);

router.post('/', authorize('admin', 'medecin', 'secretaire'), createPatient);
router.put('/:id', authorize('admin', 'medecin', 'secretaire'), updatePatient);
router.patch('/:id/admin', authorize('admin', 'secretaire'), updatePatientAdmin);
router.delete('/:id', authorize('admin'), deletePatient);
router.put('/:id/dossier', authorize('admin', 'medecin'), updateDossierMedical);

export default router;