# Enhanced Location Mapper

An improved implementation of the location mapping application featuring distinct routing logic for multiple transport modes, structured API integration, and enhanced user interface components.

---

## Key Improvements

### Distinct Routing Per Transport Mode

Each transport mode is rendered with a visually distinct line style to ensure clear differentiation on the map canvas:

- **Driving**: Blue solid line (weight 5), optimized for vehicular routing via highways and major roads
- **Walking**: Green dashed line (weight 4), constrained to pedestrian infrastructure and sidewalks
- **Cycling**: Yellow complex dashed pattern (weight 4), prioritising bike lanes and low-traffic corridors

### API Integration

The application uses a tiered routing architecture:

- **Primary**: Mapbox Directions API — high-quality, mode-aware routing with reliable response times
- **Fallback**: OSRM — open-source, freely available, with more limited pedestrian data

### Route Validation

The system performs automatic validation to detect routing similarity across modes. If two computed routes exceed an 85% similarity threshold, the application activates its fallback routing service and provides visual feedback to the user.

### Turn-by-Turn Directions

The directions panel renders step-by-step navigation instructions with per-step distance, duration, and mode-specific guidance, presented in a structured summary panel.

### User Interface

Improvements include a responsive transport mode selector, a real-time route information panel, resolution of previous UI overlap issues, and clear visual distinction between route types.

---

## Mapbox API Key Configuration

### Obtaining an API Key

1. Register for a free account at [https://account.mapbox.com/](https://account.mapbox.com/) (no payment method required)
2. Navigate to the **Tokens** section of the account dashboard
3. Select **Create a token**, assign a descriptive name (e.g., "Location Mapper"), and confirm that Directions API permissions are enabled
4. Copy the generated token, which will begin with the prefix `pk.`

### Local Development

1. Copy `.env.example` to `.env` in the project root
2. Insert your token:
   ```
   MAPBOX_ACCESS_TOKEN=pk.YOUR_ACTUAL_MAPBOX_TOKEN_HERE
   ```
3. Run `npm run build` to generate `config.js` from the environment file, then start the development server with `npm run dev`

### Vercel Deployment

1. In the Vercel project dashboard, navigate to **Settings > Environment Variables**
2. Add the variable `MAPBOX_ACCESS_TOKEN` with your Mapbox token as the value
3. Redeploy the project; the build step will generate `config.js` from this variable automatically

**Important:** Do not commit `.env` or any file containing real API credentials to version control. Use `.env.example` as a template only.

---

## Technical Architecture

### Transport Mode Routing Behaviour

**Driving routes** utilise highways and arterial roads, avoid pedestrian-only infrastructure, and optimise for vehicle accessibility and travel time.

**Walking routes** are restricted to sidewalks, pedestrian paths, and designated walkways, avoiding motorway and vehicle-exclusive segments.

**Cycling routes** prefer dedicated cycling infrastructure and low-traffic roads, balancing safety considerations against routing efficiency.

### Route Validation Logic

1. **Similarity Check**: Compares the start and end coordinates of newly computed routes against existing routes
2. **Fallback Activation**: If similarity exceeds the configured threshold (default: 85%), the system requests a route from an alternative service
3. **Visual Feedback**: The route information panel updates to reflect the active transport mode and data source
4. **Error Handling**: Errors are surfaced as user-facing alerts with automatic dismissal; routing degrades gracefully to available services

### Route Style Configuration

```javascript
routeStyles: {
  driving: {
    color: '#007bff',      // Blue
    weight: 5,
    opacity: 0.8,
    dashArray: 'none'
  },
  walking: {
    color: '#28a745',      // Green
    weight: 4,
    opacity: 0.9,
    dashArray: '5, 5'
  },
  cycling: {
    color: '#ffc107',      // Yellow
    weight: 4,
    opacity: 0.9,
    dashArray: '8, 4, 2, 4'
  }
}
```

## Project Structure

```
mapApp/
├── index.html              # Main HTML entry point
├── app.js                  # Core application logic
├── style.css               # Stylesheet
├── config.js               # Generated from MAPBOX_ACCESS_TOKEN (see .env.example)
├── routing-service.js      # Routing logic and service integration
├── scripts/build-config.js # Build script: generates config.js from environment
├── .env.example            # Template for .env (copy locally; do not commit credentials)
├── vercel.json             # Vercel deployment configuration
└── README.md
```

### Basic Operation

1. Click on the map canvas to place location markers
2. Use the search bar to resolve specific addresses to coordinates
3. Select **Draw Route** to compute a route across all visible markers
4. Use the transport mode controls to switch between driving, walking, and cycling without redrawing markers

### Routing Service Priority

| Priority | Service | Notes |
|----------|---------|-------|
| 1 | Mapbox Directions API | Primary; best pedestrian and cycling data; requires API key |
| 2 | OSRM | Fallback; free and open-source; limited pedestrian differentiation |
| 3 | OpenRouteService | Planned; excellent routing quality; requires separate API key |

---

## Performance Notes

- **Mapbox API**: Low-latency responses with high-quality routing data
- **OSRM Fallback**: Higher latency; limited modal differentiation
- **Route Caching**: Computed routes are cached to minimise redundant API calls
- **Graceful Degradation**: The application remains functional when routing services are partially unavailable

---

**Note:** This enhanced implementation provides substantially improved routing differentiation across transport modes compared to the original single-service implementation relying solely on OSRM.
