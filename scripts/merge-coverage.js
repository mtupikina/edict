#!/usr/bin/env node
/**
 * Orchestrates out-of-the-box coverage merge (no custom merge logic).
 *
 * 1. Cypress → LCOV:  nyc report --reporter=lcovonly  (reads .nyc_output/out.json)
 * 2. Merge:           lcov-result-merger  (merges unit.lcov + cypress.lcov)
 * 3. HTML:            lcov-viewer  (generates coverage/combined/)
 *
 * Unit LCOV: coverage/edict/unit.lcov (Karma lcovonly reporter)
 * Cypress:   .nyc_output/out.json → coverage/edict/cypress.lcov via nyc
 * Output:    coverage/merged.lcov → coverage/combined/index.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const coverageEdict = path.join(root, 'coverage', 'edict');
const cypressLcov = path.join(coverageEdict, 'cypress.lcov');
const mergedLcov = path.join(root, 'coverage', 'merged.lcov');
const reportDir = path.join(root, 'coverage', 'combined');
const cypressNycOut = path.join(root, '.nyc_output', 'out.json');

const unitLcov = path.join(coverageEdict, 'unit.lcov');
if (!fs.existsSync(unitLcov)) {
  console.error('Unit coverage not found (coverage/edict/unit.lcov). Run "npm run coverage" first.');
  process.exit(1);
}

fs.mkdirSync(coverageEdict, { recursive: true });

// 1. Convert Cypress Istanbul → LCOV (out-of-the-box: nyc)
if (fs.existsSync(cypressNycOut) && fs.statSync(cypressNycOut).size > 0) {
  try {
    execSync(`npx nyc report --reporter=lcovonly > "${cypressLcov}"`, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch {
    // nyc can fail if .nyc_output has no usable data; continue with unit only
  }
}

const hasCypress = fs.existsSync(cypressLcov) && fs.statSync(cypressLcov).size > 0;
console.log('Merging coverage from:', hasCypress ? 'unit, cypress' : 'unit');

// 2. Merge LCOV files (out-of-the-box: lcov-result-merger)
execSync(`npx lcov-result-merger "coverage/edict/*.lcov" "coverage/merged.lcov"`, {
  cwd: root,
  stdio: 'inherit',
});

// 3. HTML report (out-of-the-box: lcov-viewer)
fs.mkdirSync(reportDir, { recursive: true });
execSync(`npx lcov-viewer lcov -o "${reportDir}" "${mergedLcov}"`, {
  cwd: root,
  stdio: 'inherit',
});

if (!hasCypress) {
  console.warn('E2E coverage missing or empty. Combined report uses unit only.');
}
console.log(`\nCombined report: ${reportDir}/index.html`);
