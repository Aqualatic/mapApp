/**
 * Generates config.js from environment variables.
 * Run before deploy (Vercel runs this in build) or locally: npm run build
 * Loads .env via dotenv when available (local dev).
 */
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {
  // dotenv optional
}

const token = process.env.mapbox_access_token || '';

const configContent = `// Client-side configuration (generated - do not edit)
// Built from mapbox_access_token env. Local: use .env and run npm run build

const config = {
  mapbox: {
    accessToken: ${JSON.stringify(token)},
    drivingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    walkingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/walking',
    cyclingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/cycling',
    optimizationEndpoint: 'https://api.mapbox.com/optimized-trips/v1/mapbox'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
}
`;

const outPath = path.join(__dirname, '..', 'config.js');
fs.writeFileSync(outPath, configContent, 'utf8');
console.log('config.js written from mapbox_access_token');
