import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../config/db.mysql.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Directories ──────────────────────────────────────────────────────────────
const uploadsDir     = path.join(__dirname, '..', 'uploads');
const ordonnancesDir = path.join(uploadsDir, 'ordonnances');
if (!fs.existsSync(uploadsDir))     fs.mkdirSync(uploadsDir,     { recursive: true });
if (!fs.existsSync(ordonnancesDir)) fs.mkdirSync(ordonnancesDir, { recursive: true });

// ─── Avatar storage (images only) ─────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}${ext}`);
  }
});
const avatarFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  cb(null, allowed.includes(file.mimetype));
};
const uploadAvatar = multer({ storage: avatarStorage, fileFilter: avatarFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Ordonnance storage (PDF only, max 10 MB) ─────────────────────────────────
const ordonnanceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ordonnancesDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `ordonnance_${Date.now()}_${safe}`);
  }
});
const ordonnanceFilter = (_req, file, cb) => {
  file.mimetype === 'application/pdf'
    ? cb(null, true)
    : cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
};
const uploadOrdonnance = multer({
  storage: ordonnanceStorage,
  fileFilter: ordonnanceFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();
router.use(protect);

// ─── POST /api/upload/avatar ──────────────────────────────────────────────────
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier image valide fourni' });
  const photo_url = `/uploads/${req.file.filename}`;
  try {
    await pool.execute('UPDATE utilisateurs SET photo_url = ? WHERE id = ?', [photo_url, req.user.id]);
    res.json({ photo_url, message: 'Photo mise à jour avec succès' });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la photo' });
  }
});

// ─── POST /api/upload/ordonnance ──────────────────────────────────────────────
// multipart fields: "ordonnance" (PDF file) + body: appointment_id?, patient_id?, description?
router.post(
  '/ordonnance',
  authorize('medecin'),
  (req, res, next) => {
    uploadOrdonnance.single('ordonnance')(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ message: 'Fichier trop volumineux (max 10 Mo)' });
      if (err)
        return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier PDF valide fourni' });

    const { appointment_id, patient_id, description } = req.body;
    const file_url  = `/uploads/ordonnances/${req.file.filename}`;
    const file_name = req.file.originalname;
    const file_size = req.file.size;

    try {
      await pool.execute(
        `INSERT INTO ordonnances_documents
           (medecin_id, patient_id, appointment_id, file_name, file_url, file_size, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          patient_id     ? Number(patient_id)     : null,
          appointment_id ? Number(appointment_id) : null,
          file_name,
          file_url,
          file_size,
          description || null
        ]
      );

      const [[doc]] = await pool.execute(
        'SELECT * FROM ordonnances_documents WHERE medecin_id = ? ORDER BY uploaded_at DESC LIMIT 1',
        [req.user.id]
      );

      res.status(201).json({ message: 'Ordonnance uploadée avec succès', document: doc });
    } catch (err) {
      console.error('Upload ordonnance error:', err);
      fs.unlink(path.join(ordonnancesDir, req.file.filename), () => {});
      res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de l'ordonnance" });
    }
  }
);

// ─── GET /api/upload/ordonnances  (query: appointment_id?, patient_id?) ────────
router.get('/ordonnances', async (req, res) => {
  const { appointment_id, patient_id } = req.query;
  const { role, id } = req.user;

  try {
    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND medecin_id = ?';
      params.push(Number(id));
    } else if (role === 'patient') {
      // match by the patients table entry linked to this user's email
      where += ' AND patient_id = (SELECT id FROM patients WHERE email = ? LIMIT 1)';
      params.push(req.user.email);
    }
    if (appointment_id) { where += ' AND appointment_id = ?'; params.push(Number(appointment_id)); }
    if (patient_id)     { where += ' AND patient_id = ?';     params.push(Number(patient_id)); }

    const [docs] = await pool.execute(
      `SELECT * FROM ordonnances_documents ${where} ORDER BY uploaded_at DESC`,
      params
    );
    res.json({ documents: docs });
  } catch (err) {
    console.error('Get ordonnances error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── DELETE /api/upload/ordonnances/:id ───────────────────────────────────────
router.delete('/ordonnances/:id', authorize('medecin'), async (req, res) => {
  try {
    const [[doc]] = await pool.execute(
      'SELECT * FROM ordonnances_documents WHERE id = ? AND medecin_id = ?',
      [Number(req.params.id), req.user.id]
    );
    if (!doc) return res.status(404).json({ message: 'Document introuvable' });

    fs.unlink(path.join(__dirname, '..', doc.file_url), () => {});
    await pool.execute('DELETE FROM ordonnances_documents WHERE id = ?', [doc.id]);
    res.json({ message: 'Ordonnance supprimée' });
  } catch (err) {
    console.error('Delete ordonnance error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
