import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4201',
    defaultCommandTimeout: 15000,
    // Reduce Electron renderer crashes on macOS (bad_message.cc reason 114)
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 0,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    env: {
      codeCoverage: {
        exclude: ['cypress/**/*.*', '**/*.cy.ts'],
      },
    },
  },
});
