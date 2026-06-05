import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../config/db.mysql.js';
import { protect } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `avatar_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.use(protect);

// POST /api/upload/avatar  → multipart field: "avatar"
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier image valide fourni' });
  }

  // Build a public URL served by express.static
  const photo_url = `/uploads/${req.file.filename}`;

  try {
    await pool.execute(
      'UPDATE utilisateurs SET photo_url = ? WHERE id = ?',
      [photo_url, req.user.id]
    );
    res.json({ photo_url, message: 'Photo mise à jour avec succès' });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la photo' });
  }
});

export default router;
