import express from 'express';
import { getConsultations, getConsultationById, createConsultation } from '../controllers/consultation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConsultations);
router.get('/:id', getConsultationById);
router.post('/', authorize('medecin'), createConsultation);

export default router;
