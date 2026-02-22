/**
 * Writes src/environments/environment.prod.ts using API_URL from process.env.
 * Used by "npm run build:prod" so production build gets the correct API URL
 * (e.g. in CI or on Vercel where API_URL is set).
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '/api';
const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
};
`;

const outPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote environment.prod.ts with apiUrl:', apiUrl);
