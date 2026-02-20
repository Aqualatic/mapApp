// Client-side configuration (generated - do not edit)
// Built from environment variables via build-config.js
// Local: copy .env.example → .env, fill in values, run npm run build

const config = {
  mapbox: {
    accessToken: "",
    drivingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/driving',
    walkingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/walking',
    cyclingEndpoint:      'https://api.mapbox.com/directions/v5/mapbox/cycling',
    optimizationEndpoint: 'https://api.mapbox.com/optimized-trips/v1/mapbox'
  },
  supabase: {
    url:     "",
    anonKey: ""
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
}