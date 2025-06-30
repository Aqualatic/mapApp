/* -----------------
   Globals & helpers
------------------ */
const map = L.map("map").setView([37.7749, -122.4194], 13);

const markers = new Map();          // leafletId ➜ marker
let polyline = null;                // current route line
let tempLatLng = null;              // clicked lat/lng waiting for form
let userMarker = null;              // “you are here”
const nearRadius = 100;             // metres for proximity alert

/* -----------------
   Base map layer
------------------ */
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

/* -----------------
   Geocoder search
------------------ */
L.Control.geocoder({ defaultMarkGeocode: false })
  .on("markgeocode", ({ geocode }) => {
    addMarker(geocode.center, geocode.name, "default");
    map.setView(geocode.center, 15);
  })
  .addTo(map);

/* -----------------
   Click-to-add flow
------------------ */
map.on("click", (e) => {
  tempLatLng = e.latlng;
  document.getElementById("formContainer").style.display = "flex";
  document.getElementById("locationName").focus();
});

document.getElementById("addMarkerBtn").onclick = () => {
  const name = document.getElementById("locationName").value.trim();
  const list = document
    .getElementById("locationList")
    .value.trim()
    .toLowerCase() || "default";
  if (name && tempLatLng) {
    addMarker(tempLatLng, name, list);
    hideForm();
  }
};

document.getElementById("cancelBtn").onclick = hideForm;

function hideForm() {
  document.getElementById("locationName").value = "";
  document.getElementById("locationList").value = "";
  document.getElementById("formContainer").style.display = "none";
  tempLatLng = null;
}

/* -----------------
   Add / delete marker
------------------ */
function addMarker(latlng, name, listId) {
  const marker = L.marker(latlng, { listId }).addTo(map);
  const id = marker._leaflet_id;

  marker.bindPopup(
    `<b>${name}</b><br><i>${listId}</i><br>
     <button onclick="deleteMarker(${id})">Delete</button>`
  );

  markers.set(id, marker);
  saveMarkers();
  rebuildListUI();
}

function deleteMarker(id) {
  const m = markers.get(id);
  if (!m) return;
  map.removeLayer(m);
  markers.delete(id);
  saveMarkers();
  rebuildListUI();
}

/* -----------------
   LocalStorage persistance
------------------ */
function saveMarkers() {
  const data = [...markers.values()].map((m) => ({
    lat: m.getLatLng().lat,
    lng: m.getLatLng().lng,
    name: m.getPopup().getContent().match(/<b>(.*?)<\/b>/)[1],
    listId: m.options.listId,
  }));
  localStorage.setItem("myMarkers", JSON.stringify(data));
}

function loadMarkers() {
  const raw = localStorage.getItem("myMarkers");
  if (!raw) return;
  JSON.parse(raw).forEach(({ lat, lng, name, listId }) =>
    addMarker([lat, lng], name, listId)
  );
}

/* -----------------
   List-toggle UI
------------------ */
function rebuildListUI() {
  const toggleDiv = document.getElementById("listToggles");
  toggleDiv.innerHTML = "";

  // unique list IDs from markers
  const lists = new Set(
    [...markers.values()].map((m) => m.options.listId).concat("default")
  );

  lists.forEach((listId) => {
    const id = `chk_${listId}`;
    toggleDiv.insertAdjacentHTML(
      "beforeend",
      `<label style="margin-right:6px;">
         <input type="checkbox" id="${id}" checked>
         ${listId}
       </label>`
    );
    document.getElementById(id).onchange = updateVisibility;
  });

  // ensure dropdown has all lists
  const select = document.getElementById("categorySelect");
  select.innerHTML = "";
  lists.forEach((l) =>
    select.insertAdjacentHTML("beforeend", `<option value="${l}">${l}</option>`)
  );
}

function updateVisibility() {
  const active = new Set(
    [...document.querySelectorAll("#listToggles input:checked")].map(
      (cb) => cb.parentElement.textContent.trim()
    )
  );

  markers.forEach((m) => {
    if (active.has(m.options.listId)) {
      m.addTo(map);
    } else {
      m.removeFrom(map);
    }
  });
  drawRoute(); // redraw without hidden pins
}

/* -----------------
   User location + nearby alerts
------------------ */
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    ({ coords }) => {
      const here = [coords.latitude, coords.longitude];

      // create / move dot
      if (!userMarker) {
        userMarker = L.marker(here, {
          icon: L.icon({
            iconUrl:
              "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            className: "you-dot",
          }),
        })
          .addTo(map)
          .bindPopup("You are here");
      } else {
        userMarker.setLatLng(here);
      }

      // proximity checks
      markers.forEach((m) => {
        if (!m._notified && map.distance(here, m.getLatLng()) < nearRadius) {
          alert(`You’re near "${m.getPopup().getContent().match(/<b>(.*?)<\/b>/)[1]}"`);
          m._notified = true;
        }
      });
    },
    console.error,
    { enableHighAccuracy: true }
  );
}

/* -----------------
   Draw route button
------------------ */
document.getElementById("drawRouteBtn").onclick = drawRoute;

function drawRoute() {
  if (polyline) map.removeLayer(polyline);
  if (!userMarker) return;

  const here = userMarker.getLatLng();
  const stops = [...]()
