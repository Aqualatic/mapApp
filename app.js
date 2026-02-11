// ===== CONSTANTS =====
const DEFAULT_CENTER = [37.7749, -122.4194]; // San Francisco
const DEFAULT_ZOOM = 13;
const NEAR_RADIUS = 100; // meters
const MAX_WAYPOINTS = 10;

// ===== STATE =====
const state = {
  markers: new Map(),
  markerNames: new Map(),
  lists: new Map(),
  userMarker: null,
  showUser: true,
  routingService: null,
  currentRoute: null,
  currentTransportMode: 'driving',
  routePanelExpanded: true
};

// ===== UTILITY FUNCTIONS =====

function formatDistance(meters) {
  const feet = meters * 3.28084;
  const miles = feet / 5280;
  return miles >= 0.1 ? `${miles.toFixed(1)} mi` : `${Math.round(feet)} ft`;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

// ===== MODAL FUNCTIONS =====

function createModal() {
  const modalHTML = `
    <div id="customModal" class="custom-modal">
      <div class="modal-content">
        <h3 id="modalTitle">Enter Information</h3>
        <input type="text" id="modalInput" placeholder="">
        <div class="modal-buttons">
          <button class="btn-secondary" id="modalCancel">Cancel</button>
          <button class="btn-primary" id="modalOk">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function customPrompt(title, placeholder = '', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('customModal');
    const titleEl = document.getElementById('modalTitle');
    const input = document.getElementById('modalInput');
    const okBtn = document.getElementById('modalOk');
    const cancelBtn = document.getElementById('modalCancel');
    
    titleEl.textContent = title;
    input.placeholder = placeholder;
    input.value = defaultValue;
    modal.classList.add('active');
    input.focus();
    input.select();
    
    const cleanup = () => {
      modal.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      input.onkeydown = null;
      modal.onclick = null;
    };
    
    const handleSubmit = () => {
      const value = input.value.trim();
      cleanup();
      resolve(value || null);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };
    
    okBtn.onclick = handleSubmit;
    cancelBtn.onclick = handleCancel;
    
    input.onkeydown = (e) => {
      if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Escape') handleCancel();
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) handleCancel();
    };
  });
}

// ===== MAP INITIALIZATION =====

function initializeMap() {
  const map = L.map("map", {
    minZoom: 3,
    maxZoom: 19,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  // Try to center on user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], DEFAULT_ZOOM);
      },
      (error) => console.warn('Could not get location:', error.message)
    );
  }

  return map;
}

function addMapLayers(map) {
  const baseLayers = {
    "Street Map": L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap contributors", maxZoom: 19 }
    ),
    "Satellite": L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri, Maxar, Earthstar Geographics, USDA FSA", maxZoom: 19 }
    ),
    "Satellite + Labels": L.layerGroup([
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
      ),
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      )
    ]),
    "Topographic": L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenTopoMap contributors", maxZoom: 17 }
    ),
    "Dark Mode": L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      { attribution: "© Stadia Maps © OpenMapTiles © OpenStreetMap contributors", maxZoom: 20 }
    )
  };

  baseLayers["Street Map"].addTo(map);
  L.control.layers(baseLayers, null, { position: 'bottomright' }).addTo(map);
  
  // Position zoom controls in bottom left
  map.zoomControl.setPosition('bottomleft');
}

// ===== MARKER MANAGEMENT =====

function addMarker(map, latlng, name, list = "default") {
  const marker = L.marker(latlng, { listId: list }).addTo(map);
  
  state.markerNames.set(marker._leaflet_id, name);
  marker.bindPopup(createMarkerPopup(marker._leaflet_id, name, list));
  
  state.markers.set(marker._leaflet_id, marker);
  
  if (!state.lists.has(list)) state.lists.set(list, new Set());
  state.lists.get(list).add(marker._leaflet_id);
  
  rebuildListUI();
}

function createMarkerPopup(id, name, list) {
  return `
    <b>${name}</b><br><i>${list}</i><br>
    <button onclick="deleteMarker(${id})">Delete</button><br>
    <button onclick="changeMarkerList(${id})">Change Category</button>
  `;
}

function deleteMarker(id) {
  const marker = state.markers.get(id);
  if (!marker) return;
  
  const list = marker.options.listId;
  
  marker.removeFrom(window.mapInstance);
  state.markers.delete(id);
  state.markerNames.delete(id);
  
  state.lists.get(list)?.delete(id);
  if (state.lists.get(list)?.size === 0) state.lists.delete(list);
  
  rebuildListUI();
}

async function changeMarkerList(id) {
  const marker = state.markers.get(id);
  if (!marker) return;
  
  const oldList = marker.options.listId;
  const newList = await customPrompt('Change Category', 'Enter category name', oldList);
  
  if (!newList || newList === oldList) return;

  state.lists.get(oldList)?.delete(id);
  if (state.lists.get(oldList)?.size === 0) state.lists.delete(oldList);

  if (!state.lists.has(newList)) state.lists.set(newList, new Set());
  state.lists.get(newList).add(id);
  
  marker.options.listId = newList;
  marker.bindPopup(createMarkerPopup(id, state.markerNames.get(id), newList));

  rebuildListUI();
}

// ===== UI STATE MANAGEMENT =====

function updateUIState() {
  // Update category list visibility
  updateCategoriesUI();
  
  // Update route information panel
  updateRouteInfoPanel();
  
  // Update transport mode controls
  updateTransportControls();
  
  // Update bottom controls based on available actions
  updateBottomControls();
}

function updateCategoriesUI() {
  const box = document.getElementById("listToggles");
  
  if (state.lists.size === 0) {
    box.innerHTML = `
      <div class="empty-state">No markers yet. Click on the map to add locations!</div>
    `;
    return;
  }

  box.innerHTML = "";  
  
  state.lists.forEach((set, name) => {
    const item = document.createElement("div");
    item.className = "list-item";
    
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.id = `list-${name}`;
    
    cb.onchange = () => set.forEach(id => {
      const marker = state.markers.get(id);
      if (marker) {
        cb.checked ? marker.addTo(window.mapInstance) : marker.removeFrom(window.mapInstance);
      }
    });
    
    const label = document.createElement("label");
    label.htmlFor = `list-${name}`;
    label.textContent = name;
    
    item.appendChild(cb);
    item.appendChild(label);
    box.appendChild(item);
  });
}

function updateRouteInfoPanel() {
  const routeInfo = document.getElementById("routeInfo");
  const routePanel = document.querySelector(".route-info-panel");
  
  if (!state.currentRoute) {
    routeInfo.innerHTML = `<p style="color: #666; font-size: 14px; margin: 0;">No route created yet</p>`;
    if (routePanel) routePanel.style.display = "block"; // Always show the panel
    return;
  }
  
  if (routePanel) routePanel.style.display = "block";
  
  const routeData = state.currentRoute.routeData;
  const mode = state.currentRoute.mode;
  
  routeInfo.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
      <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; border: 1px solid #e0e0e0;">
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Distance</div>
        <div style="font-size: 16px; font-weight: 700; color: #333;">${formatDistance(routeData.distance)}</div>
      </div>
      <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; border: 1px solid #e0e0e0;">
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Time</div>
        <div style="font-size: 16px; font-weight: 700; color: #333;">${formatTime(routeData.duration)}</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e0e0e0;">
      <span style="width: 12px; height: 12px; border-radius: 50%; background: ${getModeColor(state.currentTransportMode)}; display: inline-block;"></span>
      <span style="font-size: 14px; font-weight: 600; color: #333;">${getModeDisplayName(state.currentTransportMode)}</span>
    </div>
  `;
}

function updateTransportControls() {
  // Update transport mode buttons
  document.querySelectorAll('.transport-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.currentTransportMode);
  });
}

