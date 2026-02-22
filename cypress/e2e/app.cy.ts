/**
 * E2E: App shell — login page when not authenticated.
 */
describe('Edict', () => {
  it('displays login page when not authenticated', () => {
    cy.visit('/');
    cy.contains('E-Dictionary').should('be.visible');
    cy.contains('Login with Google').should('be.visible');
  });
});
