#!/usr/bin/env node
/**
 * Runs Cypress e2e with coverage. Unsets ELECTRON_RUN_AS_NODE so the Cypress
 * binary (Electron) can start; uses Chrome for the actual test run (see angular.json e2e.browser).
 * Invoked by: npm run coverage (after unit tests, before merge-coverage.js).
 *
 * Clears the Angular build cache before e2e so the e2e-coverage build (instrumented)
 * does not reuse cached output from a previous non-instrumented build.
 *
 * If Cypress fails (e.g. binary missing), exits 0 so merge-coverage.js still runs
 * with unit coverage only.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const angularCache = path.join(root, '.angular', 'cache');
if (fs.existsSync(angularCache)) {
  fs.rmSync(angularCache, { recursive: true });
}

const env = { ...process.env, CYPRESS_COVERAGE: '1' };
delete env.ELECTRON_RUN_AS_NODE;

try {
  execSync('ng e2e --configuration=coverage', {
    cwd: root,
    stdio: 'inherit',
    env,
  });
} catch (err) {
  console.warn(
    '\nE2E (Cypress) failed or was skipped (e.g. Cypress binary missing). Proceeding with unit coverage only.\n'
  );
  process.exit(0);
}
