document.addEventListener('DOMContentLoaded', function() {
  
  // Create the map object with restrictions on zoom and panning
  const map = L.map("map", {
    minZoom: 3,  // Prevents zooming out too far
    maxZoom: 19, // Maximum zoom in level
    maxBounds: [
      [-90, -180],  // Southwest corner of allowed area
      [90, 180]     // Northeast corner of allowed area
    ],
    maxBoundsViscosity: 1.0  // Makes bounds solid so user cannot pan outside
  }).setView([37.7749, -122.4194], 5); // Start centered on San Francisco at zoom level 5

  // Add the base map tiles from OpenStreetMap
  const tileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { 
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }
  ).addTo(map);

  // Add search box for finding addresses
  const geocoderCtl = L.Control.geocoder({ defaultMarkGeocode: false })
    .on("markgeocode", ({ geocode }) => {
      // When user searches for an address, add a marker there
      addMarker(geocode.center, geocode.name, "default");
      // Move map view to the searched location
      map.setView(geocode.center, 15);
    })
    .addTo(map);

  // Create storage for all markers and their categories
  const markers = new Map(); // Stores marker objects by their ID
  const lists = new Map();   // Stores which markers belong to which category

  // Function to add a new marker to the map
  function addMarker(latlng, name, list = "default") {
    // Create marker at the given coordinates and add it to map
    const mk = L.marker(latlng, { listId: list }).addTo(map);
    
    // Create popup with marker name, category, and action buttons
    mk.bindPopup(
      `<b>${name}</b><br><i>${list}</i><br>
       <button onclick="deleteMarker(${mk._leaflet_id})">Delete</button><br>
       <button onclick="changeMarkerList(${mk._leaflet_id})">Change List</button>`
    );
    
    // Store the marker in our markers map using its ID
    markers.set(mk._leaflet_id, mk);
    
    // Add marker to its category list
    if (!lists.has(list)) lists.set(list, new Set());
    lists.get(list).add(mk._leaflet_id);
    
    // Update the category panel UI
    rebuildListUI();
  }

  // Function to remove a marker from the map
  function deleteMarker(id) {
    // Find the marker by its ID
    const mk = markers.get(id);
    if (!mk) return;
    
    // Get which category this marker belongs to
    const list = mk.options.listId;
    
    // Remove marker from map display
    mk.removeFrom(map);
    
    // Remove from storage
    markers.delete(id);
    
    // Remove from category list
    lists.get(list)?.delete(id);
    
    // If category is now empty, delete the category
    if (lists.get(list)?.size === 0) lists.delete(list);
    
    // Update the category panel UI
    rebuildListUI();
  }
  // Make function available to popup buttons
  window.deleteMarker = deleteMarker;

  // Function to move a marker to a different category
  function changeMarkerList(id) {
    // Find the marker by its ID
    const mk = markers.get(id);
    if (!mk) return;
    
    // Get current category name
    const oldList = mk.options.listId;
    
    // Ask user for new category name
    const newList = prompt("Enter new list/category:", oldList);
    if (!newList || newList === oldList) return;

    // Remove marker from old category
    lists.get(oldList)?.delete(id);
    if (lists.get(oldList)?.size === 0) lists.delete(oldList);

    // Add marker to new category
    if (!lists.has(newList)) lists.set(newList, new Set());
    lists.get(newList).add(id);
    
    // Update marker's category property
    mk.options.listId = newList;

    // Extract marker name from existing popup
    const currentName = mk.getPopup().getContent().match(/<b>(.*?)<\/b>/)[1]; // // Regex /<b>(.*?)<\/b>/ captures the text between <b> and </b> tags (non-greedy match)
    
    // Recreate popup with new category name
    mk.bindPopup(
      `<b>${currentName}</b><br><i>${newList}</i><br>
       <button onclick="deleteMarker(${mk._leaflet_id})">Delete</button><br>
       <button onclick="changeMarkerList(${mk._leaflet_id})">Change List</button>`
    );

    // Update the category panel UI
    rebuildListUI();
  }
  // Make function available to popup buttons
  window.changeMarkerList = changeMarkerList;

  // Function to rebuild the category panel with current categories
  function rebuildListUI() {
    // Get the category panel element
    const box = document.getElementById("listToggles");
    
    // If no categories exist, show empty state message
    if (lists.size === 0) {
      box.innerHTML = `
        <h3>Categories</h3>
        <div class="empty-state">No markers yet. Click on the map to add locations!</div>
      `;
      return;
    }

    // Clear existing content and add heading
    box.innerHTML = "<h3>Categories</h3>";
    
    // Loop through each category and create a checkbox item
    lists.forEach((set, name) => {
      // Create container for this category
      const item = document.createElement("div");
      item.className = "list-item";
      
      // Create checkbox to show/hide markers in this category
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true; // Start with all categories visible
      cb.id = `list-${name}`;
      
      // When checkbox changes, show or hide all markers in this category
      cb.onchange = () => set.forEach(id => {
        const m = markers.get(id);
        if (m) (cb.checked ? m.addTo(map) : m.removeFrom(map));
      });
      
      // Create label text for the category
      const label = document.createElement("label");
      label.htmlFor = `list-${name}`;
      label.textContent = name;
      
      // Add checkbox and label to container
      item.appendChild(cb);
      item.appendChild(label);
      
      // Add container to panel
      box.appendChild(item);
    });
  }

  // When user clicks on map, prompt to add a new marker
  map.on("click", e => {
    // Ask for location name
    const name = prompt("Enter location name:");
    if (!name) return;
    
    // Ask for category name
    const list = prompt("Enter list/category (default):") || "default";
    
    // Add the marker at clicked location
    addMarker(e.latlng, name, list);
  });

  // Track user's current location
  let userMarker = null; // Will hold the marker showing user location
  let showUser = true;   // Whether to display user location marker
  const NEAR_RADIUS = 100; // Distance in meters to trigger proximity alert

  // Check if browser supports geolocation
  if (navigator.geolocation) {
    // Continuously track user position as they move
    navigator.geolocation.watchPosition(
      ({ coords }) => {
        // Get current position as array of latitude and longitude
        const pos = [coords.latitude, coords.longitude];
        
        // If this is first position update, create the user marker
        if (!userMarker) {
          userMarker = L.marker(pos, { color: "blue" }).bindPopup("You are here");
          if (showUser) userMarker.addTo(map);
        } else {
          // Update existing marker position
          userMarker.setLatLng(pos);
          if (showUser && !map.hasLayer(userMarker)) userMarker.addTo(map);
        }
        
        // Check if user is near any markers
        markers.forEach(m => {
          // Calculate distance from user to this marker
          if (!m._notified && map.distance(pos, m.getLatLng()) < NEAR_RADIUS) {
            // Extract marker name from popup
            const markerName = m.getPopup().getContent().match(/<b>(.*?)<\/b>/)[1];
            // Alert user they are nearby
            alert(`You're near "${markerName}"`);
            // Mark this marker so we don't alert again
            m._notified = true;
          }
        });
      },
      console.error,
      { enableHighAccuracy: true } // Use GPS for better accuracy
    );
  }

  // Button to show or hide user location marker
  document.getElementById("toggleLocationBtn").onclick = () => {
    // Check if location has been obtained yet
    if (!userMarker) {
      alert("Location not available yet.");
      return;
    }
    
    // Toggle visibility state
    showUser = !showUser;
    
    // Show or hide marker based on new state
    showUser ? userMarker.addTo(map) : userMarker.removeFrom(map);
  };

  // Variable to hold the routing control object
  let routingCtl = null;

  // Function to calculate and draw a route through waypoints
  function createRoute(start, wp, mode = "car") {
    // If a route already exists, remove it first
    if (routingCtl) {
      map.removeControl(routingCtl);
      routingCtl = null;
    }

    // Limit to 10 waypoints for performance and reliability
    if (wp.length > 10) {
      alert("Route limited to the 10 closest markers for reliability.");
      wp = wp.slice(0, 10);
    }

    // Create routing control with specified waypoints
    routingCtl = L.Routing.control({
      waypoints: [start, ...wp], // Starting point plus all waypoints
      router: L.Routing.osrmv1({
        profile: mode === "walk" ? "foot" : "car", // Walking or driving route
        serviceUrl: "https://router.project-osrm.org/route/v1",
        timeout: 30 * 1000 // 30 second timeout
      }),
      lineOptions: { styles: [{ color: "blue", weight: 5, opacity: 0.7 }] },
      createMarker: () => null, // Don't create markers at waypoints
      addWaypoints: false, // Don't allow dragging route
      fitSelectedRoutes: true, // Zoom map to show entire route
      showAlternatives: false // Only show best route
    })
      .on("routingerror", e => {
        // Log error and notify user if routing fails
        console.error(e);
        alert("Routing failed or timed out — please try again.");
      })
      .addTo(map);
    
    // Enable the clear route button now that route exists
    document.getElementById("clearRouteBtn").disabled = false;
  }

  // Button to draw route through all visible markers
  document.getElementById("drawRouteBtn").onclick = () => {
    // Get all markers currently visible on map
    const visible = [...markers.values()].filter(m => map.hasLayer(m));
    
    // Need at least 2 markers to create a route
    if (visible.length < 2) {
      alert("You need at least two visible markers to draw a route.");
      return;
    }

    // Ask user for travel mode
    const mode = (prompt("Travel mode: 'car' or 'walk'", "car") || "car").toLowerCase();

    // Determine starting point and waypoints
    let start;
    let waypoints;
    
    // If user location is visible, start route from there
    if (userMarker && showUser && map.hasLayer(userMarker)) {
      start = userMarker.getLatLng();
      waypoints = visible.map(m => m.getLatLng());
    } else {
      // Otherwise start from first marker
      start = visible[0].getLatLng();
      waypoints = visible.slice(1).map(m => m.getLatLng());
    }

    // Order waypoints by proximity to create efficient route
    const ordered = [];
    const tmp = [...waypoints]; // Copy array so we can modify it
    let cur = start; // Current position starts at route beginning
    
    // Repeatedly find closest remaining waypoint
    while (tmp.length) {
      // Sort remaining waypoints by distance from current position
      tmp.sort((a, b) => map.distance(cur, a) - map.distance(cur, b));
      // Take the closest waypoint
      const nxt = tmp.shift();
      // Add it to ordered list
      ordered.push(nxt);
      // Update current position for next iteration
      cur = nxt;
    }

    // Create the route with ordered waypoints
    createRoute(start, ordered, mode === "walk" ? "walk" : "car");
  };

  // Button to clear the drawn route from map
  document.getElementById("clearRouteBtn").onclick = () => {
    // Check if route exists
    if (routingCtl) {
      // Remove routing control from map
      map.removeControl(routingCtl);
      routingCtl = null;
      // Disable the clear button since no route exists now
      document.getElementById("clearRouteBtn").disabled = true;
    }
  };

});  