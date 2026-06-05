import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      "nav": {
        "search": "Rechercher...",
        "notifications": "Notifications",
        "messages": "Messages",
        "profile": "Mon Profil",
        "settings": "Paramètres",
        "logout": "Déconnexion",
        "language": "Langue",
        "recent_messages": "Messages récents",
        "no_notifs": "Aucune notification",
        "no_messages": "Aucun message",
        "view_all": "Voir tout",
        "open_chat": "Ouvrir le chat",
        "loading": "Chargement..."
      },
      "sidebar": {
        "dashboard": "Tableau de bord",
        "patients": "Patients",
        "appointments": "Rendez-vous",
        "consultation": "Consultation",
        "chat": "Messagerie",
        "profile": "Mon Profil",
        "patient_portal": "Mon Espace",
        "logout": "Déconnexion"
      },
      "roles": {
        "medecin": "Médecin",
        "secretaire": "Secrétaire",
        "admin": "Administrateur",
        "patient": "Patient"
      },
      "dashboard": {
        "overview": "Vue d'ensemble",
        "welcome": "Bonjour, {{name}}. Voici ce qui se passe aujourd'hui.",
        "new_appointment": "Nouveau RDV",
        "total_patients": "Total Patients",
        "today_appointments": "RDV Aujourd'hui",
        "active_doctors": "Médecins Actifs",
        "new_this_month": "Nouveaux ce mois",
        "patient_evolution": "Nouveaux Patients",
        "patient_evolution_subtitle": "Évolution sur les 6 derniers mois",
        "patient_distribution": "Répartition Patients",
        "patient_distribution_subtitle": "Par sexe",
        "appointments_today": "Rendez-vous du jour",
        "appointments_today_subtitle": "Liste des patients programmés aujourd'hui",
        "no_data": "Aucune donnée disponible",
        "no_appointments": "Aucun rendez-vous prévu aujourd'hui",
        "live": "En direct",
        "table": {
          "patient": "Patient",
          "time": "Heure",
          "reason": "Motif",
          "status": "Statut",
          "action": "Action"
        },
        "genders": {
          "m": "Hommes",
          "f": "Femmes",
          "other": "Autre"
        }
      },
      "patients": {
        "title": "Répertoire Patients",
        "subtitle": "{{count}} patient enregistré",
        "subtitle_plural": "{{count}} patients enregistrés",
        "add": "Ajouter un patient",
        "search_placeholder": "Rechercher par nom, email ou téléphone...",
        "no_patients": "Aucun patient trouvé",
        "no_patients_desc": "Essayez d'autres termes de recherche ou ajoutez un nouveau patient.",
        "table": {
          "patient": "Patient",
          "contact": "Contact",
          "file_num": "N° Dossier",
          "status": "Statut",
          "actions": "Actions"
        },
        "modal": {
          "title": "Nouveau Patient",
          "firstname": "Prénom *",
          "lastname": "Nom *",
          "birthdate": "Date de naissance *",
          "gender": "Sexe *",
          "phone": "Téléphone *",
          "cin": "CIN",
          "blood_group": "Groupe sanguin",
          "city": "Ville",
          "insurance": "Assurance",
          "email": "Email",
          "create": "Créer le patient",
          "error": "Erreur lors de la création"
        }
      },
      "appointments": {
        "title": "Emploi du temps",
        "subtitle": "Gérez vos rendez-vous quotidiens et consultations.",
        "new": "Nouveau",
        "schedule_here": "Programmer ici",
        "queue": "File d'attente",
        "waiting_patients": "Patients en attente",
        "waiting": "En attente",
        "no_waiting": "Aucun patient en attente",
        "refresh_queue": "Actualiser la file",
        "tasks": "Tâches rapides",
        "reminders": "Rappels personnels",
        "new_task": "Nouvelle tâche...",
        "consult": "Consulter"
      },
      "chat": {
        "title": "Messagerie",
        "send": "Envoyer",
        "placeholder": "Écrivez un message...",
        "no_contacts": "Aucun contact trouvé",
        "select_conv": "Sélectionnez une conversation pour commencer",
        "history": "Historique des messages",
        "delete_confirm": "Voulez-vous vraiment supprimer ce message ?",
        "delete_tooltip": "Supprimer le message",
        "send_error": "Erreur lors de l'envoi du message"
      },
      "consultation": {
        "title": "Consultation en cours",
        "patient": "Patient",
        "reason": "Motif",
        "patient_file": "Dossier Patient",
        "save_and_finish": "Terminer & Enregistrer",
        "saving": "Enregistrement...",
        "success": "Consultation enregistrée avec succès !",
        "tabs": {
          "observations": "Observations",
          "vitals": "Signes Vitaux",
          "diagnosis": "Diagnostic",
          "prescription": "Ordonnance"
        },
        "observations": {
          "title": "Anamnèse & Examen Clinique",
          "anamnese": "Anamnèse (Histoire de la maladie)",
          "anamnese_placeholder": "Symptômes, antécédents récents...",
          "exam": "Examen Clinique",
          "exam_placeholder": "Observations physiques..."
        },
        "vitals": {
          "title": "Paramètres Vitaux",
          "temp": "Température (°C)",
          "bp_sys": "Tension Sys",
          "bp_dia": "Tension Dia",
          "hr": "Fréq. Cardiaque (BPM)",
          "spo2": "SpO2 (%)",
          "weight": "Poids (kg)",
          "height": "Taille (cm)"
        },
        "diagnosis": {
          "title": "Diagnostic & Conduite à tenir",
          "main": "Diagnostic Principal",
          "cim10": "Codes CIM-10",
          "advice": "Conduite à tenir / Conseils",
          "advice_placeholder": "Recommandations pour le patient..."
        },
        "prescription": {
          "title": "Ordonnance Numérique",
          "med": "Médicament",
          "dosage": "Posologie",
          "duration": "Durée",
          "add": "Ajouter à l'ordonnance",
          "no_meds": "Aucun médicament ajouté",
          "ready": "Ordonnance prête",
          "ready_desc": "Le PDF sera généré après l'enregistrement de la consultation."
        }
      },
      "profile": {
        "title": "Mon Compte",
        "subtitle": "Gérez votre profil et vos préférences",
        "title_dr": "Dr.",
        "title_pr": "Pr.",
        "tabs": {
          "profile": "Mon profil",
          "security": "Sécurité",
          "schedule": "Mes horaires"
        },
        "profile_saved": "Profil mis à jour avec succès !",
        "save_error": "Erreur lors de la sauvegarde",
        "password_mismatch": "Les mots de passe ne correspondent pas",
        "password_changed": "Mot de passe modifié !",
        "schedule_saved": "Horaires enregistrés !",
        "form": {
          "firstname": "Prénom",
          "lastname": "Nom",
          "phone": "Téléphone",
          "title": "Titre",
          "bio": "Biographie",
          "bio_placeholder": "Décrivez votre expérience...",
          "duration": "Durée consultation (min)",
          "price": "Tarif (MAD)",
          "available": "Disponible pour consultations",
          "save_profile": "Enregistrer le profil"
        },
        "security": {
          "old_password": "Ancien mot de passe",
          "new_password": "Nouveau mot de passe",
          "confirm_password": "Confirmer le mot de passe",
          "change_password": "Changer le mot de passe"
        },
        "schedule": {
          "save_schedule": "Enregistrer les horaires"
        },
        "days": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
      },
      "patient_detail": {
        "tabs": {
          "info": "Informations",
          "medical_file": "Dossier médical",
          "history": "Historique"
        },
        "info": {
          "fullname": "Prénom & Nom",
          "age": "Âge",
          "age_years": "{{count}} ans",
          "birth_date": "Date naissance",
          "gender": "Sexe",
          "phone": "Téléphone",
          "email": "Email",
          "cin": "CIN",
          "city": "Ville",
          "blood_group": "Groupe sanguin",
          "insurance": "Assurance",
          "insurance_num": "N° Assurance",
          "file_num": "N° Dossier"
        },
        "medical_file": {
          "edit": "Modifier le dossier",
          "allergies": "Allergies",
          "perso_history": "Antécédents personnels",
          "family_history": "Antécédents familiaux",
          "current_treatments": "Traitements en cours",
          "lifestyle": "Mode de vie",
          "placeholder": "Entrez les {{field}}...",
          "not_specified": "Non renseigné"
        },
        "history": {
          "consultations": "Dernières consultations",
          "no_consultations": "Aucune consultation",
          "appointments": "Derniers rendez-vous",
          "no_appointments": "Aucun rendez-vous"
        }
      },
      "assistant": {
        "title": "Bureau Opérationnel",
        "subtitle": "Gérez la facturation, la file d'attente et les tâches administratives quotidiennes.",
        "new_invoice": "Nouvelle Facture",
        "add_queue": "Ajouter à la file",
        "today_revenue": "Revenu du Jour",
        "revenue_growth": "15% de plus qu'hier",
        "pending_payments": "Paiements en attente",
        "overdue": "En retard",
        "view_billing": "Centre de Facturation",
        "clinic_utilization": "Utilisation de la Clinique",
        "room_usage": "Occupation des Salles",
        "optimize_schedule": "Optimiser le Planning",
        "live_queue": "File d'attente en direct",
        "queue_subtitle": "Statut actuel des patients dans la clinique",
        "billing_log": "Journal de Facturation",
        "billing_subtitle": "Transactions financières récentes",
        "table": {
          "invoice": "Facture",
          "patient": "Patient",
          "amount": "Montant",
          "status": "Statut"
        },
        "status": {
          "paid": "Payé",
          "pending": "En attente",
          "in_room": "En salle",
          "waiting": "En attente",
          "lab": "Labo"
        }
      },
      "users": {
        "title": "Gestion des Utilisateurs",
        "subtitle": "{{count}} utilisateur enregistré",
        "subtitle_plural": "{{count}} utilisateurs enregistrés",
        "add": "Ajouter un utilisateur",
        "search_placeholder": "Rechercher par nom ou email...",
        "no_users": "Aucun utilisateur trouvé",
        "access_denied": "Accès réservé aux administrateurs",
        "modal": {
          "title": "Nouvel utilisateur",
          "firstname": "Prénom *",
          "lastname": "Nom *",
          "email": "Email *",
          "password": "Mot de passe *",
          "role": "Rôle *",
          "specialty": "Spécialité *",
          "specialty_select": "Sélectionner...",
          "order_num": "N° Ordre *",
          "phone": "Téléphone",
          "create": "Créer",
          "error": "Erreur lors de la création"
        },
        "table": {
          "user": "Utilisateur",
          "role": "Rôle",
          "phone": "Téléphone",
          "status": "Statut"
        },
        "status": {
          "active": "Actif",
          "inactive": "Inactif"
        },
        "actions": {
          "activate": "Activer",
          "deactivate": "Désactiver",
          "delete": "Supprimer",
          "delete_confirm": "Supprimer cet utilisateur ?"
        }
      },
      "auth": {
        "layout": {
          "title": "La plateforme de coordination et de gestion clinique",
          "subtitle": "Conçu pour les praticiens marocains. Centralisez vos dossiers patients, synchronisez en temps réel le secrétariat et le cabinet, et gérez vos consultations.",
          "quote": "Avec la synchronisation instantanée de Cabinet+, notre secrétariat gère les rendez-vous et la facturation en toute fluidité, nous permettant de nous concentrer pleinement sur les soins.",
          "quote_author": "Dr. Yassine El Amrani",
          "quote_role": "Cardiologue — Casablanca",
          "feat_ehr": "Dossier Patient Unique",
          "feat_sync": "Flux Cabinet-Secrétariat",
          "feat_security": "Confidentialité & Chiffrement",
          "feat_continuity": "Suivi Clinique Continu"
        },
        "login": {
          "title": "Espace Praticien",
          "subtitle": "Connectez-vous pour accéder à vos dossiers et planifications.",
          "email_label": "Adresse Email",
          "email_placeholder": "exemple@cabinet.ma",
          "password_label": "Mot de passe",
          "remember_me": "Se souvenir de moi",
          "forgot_password": "Mot de passe oublié ?",
          "submit": "Se connecter",
          "error": "Email ou mot de passe incorrect",
          "no_account": "Pas encore de compte ?",
          "signup_link": "Créer un compte"
        },
        "signup": {
          "title": "Rejoindre le réseau Cabinet+",
          "subtitle": "Inscrivez votre cabinet médical ou accédez à votre espace patient.",
          "firstname": "Prénom",
          "lastname": "Nom",
          "submit": "Créer le profil",
          "has_account": "Déjà membre ?",
          "login_link": "S'identifier"
        }
      },
      "portal": {
        "error": {
          "oops": "Oups !",
          "linked": "Si vous venez de créer votre compte, il est possible que votre dossier médical ne soit pas encore lié."
        },
        "header": {
          "active_profile": "Profil Actif",
          "gender_m": "Homme",
          "gender_f": "Femme",
          "age_years": "{{count}} ans",
          "blood_group": "Groupe: {{group}}",
          "allergies": "Allergies: {{list}}",
          "linked_device": "Appareil lié"
        },
        "upcoming": {
          "title": "Prochaine Consultation",
          "subtitle": "Détails de votre prochain rendez-vous",
          "cancel": "Annuler",
          "reschedule": "Déplacer",
          "no_appointments": "Aucun rendez-vous planifié",
          "book": "Prendre rendez-vous"
        },
        "history": {
          "title": "Historique Médical",
          "subtitle": "Comptes-rendus et ordonnances",
          "consultation": "Consultation - {{diagnostic}}",
          "no_history": "Aucun historique disponible",
          "view_all": "Voir tous les fichiers"
        },
        "treatments": {
          "title": "Traitements",
          "subtitle": "Médicaments en cours",
          "active": "Traitement Actif",
          "ongoing": "En cours",
          "no_treatments": "Aucun traitement répertorié",
          "renew": "Demander un renouvellement"
        },
        "cta": {
          "title": "Besoin d'un contrôle ?",
          "subtitle": "Réservez votre prochain rendez-vous en moins de 2 minutes.",
          "book": "Réserver maintenant"
        }
      },
      "common": {
        "loading": "Chargement...",
        "error_loading": "Impossible de charger les données",
        "view_details": "Voir le dossier",
        "cancel": "Annuler",
        "save": "Enregistrer",
        "delete": "Supprimer",
        "edit": "Modifier"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "search": "Search...",
        "notifications": "Notifications",
        "messages": "Messages",
        "profile": "My Profile",
        "settings": "Settings",
        "logout": "Logout",
        "language": "Language",
        "recent_messages": "Recent Messages",
        "no_notifs": "No notifications",
        "no_messages": "No messages",
        "view_all": "View all",
        "open_chat": "Open chat",
        "loading": "Loading..."
      },
      "sidebar": {
        "dashboard": "Dashboard",
        "patients": "Patients",
        "appointments": "Appointments",
        "consultation": "Consultation",
        "chat": "Messages",
        "profile": "My Profile",
        "patient_portal": "Patient Portal",
        "logout": "Logout"
      },
      "roles": {
        "medecin": "Doctor",
        "secretaire": "Secretary",
        "admin": "Administrator",
        "patient": "Patient"
      },
      "dashboard": {
        "overview": "Overview",
        "welcome": "Hello, {{name}}. Here is what's happening today.",
        "new_appointment": "New Appointment",
        "total_patients": "Total Patients",
        "today_appointments": "Today's Appointments",
        "active_doctors": "Active Doctors",
        "new_this_month": "New this month",
        "patient_evolution": "New Patients",
        "patient_evolution_subtitle": "Evolution over the last 6 months",
        "patient_distribution": "Patient Distribution",
        "patient_distribution_subtitle": "By gender",
        "appointments_today": "Today's Appointments",
        "appointments_today_subtitle": "List of patients scheduled today",
        "no_data": "No data available",
        "no_appointments": "No appointments scheduled today",
        "live": "Live",
        "table": {
          "patient": "Patient",
          "time": "Time",
          "reason": "Reason",
          "status": "Status",
          "action": "Action"
        },
        "genders": {
          "m": "Men",
          "f": "Women",
          "other": "Other"
        }
      },
      "patients": {
        "title": "Patients Directory",
        "subtitle": "{{count}} patient registered",
        "subtitle_plural": "{{count}} patients registered",
        "add": "Add Patient",
        "search_placeholder": "Search by name, email or phone...",
        "no_patients": "No patients found",
        "no_patients_desc": "Try other search terms or add a new patient.",
        "table": {
          "patient": "Patient",
          "contact": "Contact",
          "file_num": "File No.",
          "status": "Status",
          "actions": "Actions"
        },
        "modal": {
          "title": "New Patient",
          "firstname": "First Name *",
          "lastname": "Last Name *",
          "birthdate": "Date of Birth *",
          "gender": "Gender *",
          "phone": "Phone *",
          "cin": "CIN",
          "blood_group": "Blood Group",
          "city": "City",
          "insurance": "Insurance",
          "email": "Email",
          "create": "Create Patient",
          "error": "Error during creation"
        }
      },
      "appointments": {
        "title": "Schedule",
        "subtitle": "Manage your daily appointments and consultations.",
        "new": "New",
        "schedule_here": "Schedule here",
        "queue": "Waiting Queue",
        "waiting_patients": "Waiting Patients",
        "waiting": "Waiting",
        "no_waiting": "No patients waiting",
        "refresh_queue": "Refresh Queue",
        "tasks": "Quick Tasks",
        "reminders": "Personal Reminders",
        "new_task": "New task...",
        "consult": "Consult"
      },
      "chat": {
        "title": "Messages",
        "send": "Send",
        "placeholder": "Type a message...",
        "no_contacts": "No contacts found",
        "select_conv": "Select a conversation to start",
        "history": "Message history",
        "delete_confirm": "Are you sure you want to delete this message?",
        "delete_tooltip": "Delete message",
        "send_error": "Error sending message"
      },
      "consultation": {
        "title": "Ongoing Consultation",
        "patient": "Patient",
        "reason": "Reason",
        "patient_file": "Patient File",
        "save_and_finish": "Finish & Save",
        "saving": "Saving...",
        "success": "Consultation saved successfully!",
        "tabs": {
          "observations": "Observations",
          "vitals": "Vital Signs",
          "diagnosis": "Diagnosis",
          "prescription": "Prescription"
        },
        "observations": {
          "title": "Anamnesis & Clinical Exam",
          "anamnese": "Anamnesis (Medical history)",
          "anamnese_placeholder": "Symptoms, recent history...",
          "exam": "Clinical Exam",
          "exam_placeholder": "Physical observations..."
        },
        "vitals": {
          "title": "Vital Parameters",
          "temp": "Temperature (°C)",
          "bp_sys": "BP Sys",
          "bp_dia": "BP Dia",
          "hr": "Heart Rate (BPM)",
          "spo2": "SpO2 (%)",
          "weight": "Weight (kg)",
          "height": "Height (cm)"
        },
        "diagnosis": {
          "title": "Diagnosis & Management",
          "main": "Main Diagnosis",
          "cim10": "ICD-10 Codes",
          "advice": "Management / Advice",
          "advice_placeholder": "Recommendations for the patient..."
        },
        "prescription": {
          "title": "Digital Prescription",
          "med": "Medication",
          "dosage": "Dosage",
          "duration": "Duration",
          "add": "Add to prescription",
          "no_meds": "No medication added",
          "ready": "Prescription ready",
          "ready_desc": "The PDF will be generated after saving the consultation."
        }
      },
      "profile": {
        "title": "My Account",
        "subtitle": "Manage your profile and preferences",
        "title_dr": "Dr.",
        "title_pr": "Pr.",
        "tabs": {
          "profile": "My profile",
          "security": "Security",
          "schedule": "My schedule"
        },
        "profile_saved": "Profile updated successfully!",
        "save_error": "Error while saving",
        "password_mismatch": "Passwords do not match",
        "password_changed": "Password changed!",
        "schedule_saved": "Schedule saved!",
        "form": {
          "firstname": "First Name",
          "lastname": "Last Name",
          "phone": "Phone",
          "title": "Title",
          "bio": "Biography",
          "bio_placeholder": "Describe your experience...",
          "duration": "Consultation duration (min)",
          "price": "Price (MAD)",
          "available": "Available for consultations",
          "save_profile": "Save profile"
        },
        "security": {
          "old_password": "Old password",
          "new_password": "New password",
          "confirm_password": "Confirm password",
          "change_password": "Change password"
        },
        "schedule": {
          "save_schedule": "Save schedule"
        },
        "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      "patient_detail": {
        "tabs": {
          "info": "Information",
          "medical_file": "Medical File",
          "history": "History"
        },
        "info": {
          "fullname": "First & Last Name",
          "age": "Age",
          "age_years": "{{count}} years",
          "birth_date": "Date of Birth",
          "gender": "Gender",
          "phone": "Phone",
          "email": "Email",
          "cin": "ID Card (CIN)",
          "city": "City",
          "blood_group": "Blood Group",
          "insurance": "Insurance",
          "insurance_num": "Insurance No.",
          "file_num": "File No."
        },
        "medical_file": {
          "edit": "Edit medical file",
          "allergies": "Allergies",
          "perso_history": "Personal History",
          "family_history": "Family History",
          "current_treatments": "Current Treatments",
          "lifestyle": "Lifestyle",
          "placeholder": "Enter {{field}}...",
          "not_specified": "Not specified"
        },
        "history": {
          "consultations": "Latest Consultations",
          "no_consultations": "No consultations",
          "appointments": "Latest Appointments",
          "no_appointments": "No appointments"
        }
      },
      "assistant": {
        "title": "Operational Desk",
        "subtitle": "Manage billing, queue, and daily clinic administrative tasks.",
        "new_invoice": "New Invoice",
        "add_queue": "Add to Queue",
        "today_revenue": "Today's Revenue",
        "revenue_growth": "15% more than yesterday",
        "pending_payments": "Pending Payments",
        "overdue": "Overdue",
        "view_billing": "View Billing Center",
        "clinic_utilization": "Clinic Utilization",
        "room_usage": "Room Usage",
        "optimize_schedule": "Optimise Schedule",
        "live_queue": "Live Patient Queue",
        "queue_subtitle": "Current status of patients waiting in the clinic",
        "billing_log": "Daily Billing Log",
        "billing_subtitle": "Recent financial transactions",
        "table": {
          "invoice": "Invoice",
          "patient": "Patient",
          "amount": "Amount",
          "status": "Status"
        },
        "status": {
          "paid": "Paid",
          "pending": "Pending",
          "in_room": "In Room",
          "waiting": "Waiting",
          "lab": "Lab"
        }
      },
      "users": {
        "title": "User Management",
        "subtitle": "{{count}} user registered",
        "subtitle_plural": "{{count}} users registered",
        "add": "Add user",
        "search_placeholder": "Search by name or email...",
        "no_users": "No users found",
        "access_denied": "Access restricted to administrators",
        "modal": {
          "title": "New User",
          "firstname": "First Name *",
          "lastname": "Last Name *",
          "email": "Email *",
          "password": "Password *",
          "role": "Role *",
          "specialty": "Specialty *",
          "specialty_select": "Select...",
          "order_num": "Order No. *",
          "phone": "Phone",
          "create": "Create",
          "error": "Error during creation"
        },
        "table": {
          "user": "User",
          "role": "Role",
          "phone": "Phone",
          "status": "Status"
        },
        "status": {
          "active": "Active",
          "inactive": "Inactive"
        },
        "actions": {
          "activate": "Activate",
          "deactivate": "Deactivate",
          "delete": "Delete",
          "delete_confirm": "Delete this user?"
        }
      },
      "auth": {
        "layout": {
          "title": "Clinical Management & Care Coordination",
          "subtitle": "Tailored for Moroccan healthcare providers. Centralize electronic health records (EHR), streamline doctor-secretary workflows, and access secure clinic coordination.",
          "quote": "Thanks to Cabinet+ real-time sync, our front desk manages the booking flow and billing seamlessly, leaving us free to focus entirely on patient care.",
          "quote_author": "Dr. Yassine El Amrani",
          "quote_role": "Cardiologist — Casablanca",
          "feat_ehr": "Single Electronic Record",
          "feat_sync": "Secretary-Doctor Sync",
          "feat_security": "Encrypted Health Data",
          "feat_continuity": "Continuous Clinical Follow-up"
        },
        "login": {
          "title": "Clinic Workspace",
          "subtitle": "Enter your credentials to access your schedule and patient files.",
          "email_label": "Email Address",
          "email_placeholder": "example@cabinet.ma",
          "password_label": "Password",
          "remember_me": "Remember me",
          "forgot_password": "Forgot password?",
          "submit": "Log In",
          "error": "Incorrect email or password",
          "no_account": "Don't have an account?",
          "signup_link": "Create an account"
        },
        "signup": {
          "title": "Register on Cabinet+",
          "subtitle": "Set up your medical practice or access your patient portal.",
          "firstname": "First Name",
          "lastname": "Last Name",
          "submit": "Register Account",
          "has_account": "Already a member?",
          "login_link": "Sign In"
        }
      },
      "portal": {
        "error": {
          "oops": "Oops!",
          "linked": "If you just created your account, your medical file might not be linked yet."
        },
        "header": {
          "active_profile": "Active Profile",
          "gender_m": "Male",
          "gender_f": "Female",
          "age_years": "{{count}} years",
          "blood_group": "Group: {{group}}",
          "allergies": "Allergies: {{list}}",
          "linked_device": "Linked Device"
        },
        "upcoming": {
          "title": "Upcoming Consultation",
          "subtitle": "Details of your next appointment",
          "cancel": "Cancel",
          "reschedule": "Reschedule",
          "no_appointments": "No scheduled appointments",
          "book": "Book an appointment"
        },
        "history": {
          "title": "Medical History",
          "subtitle": "Reports and prescriptions",
          "consultation": "Consultation - {{diagnostic}}",
          "no_history": "No history available",
          "view_all": "View all files"
        },
        "treatments": {
          "title": "Treatments",
          "subtitle": "Current medications",
          "active": "Active Treatment",
          "ongoing": "Ongoing",
          "no_treatments": "No treatments listed",
          "renew": "Request renewal"
        },
        "cta": {
          "title": "Need a check-up?",
          "subtitle": "Book your next appointment in less than 2 minutes.",
          "book": "Book now"
        }
      },
      "common": {
        "loading": "Loading...",
        "error_loading": "Unable to load data",
        "view_details": "View file",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit"
      }
    }
  },
  ar: {
    translation: {
      "nav": {
        "search": "بحث...",
        "notifications": "الإشعارات",
        "messages": "الرسائل",
        "profile": "ملفي الشخصي",
        "settings": "الإعدادات",
        "logout": "تسجيل الخروج",
        "language": "اللغة",
        "recent_messages": "الرسائل الأخيرة",
        "no_notifs": "لا توجد إشعارات",
        "no_messages": "لا توجد رسائل",
        "view_all": "عرض الكل",
        "open_chat": "فتح الدردشة",
        "loading": "جاري التحميل..."
      },
      "sidebar": {
        "dashboard": "لوحة القيادة",
        "patients": "المرضى",
        "appointments": "المواعيد",
        "consultation": "الاستشارة",
        "chat": "المراسلة",
        "profile": "ملفي الشخصي",
        "patient_portal": "فضاء المريض",
        "logout": "تسجيل الخروج"
      },
      "roles": {
        "medecin": "طبيب",
        "secretaire": "سكرتيرة",
        "admin": "مدير",
        "patient": "مريض"
      },
      "dashboard": {
        "overview": "نظرة عامة",
        "welcome": "مرحباً، {{name}}. إليك ما يحدث اليوم.",
        "new_appointment": "موعد جديد",
        "total_patients": "إجمالي المرضى",
        "today_appointments": "مواعيد اليوم",
        "active_doctors": "الأطباء النشطون",
        "new_this_month": "جدد هذا الشهر",
        "patient_evolution": "المرضى الجدد",
        "patient_evolution_subtitle": "التطور خلال آخر 6 أشهر",
        "patient_distribution": "توزيع المرضى",
        "patient_distribution_subtitle": "حسب الجنس",
        "appointments_today": "مواعيد اليوم",
        "appointments_today_subtitle": "قائمة المرضى المبرمجين اليوم",
        "no_data": "لا توجد بيانات متاحة",
        "no_appointments": "لا توجد مواعيد مقررة اليوم",
        "live": "مباشر",
        "table": {
          "patient": "المريض",
          "time": "الوقت",
          "reason": "السبب",
          "status": "الحالة",
          "action": "الإجراء"
        },
        "genders": {
          "m": "رجال",
          "f": "نساء",
          "other": "آخر"
        }
      },
      "patients": {
        "title": "دليل المرضى",
        "subtitle": "تم تسجيل {{count}} مريض",
        "subtitle_plural": "تم تسجيل {{count}} مريض",
        "add": "إضافة مريض",
        "search_placeholder": "البحث بالاسم، البريد الإلكتروني أو الهاتف...",
        "no_patients": "لم يتم العثور على أي مريض",
        "no_patients_desc": "جرب كلمات بحث أخرى أو أضف مريضاً جديداً.",
        "table": {
          "patient": "المريض",
          "contact": "الاتصال",
          "file_num": "رقم الملف",
          "status": "الحالة",
          "actions": "الإجراءات"
        },
        "modal": {
          "title": "مريض جديد",
          "firstname": "الاسم الشخصي *",
          "lastname": "الاسم العائلي *",
          "birthdate": "تاريخ الميلاد *",
          "gender": "الجنس *",
          "phone": "الهاتف *",
          "cin": "بطاقة التعريف",
          "blood_group": "فصيلة الدم",
          "city": "المدينة",
          "insurance": "التأمين",
          "email": "البريد الإلكتروني",
          "create": "إنشاء مريض",
          "error": "خطأ أثناء الإنشاء"
        }
      },
      "appointments": {
        "title": "جدول المواعيد",
        "subtitle": "إدارة مواعيدك اليومية والاستشارات.",
        "new": "جديد",
        "schedule_here": "برمجة هنا",
        "queue": "طابور الانتظار",
        "waiting_patients": "مرضى في الانتظار",
        "waiting": "في الانتظار",
        "no_waiting": "لا يوجد مرضى في الانتظار",
        "refresh_queue": "تحديث الطابور",
        "tasks": "مهام سريعة",
        "reminders": "تذكيرات شخصية",
        "new_task": "مهمة جديدة...",
        "consult": "استشارة"
      },
      "chat": {
        "title": "المراسلة",
        "send": "إرسال",
        "placeholder": "اكتب رسالة...",
        "no_contacts": "لم يتم العثور على جهات اتصال",
        "select_conv": "اختر محادثة للبدء",
        "history": "سجل الرسائل",
        "delete_confirm": "هل أنت متأكد أنك تريد حذف هذه الرسالة؟",
        "delete_tooltip": "حذف الرسالة",
        "send_error": "خطأ في إرسال الرسالة"
      },
      "consultation": {
        "title": "الاستشارة جارية",
        "patient": "المريض",
        "reason": "السبب",
        "patient_file": "ملف المريض",
        "save_and_finish": "إنهاء وحفظ",
        "saving": "جاري الحفظ...",
        "success": "تم حفظ الاستشارة بنجاح!",
        "tabs": {
          "observations": "الملاحظات",
          "vitals": "العلامات الحيوية",
          "diagnosis": "التشخيص",
          "prescription": "الوصفة الطبية"
        },
        "observations": {
          "title": "السوابق والفحص السريري",
          "anamnese": "السوابق (تاريخ المرض)",
          "anamnese_placeholder": "الأعراض، السوابق الأخيرة...",
          "exam": "الفحص السريري",
          "exam_placeholder": "الملاحظات الفيزيائية..."
        },
        "vitals": {
          "title": "المؤشرات الحيوية",
          "temp": "الحرارة (°م)",
          "bp_sys": "الضغط الانقباضي",
          "bp_dia": "الضغط الانبساطي",
          "hr": "نبض القلب (ن/د)",
          "spo2": "نسبة الأكسجين (%)",
          "weight": "الوزن (كغ)",
          "height": "الطول (سم)"
        },
        "diagnosis": {
          "title": "التشخيص والعلاج",
          "main": "التشخيص الرئيسي",
          "cim10": "رموز CIM-10",
          "advice": "العلاج / النصائح",
          "advice_placeholder": "توصيات للمريض..."
        },
        "prescription": {
          "title": "الوصفة الطبية الرقمية",
          "med": "الدواء",
          "dosage": "الجرعة",
          "duration": "المدة",
          "add": "إضافة إلى الوصفة",
          "no_meds": "لم يتم إضافة أي دواء",
          "ready": "الوصفة جاهزة",
          "ready_desc": "سيتم إنشاء ملف PDF بعد حفظ الاستشارة."
        }
      },
      "profile": {
        "title": "حسابي",
        "subtitle": "إدارة ملفك الشخصي وتفضيلاتك",
        "title_dr": "د.",
        "title_pr": "أ.د.",
        "tabs": {
          "profile": "ملفي الشخصي",
          "security": "الأمان",
          "schedule": "مواعيد العمل"
        },
        "profile_saved": "تم تحديث الملف الشخصي بنجاح!",
        "save_error": "خطأ أثناء الحفظ",
        "password_mismatch": "كلمات المرور غير متطابقة",
        "password_changed": "تم تغيير كلمة المرور!",
        "schedule_saved": "تم حفظ المواعيد!",
        "form": {
          "firstname": "الاسم الشخصي",
          "lastname": "الاسم العائلي",
          "phone": "الهاتف",
          "title": "الصفة",
          "bio": "السيرة الذاتية",
          "bio_placeholder": "صف خبرتك...",
          "duration": "مدة الاستشارة (دقيقة)",
          "price": "التعريفة (درهم)",
          "available": "متاح للاستشارات",
          "save_profile": "حفظ الملف الشخصي"
        },
        "security": {
          "old_password": "كلمة المرور القديمة",
          "new_password": "كلمة المرور الجديدة",
          "confirm_password": "تأكيد كلمة المرور",
          "change_password": "تغيير كلمة المرور"
        },
        "schedule": {
          "save_schedule": "حفظ المواعيد"
        },
        "days": ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
      },
      "patient_detail": {
        "tabs": {
          "info": "المعلومات",
          "medical_file": "الملف الطبي",
          "history": "السجل"
        },
        "info": {
          "fullname": "الاسم الكامل",
          "age": "السن",
          "age_years": "{{count}} سنة",
          "birth_date": "تاريخ الميلاد",
          "gender": "الجنس",
          "phone": "الهاتف",
          "email": "البريد الإلكتروني",
          "cin": "رقم البطاقة الوطنية",
          "city": "المدينة",
          "blood_group": "فصيلة الدم",
          "insurance": "التأمين",
          "insurance_num": "رقم التأمين",
          "file_num": "رقم الملف"
        },
        "medical_file": {
          "edit": "تعديل الملف",
          "allergies": "الحساسية",
          "perso_history": "السوابق الشخصية",
          "family_history": "السوابق العائلية",
          "current_treatments": "العلاجات الحالية",
          "lifestyle": "نمط الحياة",
          "placeholder": "أدخل {{field}}...",
          "not_specified": "غير محدد"
        },
        "history": {
          "consultations": "آخر الاستشارات",
          "no_consultations": "لا توجد استشارات",
          "appointments": "آخر المواعيد",
          "no_appointments": "لا توجد مواعيد"
        }
      },
      "assistant": {
        "title": "المكتب التشغيلي",
        "subtitle": "إدارة الفواتير، طابور الانتظار، والمهام الإدارية اليومية للعيادة.",
        "new_invoice": "فاتورة جديدة",
        "add_queue": "إضافة للطابور",
        "today_revenue": "مداخيل اليوم",
        "revenue_growth": "15٪ أكثر من أمس",
        "pending_payments": "مدفوعات معلقة",
        "overdue": "متأخر",
        "view_billing": "مركز الفواتير",
        "clinic_utilization": "استخدام العيادة",
        "room_usage": "استخدام الغرف",
        "optimize_schedule": "تحسين الجدول الزمني",
        "live_queue": "طابور المرضى المباشر",
        "queue_subtitle": "الحالة الراهنة للمرضى الذين ينتظرون في العيادة",
        "billing_log": "سجل الفواتير اليومي",
        "billing_subtitle": "المعاملات المالية الأخيرة",
        "table": {
          "invoice": "الفاتورة",
          "patient": "المريض",
          "amount": "المبلغ",
          "status": "الحالة"
        },
        "status": {
          "paid": "تم الدفع",
          "pending": "قيد الانتظار",
          "in_room": "في الغرفة",
          "waiting": "في الانتظار",
          "lab": "المختبر"
        }
      },
      "users": {
        "title": "إدارة المستخدمين",
        "subtitle": "تم تسجيل مستخدم واحد",
        "subtitle_plural": "تم تسجيل {{count}} مستخدمين",
        "add": "إضافة مستخدم",
        "search_placeholder": "البحث بالاسم أو البريد الإلكتروني...",
        "no_users": "لم يتم العثور على أي مستخدم",
        "access_denied": "الوصول مقتصر على المسؤولين",
        "modal": {
          "title": "مستخدم جديد",
          "firstname": "الاسم الشخصي *",
          "lastname": "الاسم العائلي *",
          "email": "البريد الإلكتروني *",
          "password": "كلمة المرور *",
          "role": "الدور *",
          "specialty": "التخصص *",
          "specialty_select": "اختر...",
          "order_num": "رقم الترتيب *",
          "phone": "الهاتف",
          "create": "إنشاء",
          "error": "خطأ أثناء الإنشاء"
        },
        "table": {
          "user": "المستخدم",
          "role": "الدور",
          "phone": "الهاتف",
          "status": "الحالة"
        },
        "status": {
          "active": "نشط",
          "inactive": "غير نشط"
        },
        "actions": {
          "activate": "تفعيل",
          "deactivate": "تعطيل",
          "delete": "حذف",
          "delete_confirm": "هل تريد حذف هذا المستخدم؟"
        }
      },
      "auth": {
        "layout": {
          "title": "منصة التنسيق الطبي وإدارة العيادات",
          "subtitle": "مصممة خصيصاً للممارسين الطبيين بالمغرب. مركزة الملفات الطبية الرقمية، وتسهيل التنسيق الفوري بين الطبيب والسكرتارية.",
          "quote": "بفضل المزامنة الفورية لـ Cabinet+، تُدير السكرتارية المواعيد والفوترة بسلاسة تامة، مما يتيح لنا التركيز الكامل على جودة الرعاية الطبية.",
          "quote_author": "د. ياسين العمراني",
          "quote_role": "أخصائي أمراض القلب — الدار البيضاء",
          "feat_ehr": "ملف طبي موحد للمريض",
          "feat_sync": "مزامنة الطبيب والسكرتارية",
          "feat_security": "تشفير البيانات الطبية",
          "feat_continuity": "متابعة سريرية مستمرة"
        },
        "login": {
          "title": "الفضاء المهني",
          "subtitle": "سجل الدخول للولوج إلى جدول المواعيد وملفات المرضى.",
          "email_label": "البريد الإلكتروني",
          "email_placeholder": "exemple@cabinet.ma",
          "password_label": "كلمة المرور",
          "remember_me": "تذكرني",
          "forgot_password": "نسيت كلمة المرور؟",
          "submit": "تسجيل الدخول",
          "error": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          "no_account": "ليس لديك حساب؟",
          "signup_link": "إنشاء حساب"
        },
        "signup": {
          "title": "الانضمام إلى Cabinet+",
          "subtitle": "أنشئ حساب عيادتك الطبية أو قم بالولوج لفضاء المريض الخاص بك.",
          "firstname": "الاسم الشخصي",
          "lastname": "الاسم العائلي",
          "submit": "إنشاء الحساب",
          "has_account": "مسجل بالفعل؟",
          "login_link": "تسجيل الدخول"
        }
      },
      "portal": {
        "error": {
          "oops": "عذراً!",
          "linked": "إذا كنت قد أنشأت حسابك للتو، فمن المحتمل أن ملفك الطبي لم يتم ربطه بعد."
        },
        "header": {
          "active_profile": "الملف الشخصي نشط",
          "gender_m": "ذكر",
          "gender_f": "أنثى",
          "age_years": "{{count}} سنة",
          "blood_group": "الفصيلة: {{group}}",
          "allergies": "الحساسية: {{list}}",
          "linked_device": "جهاز مرتبط"
        },
        "upcoming": {
          "title": "الاستشارة القادمة",
          "subtitle": "تفاصيل موعدك القادم",
          "cancel": "إلغاء",
          "reschedule": "تغيير الموعد",
          "no_appointments": "لا توجد مواعيد مجدولة",
          "book": "حجز موعد"
        },
        "history": {
          "title": "السجل الطبي",
          "subtitle": "التقارير والوصفات الطبية",
          "consultation": "استشارة - {{diagnostic}}",
          "no_history": "لا يوجد سجل متاح",
          "view_all": "عرض جميع الملفات"
        },
        "treatments": {
          "title": "العلاجات",
          "subtitle": "الأدوية الحالية",
          "active": "العلاج النشط",
          "ongoing": "قيد التنفيذ",
          "no_treatments": "لا توجد علاجات مدرجة",
          "renew": "طلب تجديد"
        },
        "cta": {
          "title": "تحتاج إلى فحص؟",
          "subtitle": "احجز موعدك القادم في أقل من دقيقتين.",
          "book": "احجز الآن"
        }
      },
      "common": {
        "loading": "جاري التحميل...",
        "error_loading": "تعذر تحميل البيانات",
        "view_details": "عرض الملف",
        "cancel": "إلغاء",
        "save": "حفظ",
        "delete": "حذف",
        "edit": "تعديل"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'ar'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

// Handle RTL
i18n.on('languageChanged', (lng) => {
  if (lng === 'ar') {
    document.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.dir = 'ltr';
    document.documentElement.lang = lng;
  }
});

export default i18n;
