// ===== SUPABASE AUTH GUARD =====
// Redirect to sign-in page if user is not authenticated
(async () => {
  const svc = window.supabaseService;
  if (!svc?.isReady) return; // no Supabase config yet — allow access
  const session = await svc.getSession();
  if (!session) window.location.href = 'signin.html';
})();

// ===== CONSTANTS =====
const DEFAULT_CENTER = [37.7749, -122.4194]; // San Francisco
const DEFAULT_ZOOM = 13;
const NEAR_RADIUS = 100; // meters
const MAX_WAYPOINTS = 10;

// ===== DARK MODE ONLY =====
// Theme switching has been removed. Only dark mode is now supported.

function applyDarkTheme() {
  const root = document.documentElement;

  // Apply dark theme by setting data attribute
  root.setAttribute('data-theme', 'dark');

  // Update all UI elements to use dark theme colors
  updateAllUIElements('dark');

  // Update marker colors
  updateMarkerColors('dark');

  // Update route colors if route exists
  if (state.currentRoute) {
    updateRouteColors('dark');
  }

  // Update layer control styling
  updateLayerControlStyling('dark');
}

function updateAllUIElements() {
  // Update all panels and containers
  const panels = document.querySelectorAll('.left-panel, .right-panel, .bottom-controls, .map-controls-bottom-left, .map-controls-bottom-right');
  panels.forEach(panel => {
    if (panel) {
      panel.style.background = '#2d2d2d';
      panel.style.borderColor = '#404040';
      panel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.4)';
    }
  });

  // Update all buttons (but don't override transport button styles - let CSS handle it)
  const buttons = document.querySelectorAll('.gm-button, .btn');
  buttons.forEach(btn => {
    if (btn) {
      btn.style.background = '#2d2d2d';
      btn.style.borderColor = '#404040';
      btn.style.color = '#cccccc';
    }
  });

  // Don't apply inline styles to transport buttons - let CSS classes handle styling
  // The active class will be managed by updateTransportControls()

  // Update headings and labels
  const headings = document.querySelectorAll('h3, h4, .transport-header');
  headings.forEach(heading => {
    if (heading) {
      heading.style.color = '#ffffff';
    }
  });

  // Update text content
  const textElements = document.querySelectorAll('label, .empty-state, .no-directions, .note, .step-instruction, .step-details, .summary-label, .summary-value');
  textElements.forEach(el => {
    if (el) {
      el.style.color = '#ffffff';
    }
  });

  // Update list items
  const listItems = document.querySelectorAll('.list-item');
  listItems.forEach(item => {
    if (item) {
      item.style.background = '#3d3d3d';
      item.style.borderColor = '#505050';
    }
  });

  // Update route info panel
  const routeInfoPanel = document.querySelector('.route-info-panel');
  if (routeInfoPanel) {
    routeInfoPanel.style.background = '#2d2d2d';
    routeInfoPanel.style.borderColor = '#404040';
  }

  // Update directions section
  const directionsSection = document.querySelector('.directions-section');
  if (directionsSection) {
    directionsSection.style.background = '#2d2d2d';
    directionsSection.style.borderColor = '#404040';

    // Also update the directions header
    const directionsHeader = directionsSection.querySelector('.directions-header-inline');
    if (directionsHeader) {
      directionsHeader.style.background = '#3d3d3d';
      directionsHeader.style.borderColor = '#505050';

      const headerText = directionsHeader.querySelector('h4');
      if (headerText) {
        headerText.style.color = '#ffffff';
      }
    }
  }

  // Update direction steps
  const directionSteps = document.querySelectorAll('.direction-step');
  directionSteps.forEach(step => {
    if (step) {
      step.style.background = '#3d3d3d';
      step.style.borderColor = '#505050';

      // Update step number background
      const stepNumber = step.querySelector('.step-number');
      if (stepNumber) {
        stepNumber.style.background = '#0a84ff';
        stepNumber.style.color = '#ffffff';
      }

      // Update step content text
      const stepContent = step.querySelector('.step-content');
      if (stepContent) {
        const stepInstruction = stepContent.querySelector('.step-instruction');
        if (stepInstruction) {
          stepInstruction.style.color = '#ffffff';
        }

        const stepDetails = stepContent.querySelector('.step-details');
        if (stepDetails) {
          stepDetails.style.color = '#cccccc';

          const stepDistance = stepDetails.querySelector('.step-distance');
          if (stepDistance) {
            stepDistance.style.color = '#0a84ff';
          }
        }

        // Update marker proximity styling
        const markerProximity = stepContent.querySelector('.marker-proximity');
        if (markerProximity) {
          markerProximity.style.background = '#1a3d5e';
          markerProximity.style.color = '#9ec6ff';
          markerProximity.style.borderColor = '#2a5d8f';
        }
      }
    }
  });

  // Update summary items
  const summaryItems = document.querySelectorAll('.summary-item');
  summaryItems.forEach(item => {
    if (item) {
      item.style.background = '#3d3d3d';
      item.style.borderColor = '#505050';
    }
  });

  // Update modal styles
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.background = '#2d2d2d';
    modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.6)';
  }

  const modalInput = document.querySelector('.modal-content input');
  if (modalInput) {
    modalInput.style.background = '#3d3d3d';
    modalInput.style.borderColor = '#505050';
    modalInput.style.color = '#ffffff';
  }

  // Update layer control if it exists
  updateLayerControlStyling('dark');

  // Update any other elements that might have inline styles
  const inlineStyledElements = document.querySelectorAll('[style*="background"], [style*="color"], [style*="border"]');
  inlineStyledElements.forEach(el => {
    // Only update elements that are part of our UI, not map elements
    if (!el.closest('.leaflet') && !el.closest('.leaflet-marker-icon')) {
      const currentStyle = el.getAttribute('style');
      if (currentStyle) {
        let newStyle = currentStyle;

        // Update background colors
        if (newStyle.includes('background: #f8f9fa')) {
          newStyle = newStyle.replace('background: #f8f9fa', 'background: #3d3d3d');
        } else if (newStyle.includes('background: #e9ecef')) {
          newStyle = newStyle.replace('background: #e9ecef', 'background: #505050');
        } else if (newStyle.includes('background: #e3f2fd')) {
          newStyle = newStyle.replace('background: #e3f2fd', 'background: #1a3d5e');
        } else if (newStyle.includes('background: #e8f5e9')) {
          newStyle = newStyle.replace('background: #e8f5e9', 'background: #2a5d40');
        } else if (newStyle.includes('background: #fff3e0')) {
          newStyle = newStyle.replace('background: #fff3e0', 'background: #5d4000');
        }

        // Update text colors
        if (newStyle.includes('color: #333')) {
          newStyle = newStyle.replace('color: #333', 'color: #cccccc');
        } else if (newStyle.includes('color: #666')) {
          newStyle = newStyle.replace('color: #666', 'color: #999999');
        } else if (newStyle.includes('color: #888')) {
          newStyle = newStyle.replace('color: #888', 'color: #999999');
        }

        // Update border colors
        if (newStyle.includes('border: 1px solid #e0e0e0')) {
          newStyle = newStyle.replace('border: 1px solid #e0e0e0', 'border: 1px solid #404040');
        } else if (newStyle.includes('border: 1px solid #c6c6c6')) {
          newStyle = newStyle.replace('border: 1px solid #c6c6c6', 'border: 1px solid #505050');
        }

        if (newStyle !== currentStyle) {
          el.setAttribute('style', newStyle);
        }
      }
    }
  });
}

