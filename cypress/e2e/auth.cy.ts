/**
 * E2E: Auth — unauthenticated users are redirected to login; protected routes require auth.
 */
describe('Auth', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('redirects to login when visiting /words without token', () => {
    cy.visit('/words');
    cy.url().should('include', '/');
    cy.contains('Login with Google').should('be.visible');
  });

  it('shows login page at / with title and login action', () => {
    cy.visit('/');
    cy.contains('E-Dictionary').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
    cy.get('button').contains('Login with Google').should('be.visible');
  });

  it('redirects logged-in user from / to /words', () => {
    cy.intercept('GET', '**/words*', { items: [], nextCursor: null, hasMore: false }).as('getWords');
    cy.login();
    cy.visit('/');
    cy.url().should('include', '/words');
    cy.contains('Words').should('be.visible');
  });

  it('auth callback with token redirects to /words and stores token', () => {
    cy.intercept('GET', '**/auth/me', { statusCode: 200 }).as('authMe');
    cy.intercept('GET', '**/words*', { items: [], nextCursor: null, hasMore: false }).as('getWords');
    cy.visit('/auth/callback?token=e2e-callback-token');
    cy.url().should('include', '/words');
    cy.contains('Words').should('be.visible');
    // Wait for words request so callback has run and auth is applied
    cy.wait('@getWords');
    cy.window().its('localStorage').invoke('getItem', 'edict_token').should('eq', 'e2e-callback-token');
  });

  it('auth callback with error=unauthorized redirects to / and shows access denied', () => {
    cy.visit('/auth/callback?error=unauthorized');
    cy.url().should('include', '/');
    cy.contains('Access denied').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
  });

  it('shows access denied when login returns error=unauthorized', () => {
    cy.visit('/?error=unauthorized');
    cy.contains('Access denied').should('be.visible');
    cy.contains('Only authorized users').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
  });
});
