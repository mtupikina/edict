/// <reference types="cypress" />

/* eslint-disable @typescript-eslint/no-namespace -- Cypress Chainable augmentation requires namespace */
const TOKEN_KEY = 'edict_token';

const MOCK_ME = {
  email: 'e2e@test.com',
  firstName: null as string | null,
  lastName: null as string | null,
};

/**
 * Simulate being logged in by setting the auth token in localStorage.
 * Stubs GET /auth/me so the app receives a valid user instead of 401.
 * Use before visiting protected routes; stub other APIs as needed.
 */
Cypress.Commands.add('login', () => {
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: MOCK_ME }).as('authMe');
  cy.window().then((win) => {
    win.localStorage.setItem(TOKEN_KEY, 'e2e-test-token');
  });
});

/**
 * Clear auth token (e.g. to test logged-out state).
 */
Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Cypress.Chainable<void>;
      logout(): Cypress.Chainable<void>;
    }
  }
}

export {};
