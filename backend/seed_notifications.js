import pool from './config/db.mysql.js';
import dotenv from 'dotenv';
dotenv.config();

async function seedNotifications() {
  try {
    const [users] = await pool.execute('SELECT id, prenom FROM utilisateurs');
    
    for (const user of users) {
      await pool.execute(
        'INSERT INTO notifications (destinataire_id, type, titre, corps, donnees_contexte) VALUES (?, ?, ?, ?, ?)',
        [
          user.id, 
          'alerte_systeme', 
          'Bienvenue sur Cabinet+', 
          `Bonjour ${user.prenom}, votre système de notifications est maintenant opérationnel !`, 
          JSON.stringify({ type: 'welcome' })
        ]
      );
      console.log(`Notification envoyée à ${user.prenom} (ID: ${user.id})`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedNotifications();
