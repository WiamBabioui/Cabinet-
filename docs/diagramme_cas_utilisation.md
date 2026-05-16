# Diagramme de Cas d'Utilisation - Cabinet+

Ce diagramme présente les interactions entre les différents acteurs (Médecin, Secrétaire, Patient, Administrateur) et les fonctionnalités du système.

```mermaid
useCaseDiagram
    actor "Médecin" as M
    actor "Secrétaire" as S
    actor "Patient" as P
    actor "Administrateur" as A

    package "Système de Gestion Cabinet+" {
        usecase "S'authentifier" as UC_Auth
        usecase "Gérer les Patients" as UC_Patients
        usecase "Archiver un Patient" as UC_Archive
        usecase "Gérer les Rendez-vous" as UC_RDV
        usecase "Effectuer une Consultation" as UC_Consult
        usecase "Consulter le Dossier Médical" as UC_Dossier
        usecase "Rédiger une Ordonnance" as UC_Ordo
        usecase "Communiquer par Chat" as UC_Chat
        usecase "Gérer les Utilisateurs" as UC_Users
        usecase "Visualiser les Statistiques" as UC_Stats
    }

    %% Relations Médecin
    M --> UC_Auth
    M --> UC_Patients
    M --> UC_RDV
    M --> UC_Consult
    M --> UC_Chat
    M --> UC_Stats

    %% Relations Secrétaire
    S --> UC_Auth
    S --> UC_Patients
    S --> UC_RDV
    S --> UC_Chat

    %% Relations Patient
    P --> UC_Auth
    P --> UC_RDV
    P --> UC_Chat
    P --> UC_Dossier

    %% Relations Admin
    A --> UC_Auth
    A --> UC_Users
    A --> UC_Stats

    %% Inclusions et Extensions
    UC_Patients <.. UC_Archive : <<extend>>
    UC_Consult ..> UC_Dossier : <<include>>
    UC_Consult ..> UC_Ordo : <<include>>
    UC_RDV ..> UC_Auth : <<include>>
    UC_Consult ..> UC_Auth : <<include>>
    UC_Users ..> UC_Auth : <<include>>
```

## Légende
- **Actor** : Entité externe qui interagit avec le système.
- **include** : Fonctionnalité obligatoire pour la réalisation du cas d'utilisation parent.
- **extend** : Fonctionnalité optionnelle qui s'ajoute dans certains cas spécifiques.
