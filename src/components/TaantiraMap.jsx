import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl';
import '@maplibre/maplibre-gl-leaflet';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MAP_CONFIG } from '../config/mapConfig';

const createPinIcon = (label, bgClass = 'bg-[#641B32]') =>
  L.divIcon({
    className: 'taantira-map-pin',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md text-[11px] font-bold text-white ${bgClass}">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

function OpenFreeMapVectorLayer({ onError }) {
  const map = useMap();

  useEffect(() => {
    let glLayer = null;
    try {
      if (typeof L.maplibreGL === 'function') {
        glLayer = L.maplibreGL({
          style: MAP_CONFIG.openFreeMapStyleUrl,
          attribution: MAP_CONFIG.attribution,
        }).addTo(map);
      } else {
        onError('MapLibre GL Leaflet plugin unavailable.');
      }
    } catch (err) {
      onError(err?.message || 'Unable to initialize OpenFreeMap vector tiles.');
    }

    return () => {
      if (glLayer && map.hasLayer(glLayer)) {
        map.removeLayer(glLayer);
      }
    };
  }, [map, onError]);

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

/**
 * Free OpenFreeMap + Leaflet + MapLibre GL live tracking map.
 * Never embeds Google/Mapbox keys. Shows clear OpenStreetMap + OpenFreeMap attribution.
 */
export default function TaantiraMap({
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  markers = [],
  routeCoordinates = null,
  heightClass = 'h-80',
}) {
  const [tileNotice, setTileNotice] = useState(null);

  return (
    <div className="space-y-2">
      {tileNotice && (
        <div className="rounded-lg border border-[#C39A52] bg-[#FFF9F2] px-3 py-2 text-xs text-[#3D1023]">
          Vector tile layer note: {tileNotice} (OpenFreeMap public tiles are best-effort; marker coordinates remain live.)
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-xl border border-[#D9A0A9]/60 bg-[#F5E7E8] ${heightClass}`}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl
        >
          <OpenFreeMapVectorLayer onError={setTileNotice} />
          <RecenterMap center={center} />
          {markers.map((m, idx) => (
            <Marker
              key={m.id || idx}
              position={[Number(m.lat), Number(m.lng)]}
              icon={createPinIcon(m.badge || 'T', m.color === '#C39A52' ? 'bg-[#C39A52]' : 'bg-[#641B32]')}
            >
              <Popup>
                <div className="text-xs text-[#3D1023]">
                  <p className="font-semibold">{m.title}</p>
                  {m.subtitle && <p className="mt-0.5 text-[#641B32]">{m.subtitle}</p>}
                  {m.timestamp && <p className="mt-1 text-[11px] opacity-75">Updated: {m.timestamp}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {Array.isArray(routeCoordinates) && routeCoordinates.length > 1 && (
            <Polyline positions={routeCoordinates} pathOptions={{ color: '#641B32', weight: 4 }} />
          )}
        </MapContainer>
      </div>
      <p className="text-[11px] text-[#641B32]/80">
        Map data &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        contributors &bull; Free vector tiles by{' '}
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className="underline">
          OpenFreeMap
        </a>
        {!MAP_CONFIG.osrmBaseUrl && ' • Self-hosted OSRM routing disabled (markers & timestamps only)'}
      </p>
    </div>
  );
}
