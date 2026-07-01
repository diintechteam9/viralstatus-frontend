import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../config';

const LEGEND = [
  { color: '#22c55e', label: 'Live — last 5 min' },
  { color: '#f97316', label: 'Recently active — up to 48h' },
  { color: '#ef4444', label: 'Inactive — 48h to 10 days' },
  { color: '#000000', label: 'Offline — over 10 days' },
];

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function UserLocationMap({ height = 420 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markers, setMarkers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchMarkers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token =
        localStorage.getItem('clienttoken') ||
        sessionStorage.getItem('clienttoken') ||
        localStorage.getItem('mobileUserToken') ||
        '';
      const res = await fetch(`${API_BASE_URL}/api/mobile/user/locations-map`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load map data');
      setMarkers(data.markers || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkers();
    const interval = setInterval(fetchMarkers, 60000);
    return () => clearInterval(interval);
  }, [fetchMarkers]);

  useEffect(() => {
    if (!mapRef.current || loading) return;

    let cancelled = false;

    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;

        if (!mapInstance.current) {
          mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 18,
          }).addTo(mapInstance.current);
          markersLayer.current = L.layerGroup().addTo(mapInstance.current);
        }

        markersLayer.current.clearLayers();

        markers.forEach((m) => {
          const color = m.activity?.color || '#000';
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const marker = L.marker([m.latitude, m.longitude], { icon });
          marker.bindPopup(
            `<strong>${m.name}</strong><br/>${m.city || ''}<br/><span style="color:${color}">● ${m.activity?.label || ''}</span>`
          );
          markersLayer.current.addLayer(marker);
        });

        if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
          mapInstance.current.fitBounds(bounds.pad(0.15));
        }

        setTimeout(() => mapInstance.current?.invalidateSize(), 200);
      } catch {
        if (!cancelled) setError('Map failed to load');
      }
    })();

    return () => { cancelled = true; };
  }, [markers, loading]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Participant Live Map</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {markers.length} user(s) with GPS
            {lastRefresh && ` · Updated ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMarkers}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-gray-100 bg-white">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{error}</div>
      )}

      <div ref={mapRef} style={{ height, width: '100%' }} className="bg-gray-100" />

      {!loading && markers.length === 0 && !error && (
        <p className="text-center text-xs text-gray-400 py-4">
          No GPS locations yet. Users share location when they open the mobile app.
        </p>
      )}
    </div>
  );
}
