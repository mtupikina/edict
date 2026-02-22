/**
 * Wraps @angular/build:application and adds instrumentForCoverage so the e2e
 * dev server serves instrumented code for Cypress code-coverage. This builder
 * is only used for the e2e-coverage build target, so we always instrument.
 */
const { createBuilder } = require('@angular-devkit/architect');
const path = require('path');

async function* wrapApplication(options, context, extensions) {
  options = {
    ...options,
    instrumentForCoverage: (filename) => {
      const normalized = path.normalize(filename);
      return !normalized.includes('node_modules');
    },
  };
  const { buildApplication } = require('@angular/build');
  yield* buildApplication(options, context, extensions);
}

module.exports = createBuilder(wrapApplication);
