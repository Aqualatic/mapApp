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
  routingCtl: null,
  currentTransportMode: 'car',
  currentRouteData: null,
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
  L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);
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

// ===== UI UPDATES =====

function rebuildListUI() {
  const box = document.getElementById("listToggles");
  
  if (state.lists.size === 0) {
    box.innerHTML = `
      <h3>Categories</h3>
      <div class="empty-state">No markers yet. Click on the map to add locations!</div>
    `;
    return;
  }

  box.innerHTML = "<h3>Categories</h3>";
  
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

function createRoute(map, start, waypoints, mode = "car") {
  if (state.routingCtl) {
    map.removeControl(state.routingCtl);
    state.routingCtl = null;
  }

  state.currentTransportMode = mode;
  state.currentRouteData = { start, waypoints };

  if (waypoints.length > MAX_WAYPOINTS) {
    alert(`Route limited to ${MAX_WAYPOINTS} closest markers for reliability.`);
    waypoints = waypoints.slice(0, MAX_WAYPOINTS);
  }

  state.routingCtl = L.Routing.control({
    waypoints: [start, ...waypoints],
    router: L.Routing.osrmv1({
      profile: mode === "walk" ? "foot" : "car",
      serviceUrl: "https://router.project-osrm.org/route/v1",
      timeout: 30000
    }),
    lineOptions: { styles: [{ color: "#007bff", weight: 5, opacity: 0.7 }] },
    createMarker: () => null,
    addWaypoints: false,
    fitSelectedRoutes: true,
    showAlternatives: false,
    formatter: new L.Routing.Formatter({ units: 'imperial' }),
    containerClassName: 'leaflet-routing-container-custom'
  })
    .on("routingerror", (e) => {
      console.error(e);
      alert("Routing failed or timed out — please try again.");
    })
    .on("routesfound", () => {
      updateTransportModeUI();
      setupRoutePanelToggle();
    })
    .addTo(map);
  
  document.getElementById("clearRouteBtn").disabled = false;
}

function setupRoutePanelToggle() {
  const container = document.querySelector('.leaflet-routing-container-custom');
  if (!container) return;

  let toggleBtn = container.querySelector('.route-panel-toggle');
  
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'route-panel-toggle';
    toggleBtn.innerHTML = '▶';
    toggleBtn.title = 'Collapse panel';
    
    toggleBtn.onclick = () => {
      state.routePanelExpanded = !state.routePanelExpanded;
      container.classList.toggle('collapsed', !state.routePanelExpanded);
      toggleBtn.innerHTML = state.routePanelExpanded ? '▶' : '◀';
      toggleBtn.title = state.routePanelExpanded ? 'Collapse panel' : 'Expand panel';
    };
    
    container.appendChild(toggleBtn);
  }
}

function updateTransportModeUI() {
  const container = document.querySelector('.leaflet-routing-container-custom');
  if (!container) return;

  let modeToggle = container.querySelector('.transport-mode-toggle');
  
  if (!modeToggle) {
    modeToggle = document.createElement('div');
    modeToggle.className = 'transport-mode-toggle';
    modeToggle.innerHTML = `
      <button class="mode-btn ${state.currentTransportMode === 'car' ? 'active' : ''}" data-mode="car">Driving</button>
      <button class="mode-btn ${state.currentTransportMode === 'walk' ? 'active' : ''}" data-mode="walk">Walking</button>
    `;
    
    container.insertBefore(modeToggle, container.firstChild);
    
    modeToggle.querySelectorAll('.mode-btn').forEach(btn => {
      btn.onclick = () => {
        const newMode = btn.dataset.mode;
        if (newMode !== state.currentTransportMode && state.currentRouteData) {
          createRoute(window.mapInstance, state.currentRouteData.start, state.currentRouteData.waypoints, newMode);
        }
      };
    });
  } else {
    modeToggle.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === state.currentTransportMode);
    });
  }
}

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

// ===== EVENT HANDLERS =====

function setupEventHandlers(map) {
  // Map click to add marker
  map.on("click", async (e) => {
    const name = await customPrompt('Add Location', 'Enter location name');
    if (!name) return;
    
    const list = await customPrompt('Choose Category', 'Enter category name', 'default');
    addMarker(map, e.latlng, name, list || 'default');
  });

  // Geocoder search
  L.Control.geocoder({ defaultMarkGeocode: false })
    .on("markgeocode", async ({ geocode }) => {
      const name = await customPrompt('Add Location', 'Enter location name', geocode.name);
      if (!name) {
        map.setView(geocode.center, 15);
        return;
      }
      
      const list = await customPrompt('Choose Category', 'Enter category name', 'default');
      addMarker(map, geocode.center, name, list || 'default');
      map.setView(geocode.center, 15);
    })
    .addTo(map);

  // Toggle location button
  document.getElementById("toggleLocationBtn").onclick = () => {
    if (!state.userMarker) {
      alert("Location not available yet.");
      return;
    }
    
    state.showUser = !state.showUser;
    state.showUser ? state.userMarker.addTo(map) : state.userMarker.removeFrom(map);
  };

  // Draw route button
  document.getElementById("drawRouteBtn").onclick = () => {
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
    createRoute(map, start, ordered, 'car');
  };

  // Clear route button
  document.getElementById("clearRouteBtn").onclick = () => {
    if (state.routingCtl) {
      map.removeControl(state.routingCtl);
      state.routingCtl = null;
      state.currentRouteData = null;
      document.getElementById("clearRouteBtn").disabled = true;
    }
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
  
  // Make functions available globally for popup buttons
  window.deleteMarker = deleteMarker;
  window.changeMarkerList = changeMarkerList;
});