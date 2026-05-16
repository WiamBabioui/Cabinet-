sequenceDiagram
    autonumber
    actor U as Utilisateur (Médecin/Secrétaire/Patient)
    participant F as Frontend (React)
    participant B as Backend (Node/Express)
    participant DB as Base de Données (MySQL)
    participant S as WebSocket/Socket.io (Chat/Notif)

    Note over U, S: Flux Global du Système Cabinet+

    == 1. AUTHENTIFICATION ==
    U->>F: Saisit Identifiants
    F->>B: POST /api/auth/login
    B->>DB: SELECT * FROM utilisateurs WHERE email = ?
    DB-->>B: Données utilisateur + Hash mot de passe
    B-->>F: Retourne JWT Token + Rôle + Profil
    F-->>U: Affiche le Dashboard (selon le rôle)

    == 2. GESTION ADMINISTRATIVE (Secrétaire/Médecin) ==
    alt Gestion des Patients
        U->>F: Crée/Modifie un Patient
        F->>B: POST/PUT /api/patients
        B->>DB: INSERT/UPDATE patients
        DB-->>B: Confirmation
        B-->>F: Succès + Données mises à jour
    else Gestion des Rendez-vous
        U->>F: Planifie un nouveau RDV
        F->>B: POST /api/appointments
        B->>DB: INSERT INTO rendez_vous
        DB-->>B: Succès
        B-->>S: Émettre Notification (Nouveau RDV)
        S-->>U: Alerte visuelle (Temps réel)
    end

    == 3. CŒUR DU MÉTIER (Médecin) ==
    U->>F: Ouvre une Consultation
    F->>B: GET /api/patients/:id/history
    B->>DB: SELECT * FROM consultations WHERE patient_id = ?
    DB-->>B: Historique médical
    B-->>F: Affichage Historique
    
    U->>F: Enregistre notes, constantes et ordonnance
    F->>B: POST /api/consultations
    Note over B, DB: Transaction : Consultation + Ordonnance + Statut RDV
    B->>DB: INSERT INTO consultations, ordonnances...
    DB-->>B: Commit Transaction
    B-->>F: Consultation Validée

    == 4. COMMUNICATION & TEMPS RÉEL (Tous) ==
    par Chat & Notifications
        U->>F: Envoie un message
        F->>B: POST /api/chat/messages
        B->>DB: INSERT INTO messages
        B->>S: Relayer message au destinataire
        S-->>U: Message reçu (Instantané)
    and
        B->>S: Événement système (ex: Rappel RDV)
        S-->>U: Notification Push
    end

    == 5. DÉCONNEXION ==
    U->>F: Clique sur Déconnexion
    F->>F: Supprime JWT Token (LocalStorage)
    F-->>U: Redirection vers Page Login
