import { E2E_TUTOR_STUDENT_ID } from '../support/commands';

/**
 * E2E: Check words (quiz) — to-verify list, generate quiz, mark answers, submit.
 * Route: / (default) for self/student flow; tutor write paths use `/student/:id` (see Submit tests).
 */
describe('Check words (quiz)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('page and to-verify list', () => {
    it('loads check-words page when authenticated and shows generate quiz section', () => {
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', []).as('getToVerifyList');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.url().should('not.include', '/login');
      cy.contains('h1', 'Check words').should('be.visible');
      cy.contains('Generate quiz').should('be.visible');
      cy.contains('Number of words').should('be.visible');
      cy.contains('button', 'Generate').should('be.visible');
    });

    it('shows empty state when to-verify list is empty', () => {
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', []).as('getToVerifyList');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.contains('No words marked for verification.').should('be.visible');
    });

    it('shows to-verify list when API returns items', () => {
      const list = [
        {
          _id: 'v1',
          word: 'hello',
          translation: 'привіт',
          toVerifyNextTime: true,
          lastVerifiedAt: null,
        },
      ];
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', list).as('getToVerifyList');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.contains('hello').should('be.visible');
      cy.contains('привіт').should('be.visible');
    });
  });

  describe('generate quiz', () => {
    it('generates quiz and shows quiz section with words', () => {
      cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
      const quizWords = [
        { _id: 'q1', word: 'cat', translation: 'кіт', canEToU: false, canUToE: false, toVerifyNextTime: false },
        { _id: 'q2', word: 'dog', translation: 'пес', canEToU: false, canUToE: false, toVerifyNextTime: false },
      ];
      cy.intercept('POST', '**/words/verify/generate*', quizWords).as('generateQuiz');
      cy.login({ asTutor: true });
      cy.visit(`/student/${E2E_TUTOR_STUDENT_ID}`);
      cy.wait('@getToVerifyList');
      cy.get('#quiz-count').should('exist').clear().type('5');
      cy.contains('button', 'Generate').click();
      cy.wait('@generateQuiz');
      cy.contains('Quiz — mark your answers').should('be.visible');
      cy.contains('E→U').should('be.visible');
      cy.contains('U→E').should('be.visible');
      cy.contains('cat').should('be.visible');
      cy.contains('кіт').should('be.visible');
      cy.contains('dog').should('be.visible');
      cy.contains('button', 'Submit').should('be.visible');
    });

    it('sends count in generate request', () => {
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', []).as('getToVerifyList');
      cy.intercept('POST', 'http://localhost:3001/words/verify/generate', []).as('generateQuiz');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.get('#quiz-count').invoke('val', 10).trigger('input');
      cy.contains('button', 'Generate').click();
      cy.get('@generateQuiz').its('request.body').should('deep.equal', { count: 10 });
    });
  });

  describe('quiz submit', () => {
    it('submits quiz and returns to generate section', () => {
      cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
      const quizWords = [
        { _id: 'q1', word: 'test', translation: 'тест', canEToU: true, canUToE: false, toVerifyNextTime: true },
      ];
      cy.intercept('POST', '**/words/verify/generate*', quizWords).as('generateQuiz');
      cy.intercept('POST', '**/words/verify/submit*', { statusCode: 200 }).as('submitQuiz');
      cy.login({ asTutor: true });
      cy.visit(`/student/${E2E_TUTOR_STUDENT_ID}`);
      cy.wait('@getToVerifyList');
      cy.contains('button', 'Generate').click();
      cy.wait('@generateQuiz');
      cy.contains('Quiz — mark your answers').should('be.visible');
      cy.contains('button', 'Submit').click();
      cy.wait('@submitQuiz');
      cy.contains('Generate quiz').should('be.visible');
      cy.contains('button', 'Generate').should('be.visible');
      cy.contains('Quiz — mark your answers').should('not.exist');
    });

    it('sends updates in submit request', () => {
      cy.intercept('GET', '**/words/verify/list*', []).as('getToVerifyList');
      const quizWords = [
        { _id: 'id1', word: 'a', translation: 'а', canEToU: true, canUToE: true, toVerifyNextTime: false },
      ];
      cy.intercept('POST', '**/words/verify/generate*', quizWords).as('generateQuiz');
      cy.intercept('POST', '**/words/verify/submit*', { statusCode: 200 }).as('submitQuiz');
      cy.login({ asTutor: true });
      cy.visit(`/student/${E2E_TUTOR_STUDENT_ID}`);
      cy.wait('@getToVerifyList');
      cy.contains('button', 'Generate').click();
      cy.wait('@generateQuiz');
      cy.contains('button', 'Submit').click();
      cy.get('@submitQuiz')
        .its('request.body')
        .should('deep.equal', {
          updates: [{ wordId: 'id1', canEToU: true, canUToE: true, toVerifyNextTime: false }],
        });
    });
  });

  describe('toggles', () => {
    it('shows Show words and Show translations switches', () => {
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', []).as('getToVerifyList');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.contains('Show words').should('be.visible');
      cy.contains('Show translations').should('be.visible');
    });
  });

  describe('masked words (tap/hover to reveal)', () => {
    it('shows masked word and reveals it on click (mobile-friendly)', () => {
      const list = [
        {
          _id: 'v1',
          word: 'hello',
          translation: 'привіт',
          toVerifyNextTime: true,
          lastVerifiedAt: null,
        },
      ];
      cy.intercept('GET', 'http://localhost:3001/words/verify/list', list).as('getToVerifyList');
      cy.login();
      cy.visit('/');
      cy.wait('@getToVerifyList');
      cy.contains('hello').should('be.visible');
      cy.get('[aria-label="Show words"]').find('[role="switch"]').click();
      cy.contains('•••••').should('be.visible');
      cy.contains('hello').should('not.be.visible');
      cy.contains('[role="button"]', '•••••').first().click();
      cy.contains('hello').should('be.visible');
    });
  });
});
