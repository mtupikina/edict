/**
 * E2E: Auth — unauthenticated users are redirected to login; protected routes require auth.
 */
describe('Auth', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('redirects to login when visiting /words without token', () => {
    cy.visit('/words');
    cy.url().should('include', '/login');
    cy.contains('Login with Google').should('be.visible');
  });

  it('redirects to /login when visiting / without token', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.contains('Login with Google').should('be.visible');
  });

  it('shows login page at /login with title and login action', () => {
    cy.visit('/login');
    cy.contains('E-Dictionary').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
    cy.get('button').contains('Login with Google').should('be.visible');
  });

  it('shows check-words (default) when logged-in user visits /', () => {
    cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
    cy.login();
    cy.visit('/');
    cy.url().should('not.include', '/login');
    cy.contains('Check words').should('be.visible');
  });

  it('auth callback with token redirects to / and stores token', () => {
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        userId: 'callback-user',
        email: 'cb@test.com',
        firstName: null,
        lastName: null,
        roleNames: ['student'],
        showTutorMode: false,
        showStudentMode: true,
        defaultMode: 'student',
        students: [],
      },
    }).as('authMe');
    cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
    cy.visit('/auth/callback?token=e2e-callback-token');
    cy.url().should('not.include', '/login');
    cy.contains('Check words').should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'edict_token').should('eq', 'e2e-callback-token');
  });

  it('auth callback with error=unauthorized redirects to /login and shows access denied', () => {
    cy.visit('/auth/callback?error=unauthorized');
    cy.url().should('include', '/login');
    cy.contains('Access denied').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
  });

  it('shows access denied when login returns error=unauthorized', () => {
    cy.visit('/login?error=unauthorized');
    cy.contains('Access denied').should('be.visible');
    cy.contains('Only authorized users').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
  });

  it('logout button navigates to /login and shows login page', () => {
    cy.intercept('POST', '**/auth/logout', { statusCode: 200 }).as('logout');
    cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
    cy.login();
    cy.visit('/');
    cy.url().should('not.include', '/login');
    cy.get('button[title="Log out"]').click();
    cy.url().should('include', '/login');
    cy.contains('Login with Google').should('be.visible');
  });
});
