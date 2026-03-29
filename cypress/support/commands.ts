/// <reference types="cypress" />

/* eslint-disable @typescript-eslint/no-namespace -- Cypress Chainable augmentation requires namespace */
const TOKEN_KEY = 'edict_token';

/** Matches GET /auth/me (auth session) shape used by SessionContextService. */
const MOCK_AUTH_ME = {
  userId: 'e2e-user-id',
  email: 'e2e@test.com',
  firstName: null as string | null,
  lastName: null as string | null,
  roleNames: ['student'],
  showTutorMode: false,
  showStudentMode: true,
  defaultMode: 'student' as const,
  students: [] as { _id: string; firstName: string; lastName: string; email: string }[],
};

/**
 * Simulate being logged in by setting the auth token in localStorage.
 * Stubs GET /auth/me so the app receives a valid session instead of 401.
 * Use before visiting protected routes; stub other APIs as needed.
 */
Cypress.Commands.add('login', () => {
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: MOCK_AUTH_ME }).as('authMe');
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
