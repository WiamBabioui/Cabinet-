import express from 'express';
import {
  getMonProfil, updateMonProfil,
  getMesHoraires, saveMesHoraires, getMedecins
} from '../controllers/medecin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMedecins);
router.get('/profil', authorize('medecin'), getMonProfil);
router.put('/profil', authorize('medecin'), updateMonProfil);
router.get('/horaires', authorize('medecin'), getMesHoraires);
router.post('/horaires', authorize('medecin'), saveMesHoraires);

export default router;