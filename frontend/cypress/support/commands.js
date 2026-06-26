// cypress/support/commands.js
// ═══════════════════════════════════════════════════════════════════════════════
// Cypress Custom Commands pour Cabinet+
// ═══════════════════════════════════════════════════════════════════════════════

// ─── cy.login(email, password) ────────────────────────────────────────────────
// Logs in via UI — works for all roles
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
  cy.get('[data-cy="login-submit"]').click();
  // Wait for redirect after successful login
  cy.url().should('not.include', '/login');
  cy.window().its('localStorage').invoke('getItem', 'cabinet_token').should('not.be.null');
});

// ─── cy.loginByApi(email, password) ───────────────────────────────────────────
// Logs in via API (fast, no UI — for setting up test state)
// Visits /login first to establish window context, sets localStorage, then
// the calling test can cy.visit('/target') and PrivateRoute will see the token.
Cypress.Commands.add('loginByApi', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, mot_de_passe: password },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.equal(200);
    const { token, user } = response.body;
    // Visit a page to establish the window context BEFORE writing to localStorage
    cy.visit('/auth/login');
    cy.window().then((win) => {
      win.localStorage.setItem('cabinet_token', token);
      win.localStorage.setItem('cabinet_user', JSON.stringify(user));
    });
    cy.wrap(response.body).as('loginResponse');
  });
});

// ─── cy.logout() ──────────────────────────────────────────────────────────────
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
  cy.window().its('localStorage').invoke('getItem', 'cabinet_token').should('be.null');
});

// ─── cy.apiRequest(method, endpoint, body, token) ─────────────────────────────
Cypress.Commands.add('apiRequest', (method, endpoint, body = null, token = null) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const storedToken = localStorage.getItem('cabinet_token');
    if (storedToken) headers.Authorization = `Bearer ${storedToken}`;
  }

  const options = {
    method,
    url: `${Cypress.env('apiUrl')}${endpoint}`,
    headers,
    failOnStatusCode: false,
  };
  if (body) options.body = body;

  return cy.request(options);
});

// ─── cy.checkAccessDenied() ───────────────────────────────────────────────────
// Verifies that the current page shows an access denied message
Cypress.Commands.add('checkAccessDenied', () => {
  cy.url().then((url) => {
    if (url.includes('/login') || url.includes('/unauthorized')) {
      expect(true).to.be.true;
    } else {
      // Should show some error message on the page
      cy.get('[data-cy="error-message"], .error, [role="alert"]').should('exist');
    }
  });
});
