import pool from '../config/db.mysql.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Consultation from '../models/Consultation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ORDONNANCES_DIR = path.join(__dirname, '..', 'uploads', 'ordonnances');

if (!fs.existsSync(ORDONNANCES_DIR)) {
  fs.mkdirSync(ORDONNANCES_DIR, { recursive: true });
}

/**
 * GET /api/consultations/:id/ordonnance
 * Génère ou renvoie le PDF de l'ordonnance liée à une consultation MongoDB.
 * RBAC : patient propriétaire | medecin | secretaire | admin
 */
export const getOrdonnancePdf = async (req, res) => {
  try {
    const rawId = req.params.id;

    let mongoConsult = null;
    try {
      mongoConsult = await Consultation.findById(rawId).lean();
    } catch {
      // ObjectId invalide
    }

    if (!mongoConsult) {
      return res.status(404).json({ message: 'Consultation introuvable' });
    }

    const { role, email: userEmail } = req.user;

    if (role === 'patient') {
      const [patientRows] = await pool.execute(
        `SELECT id FROM patients WHERE email = ? AND deleted_at IS NULL`,
        [userEmail]
      );
      const patientDbId = patientRows[0]?.id;
      if (!patientDbId || patientDbId !== mongoConsult.patientId) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    } else if (!['medecin', 'secretaire', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const ordonnanceText = mongoConsult.prescription || mongoConsult.treatment || '';
    if (!ordonnanceText || ordonnanceText.trim() === '') {
      return res.status(404).json({ message: 'Aucune ordonnance pour cette consultation' });
    }

    let patientInfo = { prenom: 'Patient', nom: '', num_dossier: '', date_naissance: null };
    let medecinNom  = `Médecin #${mongoConsult.doctorId}`;

    try {
      const [pRows] = await pool.execute(
        `SELECT prenom, nom, num_dossier, date_naissance FROM patients WHERE id = ? AND deleted_at IS NULL`,
        [mongoConsult.patientId]
      );
      if (pRows.length > 0) patientInfo = pRows[0];

      const [dRows] = await pool.execute(
        `SELECT CONCAT(u.prenom, ' ', u.nom) as nom_complet
         FROM utilisateurs u WHERE u.id = ?`,
        [mongoConsult.doctorId]
      );
      if (dRows.length > 0) medecinNom = dRows[0].nom_complet;
    } catch (e) {
      console.warn('Enrichissement MySQL partiel :', e.message);
    }

    const consult = {
      date_consultation: mongoConsult.consultationDate,
      diagnostic_principal: mongoConsult.diagnosis || '',
      ordonnance: ordonnanceText,
      patient_prenom: patientInfo.prenom,
      patient_nom: patientInfo.nom,
      patient_ddn: patientInfo.date_naissance,
      num_dossier: patientInfo.num_dossier,
      medecin_nom: medecinNom,
    };

    const pdfFilename = `ordonnance_${rawId}.pdf`;
    const pdfPath     = path.join(ORDONNANCES_DIR, pdfFilename);

    if (!fs.existsSync(pdfPath)) {
      await generateOrdonnancePdf(pdfPath, consult);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (err) {
    console.error('getOrdonnancePdf error:', err);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
  }
};

function generateOrdonnancePdf(filePath, consult) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    const CONTENT_WIDTH = 480;

    doc.pipe(stream);

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#5B21B6')
      .text('Cabinet Médical', { align: 'center' });

    doc.fontSize(11).font('Helvetica').fillColor('#64748B')
      .text('Ordonnance Médicale', { align: 'center' });

    doc.moveDown(0.8);
    doc.strokeColor('#E2E8F0').lineWidth(1)
      .moveTo(60, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(1);

    const dateConsult = consult.date_consultation
      ? new Date(consult.date_consultation).toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric'
        })
      : 'N/A';

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B')
      .text(`Dr. ${consult.medecin_nom}`, { continued: false });

    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
      .text(`Casablanca, le ${dateConsult}`);

    doc.moveDown(1.2);

    const calcAge = (ddn) => {
      if (!ddn) return null;
      const age = Math.floor((Date.now() - new Date(ddn).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return isNaN(age) ? null : age;
    };

    const ageStr = calcAge(consult.patient_ddn);
    const dossierStr = [
      consult.num_dossier ? `Dossier N° ${consult.num_dossier}` : null,
      ageStr !== null ? `${ageStr} ans` : null,
    ].filter(Boolean).join('  •  ');

    const boxPadding = 14;
    const boxTopY = doc.y;
    const boxHeight = boxPadding * 2 + 12 + 18 + 14 + 8;

    doc.roundedRect(60, boxTopY, CONTENT_WIDTH, boxHeight, 8)
      .fillAndStroke('#F8FAFC', '#E2E8F0');

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#94A3B8')
      .text('PATIENT', 75, boxTopY + boxPadding, { width: CONTENT_WIDTH - 30 });

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B')
      .text(`${consult.patient_prenom || ''} ${consult.patient_nom || ''}`, 75, boxTopY + boxPadding + 12, { width: CONTENT_WIDTH - 30 });

    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
      .text(dossierStr, 75, boxTopY + boxPadding + 34, { width: CONTENT_WIDTH - 30 });

    doc.x = 60;
    doc.y = boxTopY + boxHeight + 20;

    if (consult.diagnostic_principal) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#5B21B6')
        .text('DIAGNOSTIC', 60, doc.y, { width: CONTENT_WIDTH });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#1E293B')
        .text(consult.diagnostic_principal, 60, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
      doc.moveDown(1);
    }

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#5B21B6')
      .text('ORDONNANCE', 60, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(0.5);

    const lines = (consult.ordonnance || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    lines.forEach((line, idx) => {
      doc.fontSize(10).font('Helvetica').fillColor('#1E293B')
        .text(`${idx + 1}. ${line}`, 70, doc.y, { width: CONTENT_WIDTH - 10, lineGap: 3 });
      doc.moveDown(0.3);
    });

    doc.moveDown(2);

    doc.strokeColor('#E2E8F0').lineWidth(1)
      .moveTo(60, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8')
      .text('Cachet et signature du médecin', 60, doc.y, { align: 'right', width: CONTENT_WIDTH });
    doc.moveDown(2);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B')
      .text(`Dr. ${consult.medecin_nom}`, 60, doc.y, { align: 'right', width: CONTENT_WIDTH });

    doc.fontSize(7).font('Helvetica').fillColor('#CBD5E1')
      .text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} — Cabinet+ Logiciel de Gestion Médicale`,
        60, doc.page.height - 40, { align: 'center', width: 480 }
      );

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}