function updateMarkerColors() {
  const markerColor = '#ff453a';
  state.markers.forEach(marker => {
    const el = marker.getElement();
    if (!el) return;
    const pin = el.querySelector('.marker-pin');
    const tail = el.querySelector('.marker-pin-tail');
    if (pin) pin.style.background = markerColor;
    if (tail) tail.style.background = markerColor;
  });
}

function updateRouteColors() {
  if (!state.currentRoute || !state.routingService) return;

  const routeColor = '#0a84ff';
  state.routingService.updateRouteColor(routeColor);
}

function updateLayerControlStyling() {
  const layerControlContainer = document.querySelector('.leaflet-control-layers');
  if (layerControlContainer) {
    layerControlContainer.style.background = 'rgba(45, 45, 45, 0.9)';
    layerControlContainer.style.border = '1px solid #404040';
    layerControlContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';

    // Update layer names styling
    const layerNames = layerControlContainer.querySelectorAll('.leaflet-control-layers-list label');
    layerNames.forEach(label => {
      label.style.color = '#cccccc';
    });
  }
}

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
  routePanelExpanded: true,
  currentTheme: 'dark'
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
  const config = window.config || config;

  // Mapbox styles - requires Mapbox access token
  const mapboxStyles = {
    "Default": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Faded": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Cool": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Dark 2D": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Light 2D": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Satellite": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>', maxZoom: 20 }
    ),
    "Outdoors": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Warm": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    )
  };

  // Fallback styles for when Mapbox is not available
  const fallbackStyles = {
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

  // Use Mapbox styles if access token is available, otherwise use fallbacks
  const baseLayers = config.mapbox.accessToken && config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE'
    ? mapboxStyles
    : fallbackStyles;

  // Add default layer
  const defaultLayer = config.mapbox.accessToken && config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE'
    ? baseLayers["Default"]
    : baseLayers["Street Map"];

  defaultLayer.addTo(map);

  // Zoom control: bottom-right (position set in CSS with safe-area)
  map.zoomControl.setPosition('bottomright');

  // Add custom styling to layer control (position from CSS: bottom-right above zoom)
  setTimeout(() => {
    const layerControlContainer = document.querySelector('.leaflet-control-layers');
    if (layerControlContainer) {
      layerControlContainer.style.zIndex = '1000';
      layerControlContainer.style.background = 'rgba(45, 45, 45, 0.9)';
      layerControlContainer.style.border = '1px solid rgba(255, 255, 255, 0.08)';
      layerControlContainer.style.borderRadius = '8px';
      layerControlContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
      layerControlContainer.style.maxHeight = '300px';
      layerControlContainer.style.overflowY = 'auto';
      layerControlContainer.style.width = '200px';

      const layerNames = layerControlContainer.querySelectorAll('.leaflet-control-layers-list label');
      layerNames.forEach(label => {
        label.style.fontWeight = '500';
        label.style.color = '#cccccc';
        label.style.fontSize = '14px';
      });
    }
  }, 100);
}

