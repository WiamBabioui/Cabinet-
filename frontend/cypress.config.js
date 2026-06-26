// cypress.config.js
// ═══════════════════════════════════════════════════════════════════════════════
// Configuration Cypress pour Cabinet+
// ═══════════════════════════════════════════════════════════════════════════════

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL du frontend (Vite dev server)
    baseUrl: 'http://127.0.0.1:5173',

    // Spec pattern
    specPattern: 'cypress/e2e/**/*.cy.js',

    // Support file
    supportFile: 'cypress/support/e2e.js',

    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 90000,

    // Viewport (desktop)
    viewportWidth: 1280,
    viewportHeight: 800,

    // Environment variables
    env: {
      apiUrl: 'http://127.0.0.1:5000/api',
      // Test user credentials — inserted via seed script in dev DB
      adminEmail: 'admin@cypress-test.com',
      adminPassword: 'CypressTest123!',
      medecinEmail: 'medecin@cypress-test.com',
      medecinPassword: 'CypressTest123!',
      secretaireEmail: 'secretaire@cypress-test.com',
      secretairePassword: 'CypressTest123!',
      patientEmail: 'patient@cypress-test.com',
      patientPassword: 'CypressTest123!',
    },

    setupNodeEvents(on, config) {
      // Task: log to terminal
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },

  component: {
    supportFile: false,
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.jsx',
  },
});
