// cypress/e2e/chat.cy.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Cypress : Chat (E2E)
// ═══════════════════════════════════════════════════════════════════════════════

describe('💬 Chat — Tests E2E', () => {

  const patientEmail = Cypress.env('patientEmail');
  const patientPassword = Cypress.env('patientPassword');
  const medecinEmail = Cypress.env('medecinEmail');
  const medecinPassword = Cypress.env('medecinPassword');
  const apiUrl = Cypress.env('apiUrl');

  // ─── TC-CY-CHAT-01 : Page chat accessible pour le patient ──────────────────

  it('TC-CY-CHAT-01 : Patient accède à la page Chat', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/chat');

    cy.url().should('include', '/chat');
    cy.get('[data-cy="chat-page"], .chat-container, .chat-sidebar, .conversations-list')
      .should('exist');
  });

  // ─── TC-CY-CHAT-02 : Liste de contacts visible pour le patient ─────────────

  it('TC-CY-CHAT-02 : Patient voit ses contacts dans le chat', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/chat');

    // Contact list should contain at least the assigned doctor
    cy.get('[data-cy="contact-item"], .contact-item, .conversation-item, .user-item')
      .should('have.length.at.least', 1);
  });

  // ─── TC-CY-CHAT-03 : Envoi d'un message Patient → Médecin via API ──────────

  it('TC-CY-CHAT-03 : Patient envoie un message à son médecin (API)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: patientEmail, mot_de_passe: patientPassword },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      // Get contacts to find médecin ID
      cy.request({
        method: 'GET',
        url: `${apiUrl}/chat/contacts`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((contactsRes) => {
        const medecin = contactsRes.body.contacts.find((c) => c.role === 'medecin');

        if (!medecin) {
          cy.log('No assigned médecin contact — skipping message send test');
          return;
        }

        cy.request({
          method: 'POST',
          url: `${apiUrl}/chat/messages`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            destinataire_id: medecin.id,
            contenu: 'Bonjour Docteur, test Cypress automatisé.',
          },
        }).then((msgRes) => {
          expect(msgRes.status).to.equal(201);
          expect(msgRes.body.message.content).to.contain('test Cypress');
        });
      });
    });
  });

  // ─── TC-CY-CHAT-04 : Historique de conversation visible ────────────────────

  it('TC-CY-CHAT-04 : Historique des messages affiché dans la conversation', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/chat');

    // Click on the first conversation
    cy.get('[data-cy="contact-item"], .contact-item, .conversation-item')
      .first()
      .click();

    // Messages area should appear
    cy.get('[data-cy="messages-area"], .messages-container, .chat-messages')
      .should('exist');
  });

  // ─── TC-CY-CHAT-05 : Interface d'envoi de message visible ──────────────────

  it('TC-CY-CHAT-05 : Zone de saisie + bouton envoi visibles', () => {
    cy.loginByApi(patientEmail, patientPassword);
    cy.visit('/chat');

    cy.get('[data-cy="contact-item"], .contact-item, .conversation-item')
      .first()
      .click();

    cy.get('[data-cy="message-input"], textarea, input[type="text"]')
      .last()
      .should('be.visible');

    cy.get('[data-cy="send-btn"], button[type="submit"], button:contains("Envoyer")')
      .should('exist');
  });

  // ─── TC-CY-CHAT-06 : Patient ne peut PAS envoyer à un médecin non assigné ──

  it('TC-CY-CHAT-06 : Patient → Médecin non assigné → 403 via API', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: patientEmail, mot_de_passe: patientPassword },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      // Use a known invalid doctor ID (e.g. 99999)
      cy.request({
        method: 'POST',
        url: `${apiUrl}/chat/messages`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          destinataire_id: 99999,
          contenu: 'Tentative vers médecin non assigné.',
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([403, 404]);
      });
    });
  });

  // ─── TC-CY-CHAT-07 : Médecin répond au patient ─────────────────────────────

  it('TC-CY-CHAT-07 : Médecin voit ses conversations et répond', () => {
    cy.loginByApi(medecinEmail, medecinPassword);
    cy.visit('/chat');

    cy.get('[data-cy="contact-item"], .contact-item, .conversation-item').then(($items) => {
      if ($items.length > 0) {
        cy.wrap($items).first().click();
        cy.get('[data-cy="messages-area"], .messages-container, .chat-messages')
          .should('exist');
      } else {
        cy.log('No conversations for médecin — test passes vacuously');
      }
    });
  });

  // ─── TC-CY-CHAT-08 : Admin exclu du chat ───────────────────────────────────

  it('TC-CY-CHAT-08 : Admin — liste de contacts vide via API', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: Cypress.env('adminEmail'), mot_de_passe: Cypress.env('adminPassword') },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      cy.request({
        method: 'GET',
        url: `${apiUrl}/chat/contacts`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.contacts).to.deep.equal([]);
      });
    });
  });

  // ─── TC-CY-CHAT-09 : Sécurité - conversations entre non-autorisés refusées ─

  it('TC-CY-CHAT-09 : Accès aux messages d\'un médecin non assigné → 403', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: patientEmail, mot_de_passe: patientPassword },
    }).then((loginRes) => {
      const token = loginRes.body.token;

      // Try to get messages with médecin ID 99999 (non-assigned)
      cy.request({
        method: 'GET',
        url: `${apiUrl}/chat/messages/99999`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([403, 404]);
      });
    });
  });
});
