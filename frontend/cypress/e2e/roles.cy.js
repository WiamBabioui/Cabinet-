// cypress/e2e/roles.cy.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Cypress : Autorisations et Rôles (E2E)
// ═══════════════════════════════════════════════════════════════════════════════

describe('🛡️ Autorisations et Rôles — Tests E2E', () => {

  const apiUrl = Cypress.env('apiUrl');
  const { adminEmail, adminPassword, medecinEmail, medecinPassword,
          secretaireEmail, secretairePassword, patientEmail, patientPassword } = Cypress.env();

  // ─── Helper : Login par API et retourne le token ────────────────────────────
  const getToken = (email, password) => {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email, mot_de_passe: password },
      failOnStatusCode: false,
    }).then((res) => res.body.token);
  };

  // ─── TC-CY-ROLE-01 : Patient — accès espace personnel ──────────────────────

  it('TC-CY-ROLE-01 : Patient accède à son espace (dashboard)', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/dashboard');
    cy.url().should('not.include', '/login');
  });

  // ─── TC-CY-ROLE-02 : Patient — route admin bloquée (via API) ───────────────

  it('TC-CY-ROLE-02 : Patient ne peut PAS accéder à GET /api/users (admin only)', () => {
    getToken(patientEmail, patientPassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(403);
      });
    });
  });

  // ─── TC-CY-ROLE-03 : Patient — ne peut pas créer un patient ────────────────

  it('TC-CY-ROLE-03 : Patient ne peut PAS créer un patient → 403', () => {
    getToken(patientEmail, patientPassword).then((token) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/patients`,
        headers: { Authorization: `Bearer ${token}` },
        body: { prenom: 'Hack', nom: 'Test', email: 'hack@test.com' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(403);
      });
    });
  });

  // ─── TC-CY-ROLE-04 : Patient — ne peut pas supprimer un utilisateur ─────────

  it('TC-CY-ROLE-04 : Patient ne peut PAS supprimer un utilisateur → 403', () => {
    getToken(patientEmail, patientPassword).then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/users/1`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(403);
      });
    });
  });

  // ─── TC-CY-ROLE-05 : Médecin — peut consulter patients et RDV ──────────────

  it('TC-CY-ROLE-05 : Médecin peut consulter ses patients et ses RDV', () => {
    getToken(medecinEmail, medecinPassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/patients`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.equal(200);
      });

      cy.request({
        method: 'GET',
        url: `${apiUrl}/appointments`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.equal(200);
      });
    });
  });

  // ─── TC-CY-ROLE-06 : Médecin — ne peut pas gérer les admins ────────────────

  it('TC-CY-ROLE-06 : Médecin ne peut PAS lister tous les utilisateurs (admin) → 403', () => {
    getToken(medecinEmail, medecinPassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(403);
      });
    });
  });

  // ─── TC-CY-ROLE-07 : Secrétaire — peut gérer les RDV ──────────────────────

  it('TC-CY-ROLE-07 : Secrétaire peut accéder aux rendez-vous → 200', () => {
    getToken(secretaireEmail, secretairePassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/appointments`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.equal(200);
      });
    });
  });

  // ─── TC-CY-ROLE-08 : Secrétaire — ne peut pas accéder aux fonctions admin ──

  it('TC-CY-ROLE-08 : Secrétaire ne peut PAS lister les utilisateurs → 403', () => {
    getToken(secretaireEmail, secretairePassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(403);
      });
    });
  });

  // ─── TC-CY-ROLE-09 : Admin — accès complet aux utilisateurs ────────────────

  it('TC-CY-ROLE-09 : Admin peut accéder à la liste des utilisateurs → 200', () => {
    getToken(adminEmail, adminPassword).then((token) => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('users');
      });
    });
  });

  // ─── TC-CY-ROLE-10 : Sidebar différente selon le rôle ──────────────────────

  it('TC-CY-ROLE-10 : Médecin voit les menus appropriés à son rôle', () => {
    cy.loginByApi(medecinEmail, medecinPassword);
    cy.visit('/');
    cy.url().should('not.include', '/auth/login');

    // The sidebar should exist in the DOM (it is always rendered, hidden on mobile via CSS)
    cy.get('[data-cy="sidebar"]').should('exist');

    // Médecin should NOT see admin-only links
    cy.get('a[href*="/admin"], [data-cy="admin-link"]').should('not.exist');
  });

  // ─── TC-CY-ROLE-11 : Navigation Patient limitée à son espace ───────────────

  it('TC-CY-ROLE-11 : Patient voit uniquement les menus de son espace', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/dashboard');

    // Admin-specific buttons/links should not exist
    cy.get('[data-cy="user-management"], a[href*="/users"], [data-cy="admin-link"]')
      .should('not.exist');
  });
});
