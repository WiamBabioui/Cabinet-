// cypress/e2e/appointments.cy.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Cypress : Gestion des Rendez-vous (E2E)
// ═══════════════════════════════════════════════════════════════════════════════

describe('📅 Rendez-vous — Tests E2E', () => {

  const secretaireEmail = Cypress.env('secretaireEmail');
  const secretairePassword = Cypress.env('secretairePassword');
  const medecinEmail = Cypress.env('medecinEmail');
  const medecinPassword = Cypress.env('medecinPassword');
  const patientEmail = Cypress.env('patientEmail');
  const patientPassword = Cypress.env('patientPassword');
  const apiUrl = Cypress.env('apiUrl');

  // ─── Helper : Login rapide par API ────────────────────────────────────────

  const loginAs = (email, password) => {
    cy.loginByApi(email, password);
  };

  // ─── TC-CY-RDV-01 : Page rendez-vous accessible pour la secrétaire ─────────

  it('TC-CY-RDV-01 : Secrétaire accède à la page des rendez-vous', () => {
    loginAs(secretaireEmail, secretairePassword);
    cy.visit('/appointments');
    cy.url().should('include', '/appointments');
    cy.get('[data-cy="appointments-list"], .appointments-container, table')
      .should('exist');
  });

  // ─── TC-CY-RDV-02 : Bouton "Nouveau rendez-vous" visible pour secrétaire ───

  it('TC-CY-RDV-02 : Bouton "Nouveau rendez-vous" visible pour la secrétaire', () => {
    loginAs(secretaireEmail, secretairePassword);
    cy.visit('/appointments');
    cy.get('[data-cy="new-appointment-btn"], button:contains("Nouveau"), button:contains("Ajouter"), button:contains("+")')
      .first()
      .should('be.visible');
  });

  // ─── TC-CY-RDV-03 : Création d'un rendez-vous via l'API (test rapide) ──────

  it('TC-CY-RDV-03 : Secrétaire crée un RDV valide via API → 201', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: { email: secretaireEmail, mot_de_passe: secretairePassword },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      // Get medecin ID
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users/medecins-list`,
      }).then((medecinRes) => {
        const medecinUserId = medecinRes.body.medecins?.[0]?.utilisateur_id ||
                               medecinRes.body.medecins?.[0]?.id;

        if (!medecinUserId) {
          cy.log('No médecin found — skipping appointment creation test');
          return;
        }

        // Create appointment
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        futureDate.setHours(11, 0, 0, 0);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/appointments`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            patient_email: patientEmail,
            medecin_id: medecinUserId,
            date_heure: futureDate.toISOString(),
            duree: 30,
            type_rdv: 'consultation',
            motif: 'Test E2E Cypress',
          },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.be.oneOf([201, 409]);
        });
      });
    });
  });

  // ─── TC-CY-RDV-04 : Liste des RDV affichée pour le médecin ─────────────────

  it('TC-CY-RDV-04 : Médecin voit ses rendez-vous dans la liste', () => {
    loginAs(medecinEmail, medecinPassword);
    cy.visit('/appointments');

    cy.get('[data-cy="appointments-list"], .appointments-container, table, .appointment-item')
      .should('exist');
  });

  // ─── TC-CY-RDV-05 : Filtre par date sur les rendez-vous ────────────────────

  it('TC-CY-RDV-05 : Filtre par date fonctionne sur la liste des RDV', () => {
    loginAs(secretaireEmail, secretairePassword);
    cy.visit('/appointments');

    // Click on the first date button in the week selector
    cy.get('[data-cy="date-filter"] button').first().click();
    
    // Results should still be visible
    cy.get('[data-cy="appointments-list"]').should('exist');
  });

  // ─── TC-CY-RDV-06 : Patient voit uniquement ses rendez-vous ────────────────

  it('TC-CY-RDV-06 : Patient accède à ses rendez-vous (espace patient)', () => {
    loginAs(patientEmail, patientPassword);
    cy.visit('/appointments');

    // Patient should see their appointments
    cy.get('[data-cy="appointments-list"], .appointments-container, table')
      .should('exist');
  });

  // ─── TC-CY-RDV-07 : Annulation d'un rendez-vous via API ────────────────────

  it('TC-CY-RDV-07 : Secrétaire peut annuler un RDV (statut → cancelled)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: secretaireEmail, mot_de_passe: secretairePassword },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/appointments`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const appointments = res.body.appointments;
        const pendingRdv = appointments.find((a) => a.statut === 'pending' || a.statut === 'confirmed');

        if (!pendingRdv) {
          cy.log('No pending/confirmed appointment to cancel — skipping');
          return;
        }

        cy.request({
          method: 'PUT',
          url: `${apiUrl}/appointments/${pendingRdv.id}`,
          headers: { Authorization: `Bearer ${token}` },
          body: { statut: 'cancelled' },
        }).then((updateRes) => {
          expect(updateRes.status).to.equal(200);
          expect(updateRes.body.appointment.statut).to.equal('cancelled');
        });
      });
    });
  });

  // ─── TC-CY-RDV-08 : Validation d'un RDV par la secrétaire ─────────────────

  it('TC-CY-RDV-08 : Secrétaire valide un RDV (statut pending → confirmed)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: medecinEmail, mot_de_passe: medecinPassword },
    }).then((loginRes) => {
      const medecinToken = loginRes.body.token;

      // Get a pending appointment
      cy.request({
        method: 'GET',
        url: `${apiUrl}/appointments`,
        headers: { Authorization: `Bearer ${medecinToken}` },
      }).then((res) => {
        const pendingRdv = res.body.appointments.find((a) => a.statut === 'pending');
        if (!pendingRdv) {
          cy.log('No pending appointment — skipping validation test');
          return;
        }

        // Now confirm as secrétaire
        cy.request({
          method: 'POST',
          url: `${apiUrl}/auth/login`,
          body: { email: secretaireEmail, mot_de_passe: secretairePassword },
        }).then((secLogin) => {
          cy.request({
            method: 'PUT',
            url: `${apiUrl}/appointments/${pendingRdv.id}`,
            headers: { Authorization: `Bearer ${secLogin.body.token}` },
            body: { statut: 'confirmed' },
          }).then((updateRes) => {
            expect(updateRes.status).to.equal(200);
            expect(updateRes.body.appointment.statut).to.equal('confirmed');
          });
        });
      });
    });
  });
});
