/**
 * Central OpenFreeMap + Leaflet + MapLibre GL configuration.
 * Uses free OpenFreeMap public vector tiles (no API key required, best-effort service)
 * and OpenStreetMap attribution.
 */
export const MAP_CONFIG = {
  openFreeMapStyleUrl:
    import.meta.env.VITE_OPENFREEMAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Tiles &copy; <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>',
  defaultCenter: [19.0607, 72.8275], // Mumbai Atelier default
  defaultZoom: 13,
  osrmBaseUrl: (import.meta.env.VITE_OSRM_URL || '').trim(),
  staleThresholdSeconds: 120,
};
