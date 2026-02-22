/**
 * E2E: Words — list, add, edit, delete with stubbed API.
 * Requires authenticated user (cy.login()) and intercepts for words API.
 * Intercepts must target the API host (localhost:3001) only, so the app's /words document request returns HTML.
 */
const API_WORDS = 'http://localhost:3001/words*';
const emptyPage = { items: [], nextCursor: null, hasMore: false };

function stubGetWords(response: { items: object[]; nextCursor: string | null; hasMore: boolean }) {
  return cy.intercept('GET', API_WORDS, response).as('getWords');
}

describe('Words', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('list', () => {
    it('displays words list when authenticated', () => {
      stubGetWords(emptyPage);
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.url().should('include', '/words');
      cy.contains('Words').should('be.visible');
      cy.contains('No words yet. Add one to get started.').should('be.visible');
    });

    it('displays word items when API returns data', () => {
      const items = [
        { _id: '1', word: 'hello', translation: 'hola', partOfSpeech: 'interj' },
        { _id: '2', word: 'world', translation: 'mundo' },
      ];
      stubGetWords({ items, nextCursor: null, hasMore: false });
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.contains('Words').should('be.visible');
      cy.contains('hello').should('be.visible');
      cy.contains('hola').should('be.visible');
      cy.contains('world').should('be.visible');
      cy.contains('mundo').should('be.visible');
    });

    it('shows sort control', () => {
      stubGetWords(emptyPage);
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.get('label[for="words-sort"]').should('be.visible');
      cy.get('#words-sort').should('exist');
    });
  });

  describe('add word', () => {
    it('opens add form and submits new word', () => {
      stubGetWords(emptyPage);
      cy.intercept('POST', 'http://localhost:3001/words', (req) => {
        req.reply({ statusCode: 201, body: { _id: 'new-1', word: 'test', translation: 'prueba' } });
      }).as('postWord');
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.contains('button', 'Add word').click({ force: true });
      cy.contains('label', 'Word').parent().find('input').should('be.visible').type('test');
      cy.contains('label', 'Translation').parent().find('input').type('prueba');
      cy.contains('button', 'Save').click();
      cy.get('@postWord').its('response.statusCode').should('eq', 201);
      cy.contains('button', 'Add word').should('be.visible');
    });

    it('shows validation error when word is empty', () => {
      stubGetWords(emptyPage);
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.contains('button', 'Add word').click({ force: true });
      cy.contains('label', 'Word').parent().find('input').should('be.visible').clear();
      cy.contains('button', 'Save').click();
      cy.contains('Word is required').should('be.visible');
    });
  });

  describe('edit word', () => {
    it('opens edit form and saves changes', () => {
      const items = [{ _id: 'edit-1', word: 'foo', translation: 'bar' }];
      stubGetWords({ items, nextCursor: null, hasMore: false });
      cy.intercept('PATCH', 'http://localhost:3001/words/edit-1', (req) => {
        req.reply({ body: { _id: 'edit-1', word: 'foo updated', translation: 'bar' } });
      }).as('patchWord');
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.contains('foo').should('be.visible');
      cy.get('[data-testid="edit-word-button"], button[title="Edit"]').first().scrollIntoView().click({ force: true });
      cy.contains('label', 'Word').parent().find('input').should('be.visible').clear().type('foo updated');
      cy.contains('button', 'Save').click();
      cy.get('@patchWord').its('response.statusCode').should('eq', 200);
      cy.contains('Edit word').should('not.exist');
    });
  });

  describe('delete word', () => {
    it('confirms and deletes word', () => {
      const items = [{ _id: 'del-1', word: 'remove', translation: 'eliminar' }];
      stubGetWords({ items, nextCursor: null, hasMore: false });
      cy.intercept('DELETE', 'http://localhost:3001/words/del-1', { statusCode: 200, body: { message: 'Deleted' } }).as('deleteWord');
      cy.login();
      cy.visit('/words');
      cy.wait('@getWords');
      cy.contains('remove').should('be.visible');
      cy.get('[data-testid="delete-word-button"], button[title="Delete"]').first().scrollIntoView().click({ force: true });
      cy.contains('Delete?').should('be.visible');
      cy.contains('button', 'Yes').click();
      cy.get('@deleteWord').its('response.statusCode').should('eq', 200);
    });
  });
});