// ===== MARKER MANAGEMENT =====

// Shared marker icon: same shape/size for all location-style markers (user + added locations)
const MARKER_ICON_SIZE = 30;
const MARKER_ICON_HEIGHT = 38;

function createMarkerIcon(color, className = 'simple-marker') {
  return L.divIcon({
    html: `
      <div class="marker-pin" style="width:${MARKER_ICON_SIZE}px;height:${MARKER_ICON_SIZE}px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 4px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;position:relative;">
        <div class="marker-pin-dot" style="width:14px;height:14px;background:white;border-radius:50%;"></div>
        <div class="marker-pin-tail" style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:${color};border-radius:3px;"></div>
      </div>
    `,
    className,
    iconSize: [MARKER_ICON_SIZE, MARKER_ICON_HEIGHT],
    iconAnchor: [MARKER_ICON_SIZE / 2, MARKER_ICON_HEIGHT],
    popupAnchor: [0, -MARKER_ICON_HEIGHT]
  });
}

function addMarker(map, latlng, name, list = "default", poiFeature = null) {
  const markerColor = state.currentTheme === 'dark' ? '#ff453a' : '#ff4444';
  const customIcon = createMarkerIcon(markerColor, 'simple-marker');

  // Debug: Log the coordinates being used
  console.log('Creating marker at coordinates:', latlng);

  // Ensure map size is valid before adding marker
  map.invalidateSize();

  const marker = L.marker(latlng, {
    listId: list,
    icon: customIcon,
    riseOnHover: true
  }).addTo(map);

  // Immediately update marker position to ensure correct rendering
  // This fixes the issue where markers don't appear in the right spot initially
  const updateMarkerPosition = () => {
    if (marker._icon) {
      const point = map.latLngToLayerPoint(marker.getLatLng());
      L.DomUtil.setPosition(marker._icon, point);
    }
  };

  // Update position immediately
  updateMarkerPosition();

  // Also update after the next frame to catch any timing issues
  requestAnimationFrame(() => {
    updateMarkerPosition();
    // Invalidate size to trigger a redraw
    map.invalidateSize();
  });

  // Ensure position is correct after any map movement completes
  const positionHandler = () => {
    updateMarkerPosition();
    map.off('moveend', positionHandler);
  };
  map.once('moveend', positionHandler);

  // Check if marker is within map bounds and adjust view if needed
  const mapBounds = map.getBounds();
  const markerLatLng = marker.getLatLng();

  if (!mapBounds.contains(markerLatLng)) {
    // Smoothly pan to include the marker
    map.panTo(markerLatLng, { animate: true, duration: 0.5 });
  }

  // Debug logging for marker creation
  console.log('Marker created successfully:', {
    id: marker._leaflet_id,
    latlng: latlng,
    name: name,
    list: list,
    element: marker.getElement(),
    mapInstance: map
  });

  state.markerNames.set(marker._leaflet_id, name);

  // Store POI feature data on the marker if available
  if (poiFeature) {
    marker._poiFeature = poiFeature;
    // Bind a POI popup that reopens the same info panel
    const lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
    const lng = Array.isArray(latlng) ? latlng[1] : latlng.lng;
    const popupHTML = poiFeature.properties?.feature_type === 'poi'
      ? window.poiService.buildPOIPopupHTML(poiFeature, lat, lng)
      : window.poiService.buildAddressPopupHTML(poiFeature, lat, lng);
    marker.bindPopup(popupHTML, {
      maxWidth: 420,
      minWidth: 280,
      className: 'poi-popup',
      autoPanPadding: [40, 40]
    });
  } else {
    marker.bindPopup(createMarkerPopup(marker._leaflet_id, name, list));
  }

  state.markers.set(marker._leaflet_id, marker);

  if (!state.lists.has(list)) state.lists.set(list, new Set());
  state.lists.get(list).add(marker._leaflet_id);

  rebuildListUI();
  triggerAutoSave();

  // Add subtle animation when marker is created (after positioning is correct)
  requestAnimationFrame(() => {
    setTimeout(() => {
      const element = marker.getElement();
      if (element) {
        // Store original transform for animation
        const originalTransform = element.style.transform;
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
          element.style.transform = originalTransform || '';
        }, 200);
      }
    }, 100);
  });
}