function updateBottomControls() {
  const drawBtn = document.getElementById("drawRouteBtn");
  const clearBtn = document.getElementById("clearRouteBtn");
  const locationBtn = document.getElementById("toggleLocationBtn");
  
  // Enable/disable buttons based on state
  const visibleMarkers = [...state.markers.values()].filter(m => window.mapInstance.hasLayer(m));
  const hasUserLocation = state.userMarker && state.showUser && window.mapInstance.hasLayer(state.userMarker);
  const totalPoints = visibleMarkers.length + (hasUserLocation ? 1 : 0);
  
  // Draw route button
  drawBtn.disabled = totalPoints < 2;
  drawBtn.style.opacity = totalPoints >= 2 ? "1" : "0.5";
  drawBtn.style.cursor = totalPoints >= 2 ? "pointer" : "not-allowed";
  
  // Clear route button
  clearBtn.disabled = !state.currentRoute;
  clearBtn.style.opacity = state.currentRoute ? "1" : "0.5";
  clearBtn.style.cursor = state.currentRoute ? "pointer" : "not-allowed";
  
  // Location button
  locationBtn.style.opacity = state.userMarker ? "1" : "0.5";
  locationBtn.style.cursor = state.userMarker ? "pointer" : "not-allowed";
}

function getModeColor(mode) {
  const colors = {
    'driving': '#007bff',
    'walking': '#28a745',
    'cycling': '#ffc107'
  };
  return colors[mode] || '#6c757d';
}

