# 🚀 Guide de Déploiement - Cabinet+

Ce guide contient les instructions pour déployer l'application **Cabinet+** (Frontend React Vite & Backend Node.js / Express).

---

## 📋 Prérequis & Variables d'Environnement

### 1. Backend (`/backend`)
Assurez-vous de configurer les variables d'environnement suivantes sur votre hébergeur (ex. Render / Railway) :

| Variable | Description | Exemple |
|---|---|---|
| `NODE_ENV` | Mode d'exécution | `production` |
| `PORT` | Port du serveur | `5000` |
| `MONGO_URI` | URI de la base MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/cabinet_plus` |
| `DB_HOST` | Hôte MySQL (si utilisé) | `localhost` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | `secret` |
| `DB_NAME` | Nom de la BDD MySQL | `cabinet_plus` |
| `JWT_SECRET` | Clé secrète JWT | `votre_cle_secrete_ultra_securisee` |
| `CLIENT_URL` | URLs autorisées pour le CORS | `https://votre-frontend.vercel.app` |

---

### 2. Frontend (`/frontend`)
Configuration dans le projet frontend (ex. Vercel) :

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API Backend | `https://votre-backend.onrender.com/api` |

---

## 🛠️ Options de Déploiement

### Option A : Vercel (Frontend) + Render (Backend) ⭐ *(Recommandé)*

1. **Backend sur Render (https://render.com)** :
   - Créer un **Web Service**.
   - Connecter le repository GitHub.
   - Root Directory : `backend`
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Ajouter les variables d'environnement listées ci-dessus.

2. **Frontend sur Vercel (https://vercel.com)** :
   - Importer le projet GitHub sur Vercel.
   - Root Directory : `frontend`
   - Framework Preset : `Vite`
   - Variable d'environnement : `VITE_API_URL` = `https://votre-backend.onrender.com/api`
   - Déployer !

---

### Option B : Déploiement Tout-en-un sur Render / VPS (Full-stack)

Si vous souhaitez héberger le frontend et le backend sur le même serveur Node.js :

1. Exécutez le build frontend :
   ```bash
   cd frontend
   npm run build
   ```
2. Le backend servira automatiquement les fichiers statiques du frontend générés dans `frontend/dist` lorsque `NODE_ENV=production`.
3. Lancez le serveur :
   ```bash
   cd backend
   npm start
   ```

---

## ✅ Vérification après Déploiement

- Tester l'accès à l'API : `https://votre-backend/api/health` (Doit retourner `{ status: "OK", ... }`)
- Se connecter à l'application frontend.
- Vérifier les fonctionnalités d'administration, la prise de rendez-vous, le chat et la gestion des utilisateurs.