/**
 * Save a POI from the popup as a persistent marker on the map.
 * Called from the 'Save Location' button inside POI popups.
 */
function savePOIAsMarker(lat, lng, name, category, featureDataStr) {
  const map = window.mapInstance;
  if (!map) return;

  // Parse the feature data if it was passed as a string
  let poiFeature = null;
  try {
    if (featureDataStr && typeof featureDataStr === 'string') {
      poiFeature = JSON.parse(featureDataStr);
    } else if (featureDataStr && typeof featureDataStr === 'object') {
      poiFeature = featureDataStr;
    }
  } catch (e) {
    console.warn('[app] Could not parse POI feature data:', e);
  }

  // Close the current popup before adding the marker
  map.closePopup();

  // Trim and default the category
  const safeCategory = (category || '').trim() || 'default';

  // Add the marker with POI data attached
  addMarker(map, [lat, lng], name, safeCategory, poiFeature);
  updateUIState();
}

function createMarkerPopup(id, name, list) {
  const marker = state.markers.get(id);
  const markerLatLng = marker ? marker.getLatLng() : null;
  const lat = markerLatLng ? markerLatLng.lat.toFixed(6) : '';
  const lng = markerLatLng ? markerLatLng.lng.toFixed(6) : '';

  return `
    <div class="marker-popup-container">
      <div class="marker-popup-header">
        <div class="marker-popup-title">${escapeHtml(name)}</div>
        <div class="marker-popup-category">${escapeHtml(list)}</div>
      </div>
      
      ${markerLatLng ? `
      <div class="marker-popup-coords">
        <div class="coord-item">
          <span class="coord-label">Lat:</span>
          <span class="coord-value">${lat}</span>
        </div>
        <div class="coord-item">
          <span class="coord-label">Lng:</span>
          <span class="coord-value">${lng}</span>
        </div>
      </div>
      ` : ''}
      
      <div class="marker-popup-actions">
        <button class="popup-action-btn delete-btn" onclick="deleteMarker(${id})" title="Delete this location">
          <span class="btn-text">Delete</span>
        </button>
        
        <button class="popup-action-btn edit-btn" onclick="changeMarkerList(${id})" title="Change category">
          <span class="btn-text">Edit Category</span>
        </button>
      </div>
      
      <div class="marker-popup-footer">
        <button class="popup-close-btn" onclick="closePopup()">Close</button>
      </div>
    </div>
  `;
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to close popup
function closePopup() {
  if (window.mapInstance) {
    window.mapInstance.closePopup();
  }
}

// Function to add marker to route
function addMarkerToRoute(id) {
  const marker = state.markers.get(id);
  if (!marker) return;

  // Center map on marker and close popup
  window.mapInstance.setView(marker.getLatLng(), window.mapInstance.getZoom());
  window.mapInstance.closePopup();

  // Show confirmation
  const markerName = state.markerNames.get(id);
  alert(`Added "${markerName}" to route planning. Click "Draw Route" to create route with all visible markers.`);
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
  triggerAutoSave();
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
  triggerAutoSave();
}

// ===== UI STATE MANAGEMENT =====

function updateUIState() {
  // Update category list visibility - only show when there are markers
  updateCategoriesUI();

  // Update route information panel - only show when there's an active route
  updateRouteInfoPanel();

  // Update transport mode controls
  updateTransportControls();

  // Update bottom controls based on available actions
  updateBottomControls();

  // IMPORTANT: Preserve theme styling when updating UI elements
  // Only update the content and visibility, not the theme colors
  // The theme colors should be managed by CSS custom properties and data-theme attribute
}

function updateCategoriesUI() {
  const box = document.getElementById("listToggles");

  if (state.lists.size === 0) {
    box.innerHTML = `
      <div class="empty-state">No markers yet. Use the categories panel to manage saved locations.</div>
    `;
    return;
  }

  // Only update the categories list content, don't force it to be visible
  // The visibility should be controlled by user interaction, not automatically
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

  // IMPORTANT: Preserve theme styling when updating categories
  // Only update content, not theme colors - theme should be managed by CSS
}

function updateRouteInfoPanel() {
  const routeInfo = document.getElementById("routeInfo");
  const routePanel = document.querySelector(".route-info-panel");

  if (!state.currentRoute) {
    routeInfo.innerHTML = `<p style="color: var(--text-muted); font-size: 14px; margin: 0;">No route created yet</p>`;
    // Don't force the panel to be visible when there's no route
    // The panel visibility should be controlled by user interaction
    return;
  }

  if (routePanel) routePanel.style.display = "block";

  const routeData = state.currentRoute.routeData;
  const mode = state.currentRoute.mode;

  routeInfo.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
      <div style="background: var(--panel-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--panel-border);">
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Distance</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${formatDistance(routeData.distance)}</div>
      </div>
      <div style="background: var(--panel-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--panel-border);">
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Time</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${formatTime(routeData.duration)}</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--panel-bg); border-radius: 6px; border: 1px solid var(--panel-border);">
      <span style="width: 12px; height: 12px; border-radius: 50%; background: ${getModeColor(state.currentTransportMode)}; display: inline-block;"></span>
      <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${getModeDisplayName(state.currentTransportMode)}</span>
    </div>
  `;

  // IMPORTANT: Preserve theme styling when updating route info
  // Only update content, not theme colors - theme should be managed by CSS
}

function updateTransportControls() {
  // Update transport mode buttons - ensure active state matches current mode
  document.querySelectorAll('.transport-btn').forEach(btn => {
    const isActive = btn.dataset.mode === state.currentTransportMode;
    if (isActive) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // IMPORTANT: Preserve theme styling when updating transport controls
  // Only update button states, not theme colors - theme should be managed by CSS
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
    'driving': 'Driving',
    'walking': 'Walking',
    'cycling': 'Cycling'
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
        const userIcon = createMarkerIcon('#0a84ff', 'simple-marker user-location-marker');
        state.userMarker = L.marker(pos, { icon: userIcon }).bindPopup("You are here");
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
      headerText.textContent = 'Hide Turn-by-Turn Directions';
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
      headerText.textContent = 'Hide Turn-by-Turn Directions';
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
            markerProximityInfo += `<br><span class="marker-proximity">Near: ${markerName} (${markerList})</span>`;
          } else {
            markerProximityInfo = `<span class="marker-proximity">Near: ${markerName} (${markerList})</span>`;
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
          <span class="btn-label">Driving</span>
        </button>
        <button class="transport-btn walking ${currentMode === 'walking' ? 'active' : ''}" data-mode="walking">
          <span class="btn-label">Walking</span>
        </button>
        <button class="transport-btn cycling ${currentMode === 'cycling' ? 'active' : ''}" data-mode="cycling">
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
  // Map click to show POI popup (no marker drop)
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    const cfg = window.config || {};
    const token = cfg.mapbox?.accessToken;

    // Open a loading popup immediately at the click point
    const popup = L.popup({
      maxWidth: 420,
      minWidth: 280,
      className: 'poi-popup',
      autoPanPadding: [40, 40]
    })
      .setLatLng(e.latlng)
      .setContent('<div class="poi-loading"><div class="poi-spinner"></div><span>Loading POI data…</span></div>')
      .openOn(map);

    try {
      const result = await window.poiService.fetchPOINearby(lat, lng, token);
      popup.setContent(result.html);
    } catch (err) {
      console.error('[app] POI fetch error:', err);
      popup.setContent(window.poiService.buildFallbackPopupHTML(lat, lng, 'Failed to load data'));
    }
  });



  // Transport mode buttons
  document.querySelectorAll('.transport-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newMode = btn.dataset.mode;

      // Don't do anything if clicking the already active mode
      if (newMode === state.currentTransportMode) {
        return;
      }

      // Update state first
      state.currentTransportMode = newMode;

      // Update all buttons to reflect the new active state
      document.querySelectorAll('.transport-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.mode === newMode) {
          b.classList.add('active');
        }
      });

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
          const previousMode = state.currentRoute?.mode || 'driving';
          state.currentTransportMode = previousMode;
          document.querySelectorAll('.transport-btn').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.mode === previousMode) {
              b.classList.add('active');
            }
          });
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

// ===== SUPABASE SAVE / LOAD =====
// These run ONLY when the user clicks the buttons in the account panel.
// Nothing calls these automatically.

async function saveMapDataToSupabase() {
  const svc = window.supabaseService;
  if (!svc?.isReady || !svc.userId) throw new Error('Not signed in');

  // Wipe the server copy first so we never get duplicates from old data.
  await svc.deleteAllMarkers();

  // Save every marker that is currently on the map.
  const saves = [];
  state.markers.forEach((marker, id) => {
    const latlng = marker.getLatLng();
    const name = state.markerNames.get(id) || 'Unnamed';
    const list = marker.options.listId || 'default';
    saves.push(svc.saveMarker({ name, lat: latlng.lat, lng: latlng.lng, categoryName: list }));
  });

  await Promise.all(saves);
  console.log('[app] Saved', saves.length, 'markers to Supabase');
}

// Auto-save: called after any marker change. Silently skips if not signed in.
let _autoSaveTimer = null;
function triggerAutoSave() {
  const svc = window.supabaseService;
  if (!svc?.isReady || !svc.userId) return;

  // Debounce: wait 1 second after the last change before saving,
  // so rapid additions don't fire a save on every single click.
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    if (typeof window.setAuthSyncStatus === 'function') window.setAuthSyncStatus('Saving…');
    try {
      await saveMapDataToSupabase();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (typeof window.setAuthSyncStatus === 'function') window.setAuthSyncStatus(`Last saved at ${time}`);
    } catch (err) {
      console.warn('[app] Auto-save failed:', err);
      if (typeof window.setAuthSyncStatus === 'function') window.setAuthSyncStatus('Save failed. Will retry on next change.');
    }
  }, 1000);
}

async function loadMapDataFromSupabase() {
  const svc = window.supabaseService;
  if (!svc?.isReady || !svc.userId) throw new Error('Not signed in');

  const rows = await svc.getMarkers();
  if (!rows || rows.length === 0) {
    console.log('[app] No saved markers found.');
    return;
  }

  // Clear everything currently on the map before loading.
  state.markers.forEach(marker => marker.removeFrom(window.mapInstance));
  state.markers.clear();
  state.markerNames.clear();
  state.lists.clear();

  // Add each saved marker back onto the map.
  rows.forEach(row => {
    const categoryName = row.categories?.name || 'default';
    addMarker(window.mapInstance, [row.lat, row.lng], row.name, categoryName);
  });

  console.log('[app] Loaded', rows.length, 'markers from Supabase');
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  createModal();
  const map = initializeMap();
  window.mapInstance = map; // Store globally for popup callbacks

  addMapLayers(map);
  setupLocationTracking(map);
  setupEventHandlers(map);

  // Apply dark theme on initialization
  applyDarkTheme();

  // Initialize transport mode controls to ensure correct active state
  updateTransportControls();

  // Add directions toggle functionality for the new inline directions section
  const directionsHeader = document.querySelector('.directions-header-inline');
  if (directionsHeader) {
    directionsHeader.addEventListener('click', () => {
      const directionsSection = directionsHeader.parentElement;
      const list = directionsSection.querySelector('.directions-list-inline');
      const headerText = directionsHeader.querySelector('h4');

      if (list.style.display === 'none' || !list.style.display) {
        list.style.display = 'flex';
        headerText.textContent = 'Hide Turn-by-Turn Directions';

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
        headerText.textContent = 'Show Turn-by-Turn Directions';
      }
    });
  }

  // Make functions available globally for popup buttons
  window.deleteMarker = deleteMarker;
  window.changeMarkerList = changeMarkerList;
  window.closePopup = closePopup;
  window.addMarkerToRoute = addMarkerToRoute;
  window.savePOIAsMarker = savePOIAsMarker;

  // Expose save/load functions for the auth-ui buttons
  window.saveMapDataToSupabase = saveMapDataToSupabase;
  window.loadMapDataFromSupabase = loadMapDataFromSupabase;

  // Initialize map styles dropdown
  setupMapTypesDropdown(map);
});





// ===== MAP TYPES DROPDOWN FUNCTIONALITY =====

function setupMapTypesDropdown(map) {
  const toggleBtn = document.getElementById('mapTypesToggle');
  const dropdown = document.getElementById('mapTypesDropdown');
  const currentTypeSpan = document.querySelector('.current-map-type');
  const options = document.querySelectorAll('.map-type-option');

  // Mapbox styles configuration
  const config = window.config || config;
  const mapboxStyles = {
    "Default": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Faded": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Cool": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Dark 2D": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Light 2D": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Satellite": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>', maxZoom: 20 }
    ),
    "Outdoors": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    ),
    "Warm": L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapbox.accessToken}`,
      { attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 20 }
    )
  };

  // Fallback styles for when Mapbox is not available
  const fallbackStyles = {
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

  // Determine which styles to use
  const baseLayers = config.mapbox.accessToken && config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE'
    ? mapboxStyles
    : fallbackStyles;

  // Set default layer
  const defaultLayer = config.mapbox.accessToken && config.mapbox.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE'
    ? baseLayers["Default"]
    : baseLayers["Street Map"];

  // Store current layer reference
  let currentLayer = defaultLayer;
  currentLayer.addTo(map);

  // Toggle dropdown visibility
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');

    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Handle option selection
  options.forEach(option => {
    option.addEventListener('click', () => {
      const styleName = option.dataset.style;

      // Update UI
      options.forEach(opt => {
        opt.classList.remove('active');
        opt.setAttribute('aria-selected', 'false');
      });
      option.classList.add('active');
      option.setAttribute('aria-selected', 'true');

      // Update current type display
      currentTypeSpan.textContent = styleName;

      // Change map layer
      if (baseLayers[styleName]) {
        if (currentLayer) {
          map.removeLayer(currentLayer);
        }
        currentLayer = baseLayers[styleName];
        currentLayer.addTo(map);
      }

      closeDropdown();
    });
  });

  // Keyboard navigation
  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
        // Focus first option
        const firstOption = dropdown.querySelector('.map-type-option');
        if (firstOption) firstOption.focus();
      }
    }
  });

  dropdown.addEventListener('keydown', (e) => {
    const optionsArray = Array.from(options);
    const focusedIndex = optionsArray.findIndex(opt => opt === document.activeElement);

    if (e.key === 'Escape') {
      closeDropdown();
      toggleBtn.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % optionsArray.length;
      optionsArray[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = focusedIndex <= 0 ? optionsArray.length - 1 : focusedIndex - 1;
      optionsArray[prevIndex].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      optionsArray[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      optionsArray[optionsArray.length - 1].focus();
    }
  });

  function openDropdown() {
    dropdown.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.classList.add('open');
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.classList.remove('open');
  }
}