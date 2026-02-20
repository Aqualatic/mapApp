/**
 * build-config.js
 * Generates config.js from environment variables.
 *
 * Required env vars:
 *   mapbox_access_token   — Mapbox public token (pk.…)
 *   SUPABASE_URL          — e.g. https://xyzabc.supabase.co
 *   SUPABASE_ANON_KEY     — Supabase anon/public key
 *
 * Usage:
 *   Local:  npm run build   (loads .env via dotenv)
 *   Vercel: runs automatically in build step
 */

const fs   = require('fs');
const path = require('path');

// Load .env for local development (optional — not present on Vercel)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {
  // dotenv optional in production
}

const mapboxToken   = process.env.mapbox_access_token || '';
const supabaseUrl   = process.env.SUPABASE_URL        || '';
const supabaseAnon  = process.env.SUPABASE_ANON_KEY   || '';

if (!supabaseUrl)  console.warn('[build-config] SUPABASE_URL is not set');
if (!supabaseAnon) console.warn('[build-config] SUPABASE_ANON_KEY is not set');

const configContent = `// Client-side configuration (generated - do not edit)
// Built from environment variables via build-config.js
// Local: copy .env.example → .env, fill in values, run npm run build

const config = {
  mapbox: {
    accessToken: ${JSON.stringify(mapboxToken)},
    drivingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/driving',
    walkingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/walking',
    cyclingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/cycling',
    optimizationEndpoint: 'https://api.mapbox.com/optimized-trips/v1/mapbox'
  },
  supabase: {
    url:     ${JSON.stringify(supabaseUrl)},
    anonKey: ${JSON.stringify(supabaseAnon)}
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
console.log('[build-config] config.js written with mapbox + supabase credentials');