function getModeDisplayName(mode) {
  const names = {
    'driving': '🚗 Driving',
    'walking': '🚶 Walking', 
    'cycling': '🚴 Cycling'
  };
  return names[mode] || mode;
}

// ===== UI UPDATES =====

function rebuildListUI() {
  updateCategoriesUI();
}

// ===== USER LOCATION TRACKING =====

function setupLocationTracking(map) {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    ({ coords }) => {
      const pos = [coords.latitude, coords.longitude];
      
      if (!state.userMarker) {
        state.userMarker = L.marker(pos).bindPopup("You are here");
        if (state.showUser) state.userMarker.addTo(map);
      } else {
        state.userMarker.setLatLng(pos);
        if (state.showUser && !map.hasLayer(state.userMarker)) {
          state.userMarker.addTo(map);
        }
      }
      
      checkProximityAlerts(map, pos);
    },
    (error) => console.error('Location error:', error),
    { enableHighAccuracy: true }
  );
}

function checkProximityAlerts(map, userPos) {
  state.markers.forEach(marker => {
    if (!marker._notified && map.distance(userPos, marker.getLatLng()) < NEAR_RADIUS) {
      const markerName = state.markerNames.get(marker._leaflet_id);
      alert(`You're near "${markerName}"`);
      marker._notified = true;
    }
  });
}

// ===== ROUTING =====

function orderWaypointsByProximity(map, start, waypoints) {
  const ordered = [];
  const remaining = [...waypoints];
  let current = start;
  
  while (remaining.length) {
    remaining.sort((a, b) => map.distance(current, a) - map.distance(current, b));
    const next = remaining.shift();
    ordered.push(next);
    current = next;
  }
  
  return ordered;
}

// Enhanced routing with new service
async function createEnhancedRoute(map, start, waypoints, mode = "driving") {
  try {
    // Initialize routing service if not already done
    if (!state.routingService) {
      state.routingService = new RoutingService();
    }

    // Convert Leaflet latlng objects to the format expected by our service
    const startCoord = { lat: start.lat, lng: start.lng };
    const waypointCoords = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));

    // Create route using the enhanced service
    const routeData = await state.routingService.createRoute(map, startCoord, waypointCoords, mode);
    
    // Check if route creation failed (returns null on error)
    if (!routeData) {
      console.error('Route creation failed - no route data returned');
      return null;
    }
    
    // Store current route data for potential mode switching
    state.currentRoute = {
      start: startCoord,
      waypoints: waypointCoords,
      mode: mode,
      routeData: routeData
    };

    // Update the transport mode UI
    updateTransportControls();
    
    // Enable clear route button
    document.getElementById("clearRouteBtn").disabled = false;
    
    // Always update directions when route is created, and show them
    const directionsSection = document.querySelector('.directions-section');
    const list = directionsSection?.querySelector('.directions-list-inline');
    const headerText = directionsSection?.querySelector('.directions-header-inline h4');
    
    if (list && headerText) {
      // Update directions content
      list.innerHTML = generateDirectionsList(routeData.steps, mode);
      // Show directions section
      list.style.display = 'flex';
      headerText.textContent = '📍 Hide Turn-by-Turn Directions';
    }
    
    return routeData;

  } catch (error) {
    console.error('Enhanced route creation failed:', error);
    alert('Route creation failed. Please try again.');
    return null;
  }
}

// Show directions panel
function showDirections() {
  if (state.currentRoute && state.currentRoute.routeData) {
    // Display directions in the transport control panel
    displayDirectionsInPanel(state.currentRoute.routeData, state.currentRoute.mode);
    
    // Also show the directions section if it's hidden
    const directionsSection = document.querySelector('.directions-section');
    const list = directionsSection?.querySelector('.directions-list-inline');
    const headerText = directionsSection?.querySelector('.directions-header-inline h4');
    
    if (list && headerText) {
      list.style.display = 'flex';
      headerText.textContent = '📍 Hide Turn-by-Turn Directions';
    }
  } else {
    alert('Please create a route first to view directions.');
  }
}

// Display directions within the transport control panel
function displayDirectionsInPanel(routeData, mode) {
  // Use the existing directions section in the HTML
  const directionsSection = document.querySelector('.directions-section');
  if (!directionsSection) return;

  // Update the existing directions list
  const list = directionsSection.querySelector('.directions-list-inline');
  if (list) {
    list.innerHTML = generateDirectionsList(routeData.steps, mode);
  }
}

