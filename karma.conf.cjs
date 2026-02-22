// Karma config: coverage for unit tests. LCOV (unit.lcov) is merged with Cypress
// by scripts/merge-coverage.js using lcov-result-merger. When karmaConfig is set,
// the Angular builder passes an empty base config, so we provide the full base.
// See angular.json test options: "karmaConfig": "karma.conf.cjs"
const path = require('path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-jasmine-html-reporter',
      'karma-coverage',
    ].map((p) => require.resolve(p)),
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage', 'edict'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly', file: 'unit.lcov' },
      ],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
  });
};
