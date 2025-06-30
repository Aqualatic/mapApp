// Create map and set initial view
const map = L.map('map').setView([37.7749, -122.4194], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Add a marker
L.marker([37.7749, -122.4194])
  .addTo(map)
  .bindPopup('Hello from San Francisco!')
  .openPopup();
