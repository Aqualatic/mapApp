// Configuration file template for API keys and service settings
// This file serves as a template - copy it to config.js and add your actual API keys
// DO NOT commit config.js to git - it's in .gitignore for security

const config = {
  // Mapbox API Configuration
  mapbox: {
    // Get your free API key from: https://www.mapbox.com/pricing/
    // 1. Go to https://account.mapbox.com/
    // 2. Sign up for a free account
    // 3. Navigate to "Tokens" in your account dashboard
    // 4. Create a new token with "Directions" permissions
    // 5. Copy the token and paste it below
    accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN_HERE', // Replace with your actual token
    
    // Mapbox Directions API endpoints
    drivingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    walkingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/walking',
    cyclingEndpoint: 'https://api.mapbox.com/directions/v5/mapbox/cycling',
    
    // Mapbox Optimization API endpoints for multi-stop routes
    optimizationEndpoint: 'https://api.mapbox.com/optimized-trips/v1/mapbox'
  },
  
  // Fallback routing services (if Mapbox fails)
  fallbackServices: {
    // OSRM (free but limited)
    osrm: {
      enabled: true,
      baseUrl: 'https://router.project-osrm.org/route/v1'
    },
    // OpenRouteService (requires API key)
    openRouteService: {
      enabled: false,
      apiKey: 'YOUR_OPENROUTESERVICE_API_KEY',
      baseUrl: 'https://api.openrouteservice.org/v2/directions'
    }
  },
  
  // Route styling configuration
  routeStyles: {
    driving: {
      color: '#007bff',      // Blue for driving
      weight: 5,
      opacity: 0.8,
      dashArray: 'none'
    },
    walking: {
      color: '#28a745',      // Green for walking
      weight: 4,
      opacity: 0.9,
      dashArray: '5, 5'      // Dashed line for walking
    },
    cycling: {
      color: '#ffc107',      // Yellow for cycling
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 4, 2, 4' // Complex dashed pattern for cycling
    }
  },
  
  // Route validation settings
  routeValidation: {
    minDistanceDifference: 50, // Minimum distance difference (meters) to consider routes different
    minTimeDifference: 60,     // Minimum time difference (seconds) to consider routes different
    similarityThreshold: 0.85  // Routes with >85% similarity are considered too similar
  }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
}