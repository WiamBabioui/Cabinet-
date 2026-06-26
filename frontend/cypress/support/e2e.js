// cypress/support/e2e.js
// ═══════════════════════════════════════════════════════════════════════════════
// Cypress E2E Support File — Cabinet+
// ═══════════════════════════════════════════════════════════════════════════════

import './commands';

// Ignore uncaught React exceptions that don't affect tests
Cypress.on('uncaught:exception', (err) => {
  // Ignore HMR errors
  if (err.message.includes('HMR') || err.message.includes('__vite__')) {
    return false;
  }
  // Ignore ResizeObserver errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Global before each: clear localStorage
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
