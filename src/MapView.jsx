import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Bundlers move MapLibre's files around, so tell it where its worker ended up.
maplibregl.setWorkerUrl(workerUrl);

// Our own map: a single PMTiles file of Abuja built from OpenStreetMap data,
// served as a static file with the app. No API key, no third-party map service.
const MAP_FILE_URL = import.meta.env.VITE_MAP_PMTILES_URL || '/abuja.pmtiles';

// Fonts and icons for map labels (free, open-source Protomaps assets).
const ASSETS_URL = 'https://protomaps.github.io/basemaps-assets';

let protocolAdded = false;
function ensurePmtilesProtocol() {
  if (protocolAdded) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  protocolAdded = true;
}

function buildStyle() {
  const fileUrl = new URL(MAP_FILE_URL, window.location.origin).href;
  return {
    version: 8,
    glyphs: `${ASSETS_URL}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${ASSETS_URL}/sprites/v4/light`,
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${fileUrl}`,
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    // Map styling without points of interest, so citizen reports stand out.
    layers: layers('protomaps', namedFlavor('light'), { lang: 'en' }).filter(
      (layer) => layer.id !== 'pois'
    ),
  };
}

function makePin(color, title, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'map-pin';
  el.style.background = color;
  el.title = title || '';
  el.setAttribute('aria-label', title || 'Issue');
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return el;
}

export default function MapView({ center, zoom, issues, getColor, onSelect, onMapClick, pendingLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const pendingMarkerRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onSelectRef.current = onSelect;
  });

  // Create the map once.
  useEffect(() => {
    ensurePmtilesProtocol();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(),
      center: [center.lng, center.lat],
      zoom,
      maxZoom: 18,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (e) => {
      onMapClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; center and zoom are only the starting view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw a pin for every issue.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = issues
      .filter((issue) => Number.isFinite(issue.lat) && Number.isFinite(issue.lng))
      .map((issue) =>
        new maplibregl.Marker({
          element: makePin(getColor(issue.category), issue.title, () => onSelectRef.current?.(issue)),
        })
          .setLngLat([issue.lng, issue.lat])
          .addTo(map)
      );
  }, [issues, getColor]);

  // Show where the new report will go.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pendingMarkerRef.current?.remove();
    pendingMarkerRef.current = null;
    if (pendingLocation) {
      pendingMarkerRef.current = new maplibregl.Marker({ color: '#e63946' })
        .setLngLat([pendingLocation.lng, pendingLocation.lat])
        .addTo(map);
    }
  }, [pendingLocation]);

  return <div ref={containerRef} className="map" />;
}
