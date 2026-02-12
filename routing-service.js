// Enhanced Routing Service with Mapbox API and fallbacks
// This module provides distinct routing for different transport modes

class RoutingService {
  constructor() {
    this.config = window.config || config;
    this.currentRoute = null;
    this.routeHistory = [];
  }

  /**
   * Get routing service based on priority and availability
   */
  async getRoutingService(mode) {
    // Try Mapbox first (best quality)
    if (this.config.mapbox.accessToken && this.config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
      try {
        const service = new MapboxRoutingService(this.config.mapbox, mode);
        return service;
      } catch (error) {
        console.warn('Mapbox routing failed:', error);
      }
    }

    // Fallback to OSRM
    if (this.config.fallbackServices.osrm.enabled) {
      try {
        const service = new OSRMRoutingService(this.config.fallbackServices.osrm, mode);
        return service;
      } catch (error) {
        console.warn('OSRM routing failed:', error);
      }
    }

    throw new Error('No routing services available');
  }

  /**
   * Create a route with enhanced validation and styling
   */
  async createRoute(map, start, waypoints, mode = 'driving') {
    try {
      // Remove existing route
      this.clearRoute(map);

      // Get appropriate routing service
      const service = await this.getRoutingService(mode);
      
      // Create route
      const routeData = await service.getRoute(start, waypoints);
      
      // Validate route quality
      const validation = this.validateRoute(routeData, mode);
      
      if (!validation.isValid) {
        console.warn('Route validation failed:', validation.reason);
        // Try alternative service if available
        const alternativeService = await this.getAlternativeService(service, mode);
        if (alternativeService) {
          const alternativeRoute = await alternativeService.getRoute(start, waypoints);
          if (this.validateRoute(alternativeRoute, mode).isValid) {
            routeData = alternativeRoute;
          }
        }
      }

      // Create visual route on map
      this.renderRoute(map, routeData, mode);
      
      // Store route data
      this.currentRoute = {
        mode,
        data: routeData,
        validation,
        waypoints: waypoints.length
      };

      // Update UI
      this.updateRouteUI(map, routeData, mode);
      
      return routeData;

    } catch (error) {
      console.error('Route creation failed:', error);
      this.showRouteError(error.message);
      throw error;
    }
  }

