// frontend/cypress/e2e/deployment.cy.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Smoke Tests & Déploiement
// Ce test vérifie que l'application de base se charge et que le titre est correct.
// ═══════════════════════════════════════════════════════════════════════════════

describe('🌐 Déploiement et Disponibilité Frontend', () => {
  it('TC-FRONT-DEPLOY-01 : L\'application se charge à la racine', () => {
    cy.visit('/');
    cy.title().should('not.be.empty');
  });

  it('TC-FRONT-DEPLOY-02 : La page d\'accueil contient le nom du projet', () => {
    cy.visit('/');
    cy.contains(/Cabinet/i).should('exist');
  });

  it('TC-FRONT-DEPLOY-03 : La navigation vers /login fonctionne sans erreur réseau', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    // On s'attend à voir le formulaire de connexion
    cy.get('form').should('exist');
  });
});
