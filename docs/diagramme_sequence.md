# Diagramme de Séquence - Processus de Consultation

Ce diagramme détaille les échanges techniques entre le Médecin, l'interface Frontend, l'API Backend et la Base de Données lors d'une consultation médicale.

```mermaid
sequenceDiagram
    autonumber
    participant M as Médecin
    participant F as Frontend (React)
    participant B as Backend (Node/Express)
    participant DB as Base de Données (MySQL)

    Note over M, DB: Flux de travail : Consultation Médicale

    M->>F: Sélectionne un Patient (via RDV)
    F->>B: GET /api/patients/:id
    B->>DB: SELECT * FROM patients + dossiers_medicaux
    DB-->>B: Données du patient & Historique
    B-->>F: JSON (Détails patient)
    F-->>M: Affiche le dossier médical complet

    M->>F: Saisit les constantes vitales
    M->>F: Saisit l'anamnèse & examen clinique
    M->>F: Définit le diagnostic principal
    
    opt Prescription Médicale (Ordonnance)
        M->>F: Ajoute des médicaments (Posologie, Durée)
    end

    M->>F: Clique sur "Enregistrer la Consultation"
    F->>B: POST /api/consultations (Payload complet)
    
    rect rgb(240, 240, 240)
        Note right of B: Début de la Transaction Atomique
        B->>DB: INSERT INTO consultations
        B->>DB: INSERT INTO ordonnances (si applicable)
        B->>DB: UPDATE rendez_vous SET statut = 'termine'
        DB-->>B: Confirmation (Commit)
    end

    B-->>F: HTTP 201 Created (ID Consultation)
    F-->>M: Message de succès & Génération PDF auto
```

## Description des étapes
1. **Initialisation** : Le médecin accède au dossier du patient via son planning.
2. **Récupération** : Le système charge l'historique pour permettre un suivi éclairé.
3. **Saisie** : Les informations cliniques sont capturées en temps réel.
4. **Transaction** : Le backend garantit que si une étape de l'enregistrement échoue, aucune donnée n'est corrompue (Atomicité).
5. **Finalisation** : Le rendez-vous est marqué comme terminé, libérant le créneau dans l'agenda.
