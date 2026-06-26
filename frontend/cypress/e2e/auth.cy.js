// cypress/e2e/auth.cy.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Cypress : Authentification (E2E)
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔐 Authentification — Tests E2E', () => {

  // ─── Setup ─────────────────────────────────────────────────────────────────

  const adminEmail = Cypress.env('adminEmail');
  const adminPassword = Cypress.env('adminPassword');
  const badPassword = 'MauvaisMotDePasse!99';
  const unknownEmail = 'qqun_qui_nexiste_pas@test.com';

  // ─── TC-CY-AUTH-01 : Affichage du formulaire de login ──────────────────────

  it('TC-CY-AUTH-01 : Page de login affiche les champs et le bouton', () => {
    cy.visit('/login');
    cy.title().should('contain', 'Cabinet');
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
    cy.get('[data-cy="login-submit"]').should('be.visible');
  });

  // ─── TC-CY-AUTH-02 : Connexion réussie admin ───────────────────────────────

  it('TC-CY-AUTH-02 : Connexion réussie → redirige vers dashboard', () => {
    cy.visit('/auth/login');
    cy.get('[data-cy="email-input"]').type(adminEmail);
    cy.get('[data-cy="password-input"]').type(adminPassword);
    cy.get('[data-cy="login-submit"]').click();

    // Redirect away from /auth/login (admin goes to /)
    cy.url().should('not.include', '/auth/login');
  });

  // ─── TC-CY-AUTH-03 : Token stocké dans localStorage ────────────────────────

  it('TC-CY-AUTH-03 : Après login, token JWT stocké en localStorage', () => {
    cy.visit('/auth/login');
    cy.get('[data-cy="email-input"]').type(adminEmail);
    cy.get('[data-cy="password-input"]').type(adminPassword);
    cy.get('[data-cy="login-submit"]').click();

    cy.url().should('not.include', '/auth/login');
    cy.window().its('localStorage').invoke('getItem', 'cabinet_token').should('not.be.null');
  });

  // ─── TC-CY-AUTH-04 : Mot de passe incorrect → message d'erreur ─────────────

  it('TC-CY-AUTH-04 : Mot de passe incorrect → message d\'erreur affiché', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(adminEmail);
    cy.get('[data-cy="password-input"]').type(badPassword);
    cy.get('[data-cy="login-submit"]').click();

    // Error message displayed, stay on login page
    cy.url().should('include', '/login');
    cy.get('[data-cy="error-message"], .error-message, [role="alert"]')
      .should('be.visible')
      .invoke('text')
      .should('match', /incorrect/i);
  });

  // ─── TC-CY-AUTH-05 : Email inexistant → message d'erreur ───────────────────

  it('TC-CY-AUTH-05 : Email inexistant → message d\'erreur sans 500', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(unknownEmail);
    cy.get('[data-cy="password-input"]').type('SomePassword123!');
    cy.get('[data-cy="login-submit"]').click();

    cy.url().should('include', '/login');
    cy.get('[data-cy="error-message"], .error-message, [role="alert"]').should('be.visible');
  });

  // ─── TC-CY-AUTH-06 : Champs vides → validation frontend ────────────────────

  it('TC-CY-AUTH-06 : Soumission avec champs vides → validation HTML5 ou erreur', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-submit"]').click();

    // Either HTML5 validation prevents submit, or error message shown
    cy.url().should('include', '/login');
  });

  // ─── TC-CY-AUTH-07 : Accès route protégée sans connexion → redirect login ──

  it('TC-CY-AUTH-07 : Accès direct /dashboard sans token → redirige vers /login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  // ─── TC-CY-AUTH-08 : Déconnexion ───────────────────────────────────────────

  it('TC-CY-AUTH-08 : Déconnexion → token supprimé + redirection login', () => {
    // Login first via API (fast)
    cy.loginByApi(adminEmail, adminPassword);
    cy.visit('/');
    cy.url().should('not.include', '/auth/login');

    // Find and click logout button — it is in the sidebar which is hidden on smaller screens
    // but present in the DOM. Force click to handle potential visibility issues.
    cy.get('[data-cy="logout-button"]', { timeout: 12000 })
      .first()
      .click({ force: true });

    cy.url().should('include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'cabinet_token').should('be.null');
  });

  // ─── TC-CY-AUTH-09 : Token expiré → redirection vers login ─────────────────

  it('TC-CY-AUTH-09 : Token JWT expiré → redirection automatique vers login', () => {
    // Set an expired token in localStorage
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.fake_signature';
    cy.visit('/auth/login');
    cy.window().then((win) => {
      win.localStorage.setItem('cabinet_token', expiredToken);
      win.localStorage.setItem('cabinet_user', JSON.stringify({ id: 1, role: 'admin' }));
    });
    cy.visit('/');

    // Axios interceptor catches 401 and redirects to /auth/login
    cy.url().should('satisfy', (url) => url.includes('/login'));
  });

  // ─── TC-CY-AUTH-10 : Persistance de session ────────────────────────────────

  it('TC-CY-AUTH-10 : Après login, actualisation de la page maintient la session', () => {
    cy.loginByApi(adminEmail, adminPassword);
    cy.visit('/dashboard');

    // Reload page — session should persist
    cy.reload();
    cy.url().should('not.include', '/login');
  });
});
