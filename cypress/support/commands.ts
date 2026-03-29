/// <reference types="cypress" />

/* eslint-disable @typescript-eslint/no-namespace -- Cypress Chainable augmentation requires namespace */
const TOKEN_KEY = 'edict_token';

/** Tutee id aligned with `studentScopeGuard` and `/student/:studentId` E2E routes. */
export const E2E_TUTOR_STUDENT_ID = 'e2e-student-1';

const E2E_STUDENT_REF = {
  _id: E2E_TUTOR_STUDENT_ID,
  firstName: 'E2E',
  lastName: 'Student',
  email: 'e2e-student@test.com',
};

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

/** Tutor with one student — write actions require `/student/:id` or `/student/:id/words`. */
const MOCK_AUTH_ME_TUTOR = {
  userId: 'e2e-tutor-id',
  email: 'tutor@e2e.test',
  firstName: null as string | null,
  lastName: null as string | null,
  roleNames: ['tutor'],
  showTutorMode: true,
  showStudentMode: true,
  defaultMode: 'tutor' as const,
  students: [E2E_STUDENT_REF],
};

export type LoginOptions = { asTutor?: boolean };

/**
 * Simulate being logged in by setting the auth token in localStorage.
 * Stubs GET /auth/me so the app receives a valid session instead of 401.
 * Use `asTutor: true` when tests need `canWriteWords` (quiz submit, word CRUD on tutee routes).
 */
Cypress.Commands.add('login', (options?: LoginOptions) => {
  const body = options?.asTutor ? MOCK_AUTH_ME_TUTOR : MOCK_AUTH_ME;
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body }).as('authMe');
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
      login(options?: LoginOptions): Cypress.Chainable<void>;
      logout(): Cypress.Chainable<void>;
    }
  }
}

export {};