// Create combined route info and directions panel (kept for backward compatibility, now unused)
function createCombinedRoutePanel(routeData, mode) {
  // This function is now deprecated - directions are integrated into transport panel
  displayDirectionsInPanel(routeData, mode);
}

// Generate directions list from route steps
function generateDirectionsList(steps, mode) {
  if (!steps || steps.length === 0) {
    return `
      <div class="no-directions">
        <p>Route created successfully! Detailed directions will be available when using Mapbox API.</p>
        <p class="note">Note: For full turn-by-turn directions, please configure your Mapbox API key in config.js</p>
      </div>
    `;
  }

  // Get all visible markers for proximity checking
  const visibleMarkers = [...state.markers.values()].filter(m => window.mapInstance.hasLayer(m));
  
  return steps.map((step, index) => {
    // Check if this step is near any markers
    let markerProximityInfo = '';
    
    if (step.waypoint && visibleMarkers.length > 0) {
      // If this step has a waypoint coordinate, check for nearby markers
      const stepLatLng = L.latLng(step.waypoint.lat, step.waypoint.lng);
      
      visibleMarkers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        const distance = window.mapInstance.distance(stepLatLng, markerLatLng);
        
        // If marker is within 100 meters of this step
        if (distance <= 100) {
          const markerName = state.markerNames.get(marker._leaflet_id);
          const markerList = marker.options.listId;
          
          if (markerProximityInfo) {
            markerProximityInfo += `<br><span class="marker-proximity">📍 Near: ${markerName} (${markerList})</span>`;
          } else {
            markerProximityInfo = `<span class="marker-proximity">📍 Near: ${markerName} (${markerList})</span>`;
          }
        }
      });
    }

    return `
      <div class="direction-step">
        <div class="step-number">${index + 1}</div>
        <div class="step-content">
          <div class="step-instruction">${step.instruction}</div>
          ${markerProximityInfo ? `<div class="step-marker-info">${markerProximityInfo}</div>` : ''}
          <div class="step-details">
            <span class="step-distance">${formatDistance(step.distance)}</span>
            <span class="step-time">• ${formatTime(step.duration)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateEnhancedTransportModeUI(map, currentMode) {
  // Update the current transport mode in state
  state.currentTransportMode = currentMode;
  
  // Create enhanced transport mode controls
  let transportControls = document.querySelector('.enhanced-transport-controls');
  
  if (!transportControls) {
    transportControls = document.createElement('div');
    transportControls.className = 'enhanced-transport-controls';
    transportControls.innerHTML = `
      <div class="transport-header">Transport Mode</div>
      <div class="transport-buttons">
        <button class="transport-btn driving ${currentMode === 'driving' ? 'active' : ''}" data-mode="driving">
          <span class="btn-icon">🚗</span>
          <span class="btn-label">Driving</span>
        </button>
        <button class="transport-btn walking ${currentMode === 'walking' ? 'active' : ''}" data-mode="walking">
          <span class="btn-icon">🚶</span>
          <span class="btn-label">Walking</span>
        </button>
        <button class="transport-btn cycling ${currentMode === 'cycling' ? 'active' : ''}" data-mode="cycling">
          <span class="btn-icon">🚴</span>
          <span class="btn-label">Cycling</span>
        </button>
      </div>
    `;
    
    // Add to the control panel
    const controlPanel = document.querySelector('.control-panel');
    controlPanel.appendChild(transportControls);
    
    // Add event listeners
    transportControls.querySelectorAll('.transport-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newMode = btn.dataset.mode;
        if (newMode !== state.currentTransportMode && state.currentRoute) {
          try {
            // Update button states immediately
            transportControls.querySelectorAll('.transport-btn').forEach(b => {
              b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // Recreate route with new mode
            await createEnhancedRoute(
              map, 
              L.latLng(state.currentRoute.start.lat, state.currentRoute.start.lng),
              state.currentRoute.waypoints.map(wp => L.latLng(wp.lat, wp.lng)),
              newMode
            );
          } catch (error) {
            console.error('Mode switch failed:', error);
            // Restore previous button state on error
            transportControls.querySelectorAll('.transport-btn').forEach(b => {
              b.classList.remove('active');
            });
            const prevBtn = transportControls.querySelector(`.transport-btn[data-mode="${state.currentTransportMode}"]`);
            if (prevBtn) prevBtn.classList.add('active');
          }
        }
      });
    });
  } else {
    // Update existing buttons
    transportControls.querySelectorAll('.transport-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === currentMode);
    });
  }
}

// Enhanced clear route function
function clearEnhancedRoute(map) {
  if (state.routingService) {
    state.routingService.clearRoute(map);
  }
  
  // Remove transport controls
  const transportControls = document.querySelector('.enhanced-transport-controls');
  if (transportControls) {
    transportControls.remove();
  }
  
  // Reset state
  state.currentRoute = null;
  state.currentTransportMode = 'driving';
  document.getElementById("clearRouteBtn").disabled = true;
}

// ===== EVENT HANDLERS =====

function setupEventHandlers(map) {
  // Map click to add marker
  map.on("click", async (e) => {
    const name = await customPrompt('Add Location', 'Enter location name');
    if (!name) return;
    
    const list = await customPrompt('Choose Category', 'Enter category name', 'default');
    addMarker(map, e.latlng, name, list || 'default');
    updateUIState();
  });



  // Transport mode buttons
  document.querySelectorAll('.transport-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      // Remove active class from all buttons
      document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const newMode = btn.dataset.mode;
      state.currentTransportMode = newMode;
      
      if (state.currentRoute) {
        try {
          // Recreate route with new mode
          await createEnhancedRoute(
            map, 
            L.latLng(state.currentRoute.start.lat, state.currentRoute.start.lng),
            state.currentRoute.waypoints.map(wp => L.latLng(wp.lat, wp.lng)),
            newMode
          );
          updateUIState();
        } catch (error) {
          console.error('Mode switch failed:', error);
          // Restore previous button state on error
          state.currentTransportMode = 'driving'; // fallback to driving
          document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
          const prevBtn = document.querySelector('.transport-btn.driving');
          if (prevBtn) prevBtn.classList.add('active');
        }
      } else {
        updateUIState();
      }
    });
  });

  // Toggle location button
  document.getElementById("toggleLocationBtn").onclick = () => {
    if (!state.userMarker) {
      alert("Location not available yet.");
      return;
    }
    
    state.showUser = !state.showUser;
    state.showUser ? state.userMarker.addTo(map) : state.userMarker.removeFrom(map);
    updateUIState();
  };

  // Draw route button
  document.getElementById("drawRouteBtn").onclick = async () => {
    const visible = [...state.markers.values()].filter(m => map.hasLayer(m));
    const hasUserLocation = state.userMarker && state.showUser && map.hasLayer(state.userMarker);
    const totalPoints = visible.length + (hasUserLocation ? 1 : 0);
    
    if (totalPoints < 2) {
      alert("You need at least two points (markers or your location) to draw a route.");
      return;
    }

    let start, waypoints;
    
    if (hasUserLocation) {
      start = state.userMarker.getLatLng();
      waypoints = visible.map(m => m.getLatLng());
    } else {
      start = visible[0].getLatLng();
      waypoints = visible.slice(1).map(m => m.getLatLng());
    }

    const ordered = orderWaypointsByProximity(map, start, waypoints);
    try {
      await createEnhancedRoute(map, start, ordered, 'driving');
      updateUIState();
    } catch (error) {
      console.error('Route creation failed:', error);
      alert('Failed to create route. Please try again.');
    }
  };


  // Clear route button
  document.getElementById("clearRouteBtn").onclick = () => {
    clearEnhancedRoute(map);
    updateUIState();
  };
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  createModal();
  const map = initializeMap();
  window.mapInstance = map; // Store globally for popup callbacks
  
  addMapLayers(map);
  setupLocationTracking(map);
  setupEventHandlers(map);
  
  // Add directions toggle functionality for the new inline directions section
  const directionsHeader = document.querySelector('.directions-header-inline');
  if (directionsHeader) {
    directionsHeader.addEventListener('click', () => {
      const directionsSection = directionsHeader.parentElement;
      const list = directionsSection.querySelector('.directions-list-inline');
      const headerText = directionsHeader.querySelector('h4');
      
      if (list.style.display === 'none' || !list.style.display) {
        list.style.display = 'flex';
        headerText.textContent = '📍 Hide Turn-by-Turn Directions';
        
        // If we have a route, show directions
        if (state.currentRoute) {
          displayDirectionsInPanel(state.currentRoute.routeData, state.currentRoute.mode);
        } else {
          // Show a message if no route exists
          list.innerHTML = `
            <div class="no-directions">
              <p>No route created yet. Create a route first to view directions.</p>
            </div>
          `;
        }
      } else {
        list.style.display = 'none';
        headerText.textContent = '📍 Show Turn-by-Turn Directions';
      }
    });
  }
  
  // Make functions available globally for popup buttons
  window.deleteMarker = deleteMarker;
  window.changeMarkerList = changeMarkerList;
});