  /**
   * Render route on map with mode-specific styling
   */
  renderRoute(map, routeData, mode) {
    const style = this.config.routeStyles[mode] || this.config.routeStyles.driving;
    
    // Create route polyline
    const routeLine = L.polyline(routeData.coordinates, {
      color: style.color,
      weight: style.weight,
      opacity: style.opacity,
      dashArray: style.dashArray,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Add route markers
    this.addRouteMarkers(map, routeData, mode);

    // Fit map to route
    if (routeData.coordinates.length > 0) {
      const bounds = L.latLngBounds(routeData.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Store reference for cleanup
    this.currentRouteLine = routeLine;
  }

  /**
   * Create directions panel with turn-by-turn instructions
   */
  createDirectionsPanel(routeData, mode) {
    // Remove existing directions panel
    const existingPanel = document.querySelector('.directions-panel');
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.className = 'directions-panel';
    panel.innerHTML = `
      <div class="directions-header">
        <h3>Turn-by-Turn Directions</h3>
        <button class="close-directions">×</button>
      </div>
      <div class="directions-content">
        <div class="directions-summary">
          <div class="summary-item">
            <span class="summary-label">Total Distance:</span>
            <span class="summary-value">${this.formatDistance(routeData.distance)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Estimated Time:</span>
            <span class="summary-value">${this.formatTime(routeData.duration)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Transport Mode:</span>
            <span class="summary-value">${this.getModeDisplayName(mode)}</span>
          </div>
        </div>
        <div class="directions-list">
          ${this.generateDirectionsList(routeData.steps, mode)}
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Add close button event
    panel.querySelector('.close-directions').addEventListener('click', () => {
      panel.remove();
    });

    return panel;
  }

  /**
   * Generate directions list from route steps
   */
  generateDirectionsList(steps, mode) {
    if (!steps || steps.length === 0) {
      return `
        <div class="no-directions">
          <p>Route created successfully! Detailed directions will be available when using Mapbox API.</p>
          <p class="note">Note: For full turn-by-turn directions, please configure your Mapbox API key in config.js</p>
        </div>
      `;
    }

    return steps.map((step, index) => `
      <div class="direction-step">
        <div class="step-number">${index + 1}</div>
        <div class="step-content">
          <div class="step-instruction">${step.instruction}</div>
          <div class="step-details">
            <span class="step-distance">${this.formatDistance(step.distance)}</span>
            <span class="step-time">• ${this.formatTime(step.duration)}</span>
          </div>
      </div>
    `).join('');
  }

  /**
   * Add start, end, and waypoint markers
   */
  addRouteMarkers(map, routeData, mode) {
    const style = this.config.routeStyles[mode];
    
    // Start marker
    const startMarker = L.marker(routeData.coordinates[0], {
      icon: L.divIcon({
        html: `<div style="background: ${style.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'route-marker-start',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(map);

    // End marker
    const endMarker = L.marker(routeData.coordinates[routeData.coordinates.length - 1], {
      icon: L.divIcon({
        html: `<div style="background: ${style.color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'route-marker-end',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(map);

    this.routeMarkers = [startMarker, endMarker];
  }

  /**
   * Validate route quality and distinctiveness
   */
  validateRoute(routeData, mode) {
    const validation = {
      isValid: true,
      reason: '',
      warnings: []
    };

    // Check if route exists
    if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
      validation.isValid = false;
      validation.reason = 'Invalid route data';
      return validation;
    }

    // Check route length
    if (routeData.distance < 10) {
      validation.warnings.push('Route is very short');
    }

    // Check for route similarity (if we have previous route)
    if (this.currentRoute && this.currentRoute.mode !== mode) {
      const similarity = this.calculateRouteSimilarity(routeData, this.currentRoute.data);
      if (similarity > this.config.routeValidation.similarityThreshold) {
        validation.warnings.push('Route appears similar to previous route');
      }
    }

    return validation;
  }

  /**
   * Calculate similarity between two routes
   */
  calculateRouteSimilarity(route1, route2) {
    if (!route1 || !route2) return 0;
    
    // Simple similarity check based on start/end points
    const start1 = route1.coordinates[0];
    const end1 = route1.coordinates[route1.coordinates.length - 1];
    const start2 = route2.coordinates[0];
    const end2 = route2.coordinates[route2.coordinates.length - 1];
    
    const startDist = this.getDistance(start1, start2);
    const endDist = this.getDistance(end1, end2);
    
    // If start and end points are very close, routes are similar
    const threshold = 100; // 100 meters
    return (startDist < threshold && endDist < threshold) ? 0.9 : 0.1;
  }

  /**
   * Get distance between two coordinates
   */
  getDistance(coord1, coord2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(coord2[0] - coord1[0]);
    const dLon = this.toRad(coord2[1] - coord1[1]);
    const lat1 = this.toRad(coord1[0]);
    const lat2 = this.toRad(coord2[0]);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update route information panel
   */
  updateRouteUI(map, routeData, mode) {
    // Remove any existing enhanced route panel and do not recreate it.
    // Keeping the DOM clean: this prevents the floating "Route Information" window.
    const existing = document.querySelector('.enhanced-route-panel');
    if (existing) existing.remove();
    return;
  }

  /**
   * Update route color when theme changes
   */
  updateRouteColor(color) {
    if (this.currentRouteLine) {
      this.currentRouteLine.setStyle({ color: color });
    }
  }

  /**
   * Get display name for transport mode
   */
  getModeDisplayName(mode) {
    const names = {
      'driving': '🚗 Driving',
      'walking': '🚶 Walking',
      'cycling': '🚴 Cycling'
    };
    return names[mode] || mode;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  /**
   * Format time for display
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} min`;
    }
  }

  /**
   * Show route error message
   */
  showRouteError(message) {
    const alert = document.createElement('div');
    alert.className = 'route-error-alert';
    alert.innerHTML = `
      <div class="alert-content">
        <span class="alert-icon">⚠️</span>
        <span class="alert-message">${message}</span>
        <button class="alert-close">×</button>
      </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      alert.remove();
    }, 5000);
    
    // Add close button event
    alert.querySelector('.alert-close').addEventListener('click', () => {
      alert.remove();
    });
  }

  /**
   * Clear current route from map
   */
  clearRoute(map) {
    if (this.currentRouteLine) {
      map.removeLayer(this.currentRouteLine);
      this.currentRouteLine = null;
    }
    
    if (this.routeMarkers) {
      this.routeMarkers.forEach(marker => map.removeLayer(marker));
      this.routeMarkers = [];
    }
    
    this.currentRoute = null;
    
    // Remove route panel
    const panel = document.querySelector('.enhanced-route-panel');
    if (panel) panel.remove();
  }

  /**
   * Get alternative routing service
   */
  async getAlternativeService(currentService, mode) {
    // If current is Mapbox, try OSRM
    if (currentService instanceof MapboxRoutingService) {
      if (this.config.fallbackServices.osrm.enabled) {
        return new OSRMRoutingService(this.config.fallbackServices.osrm, mode);
      }
    }
    
    // If current is OSRM, try Mapbox (if available)
    if (currentService instanceof OSRMRoutingService) {
      if (this.config.mapbox.accessToken && this.config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
        return new MapboxRoutingService(this.config.mapbox, mode);
      }
    }
    
    return null;
  }
}

// Mapbox Routing Service Implementation
class MapboxRoutingService {
  constructor(config, mode) {
    this.config = config;
    this.mode = mode;
  }

  async getRoute(start, waypoints) {
    // For multiple waypoints, create individual routes and combine them
    if (waypoints.length > 1) {
      return await this.getMultiStopRoute(start, waypoints);
    } else {
      // Single waypoint - use regular approach
      const coordinates = this.buildCoordinates(start, waypoints);
      const endpoint = this.getEndpoint();
      return await this.getRegularRoute(coordinates, endpoint);
    }
  }

  async getMultiStopRoute(start, waypoints) {
    // Create individual routes between each consecutive pair of points
    const allCoordinates = [start, ...waypoints];
    const combinedRoute = {
      coordinates: [],
      distance: 0,
      duration: 0,
      steps: []
    };

    for (let i = 0; i < allCoordinates.length - 1; i++) {
      const from = allCoordinates[i];
      const to = allCoordinates[i + 1];
      
      try {
        const route = await this.getDirectRoute(from, to);
        
        // Add coordinates (skip first point to avoid duplicates)
        if (i === 0) {
          combinedRoute.coordinates.push(...route.coordinates);
        } else {
          combinedRoute.coordinates.push(...route.coordinates.slice(1));
        }
        
        combinedRoute.distance += route.distance;
        combinedRoute.duration += route.duration;
        
        // Add steps with adjusted numbering
        const stepOffset = combinedRoute.steps.length;
        route.steps.forEach((step, index) => {
          combinedRoute.steps.push({
            instruction: step.instruction,
            distance: step.distance,
            duration: step.duration
          });
        });
        
      } catch (error) {
        console.warn(`Failed to get route from point ${i} to ${i + 1}:`, error);
        throw new Error(`Route calculation failed between waypoints`);
      }
    }

    return combinedRoute;
  }

  async getDirectRoute(from, to) {
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const endpoint = this.getEndpoint();
    
    return await this.getRegularRoute(coordinates, endpoint);
  }

  async getOptimizedRoute(start, waypoints) {
    // Use Optimization API for multiple waypoints
    const url = `${this.config.optimizationEndpoint}/${this.getProfile()}?access_token=${this.config.accessToken}`;
    
    // Build request body for optimization API
    const requestBody = {
      coordinates: this.buildOptimizationCoordinates(start, waypoints),
      annotations: ['distance', 'duration'],
      steps: true,
      overview: 'full'
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Mapbox Optimization API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.trips || data.trips.length === 0) {
      throw new Error('No optimized route found');
    }
    
    const trip = data.trips[0];
    
    return {
      coordinates: trip.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
      distance: trip.distance,
      duration: trip.duration,
      steps: this.extractOptimizationSteps(trip)
    };
  }

  async getRegularRoute(coordinates, endpoint) {
    const url = `${endpoint}/${coordinates}?access_token=${this.config.accessToken}&geometries=geojson&overview=full&steps=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    return {
      coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
      distance: route.distance,
      duration: route.duration,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration
      }))
    };
  }

  getProfile() {
    switch (this.mode) {
      case 'walking':
        return 'mapbox/walking';
      case 'cycling':
        return 'mapbox/cycling';
      default:
        return 'mapbox/driving';
    }
  }

  buildOptimizationCoordinates(start, waypoints) {
    const coords = [[start.lng, start.lat]];
    waypoints.forEach(wp => coords.push([wp.lng, wp.lat]));
    return coords;
  }

  extractOptimizationSteps(trip) {
    if (!trip.legs || trip.legs.length === 0) return [];
    
    // Combine steps from all legs
    const allSteps = [];
    trip.legs.forEach(leg => {
      if (leg.steps) {
        leg.steps.forEach(step => {
          allSteps.push({
            instruction: step.maneuver.instruction,
            distance: step.distance,
            duration: step.duration
          });
        });
      }
    });
    
    return allSteps;
  }

  buildCoordinates(start, waypoints) {
    // Build coordinates for multi-stop route: start -> waypoint1 -> waypoint2 -> ... -> waypointN
    const coords = [`${start.lng},${start.lat}`];
    waypoints.forEach(wp => coords.push(`${wp.lng},${wp.lat}`));
    return coords.join(';');
  }

  getEndpoint() {
    switch (this.mode) {
      case 'walking':
        return this.config.walkingEndpoint;
      case 'cycling':
        return this.config.cyclingEndpoint;
      default:
        return this.config.drivingEndpoint;
    }
  }
}

// OSRM Routing Service Implementation (Fallback)
class OSRMRoutingService {
  constructor(config, mode) {
    this.config = config;
    this.mode = mode;
  }

  async getRoute(start, waypoints) {
    const profile = this.mode === 'walking' ? 'foot' : 'car';
    const coordinates = this.buildCoordinates(start, waypoints);
    
    const url = `${this.config.baseUrl}/${profile}/${coordinates}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    return {
      coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
      distance: route.distance,
      duration: route.duration,
      steps: []
    };
  }

  buildCoordinates(start, waypoints) {
    const coords = [`${start.lng},${start.lat}`];
    waypoints.forEach(wp => coords.push(`${wp.lng},${wp.lat}`));
    return coords.join(';');
  }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RoutingService, MapboxRoutingService, OSRMRoutingService };
} else {
  window.RoutingService = RoutingService;
  window.MapboxRoutingService = MapboxRoutingService;
  window.OSRMRoutingService = OSRMRoutingService;
}