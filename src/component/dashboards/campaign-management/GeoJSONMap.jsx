import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '../../../config';

const GeoJSONMap = ({ campaignId, height = 400 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geoJsonLayer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;

        if (cancelled || !mapContainer.current) return;

        // Init map once
        if (!map.current) {
          map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map.current);
        }

        if (!campaignId) { setLoading(false); return; }

        const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/${campaignId}/citymap`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load map data');
          setLoading(false);
          return;
        }

        setStats({ participantCount: data.participantCount || 0, totalCities: data.totalCities || 0 });

        // Remove old layer
        if (geoJsonLayer.current) {
          map.current.removeLayer(geoJsonLayer.current);
          geoJsonLayer.current = null;
        }

        if (data.cities && data.cities.length > 0) {
          const markers = data.cities.map(c => {
            const radius = Math.min(8 + c.count * 2, 30);
            const marker = L.circleMarker([c.lat, c.lng], {
              radius, fillColor: '#3388ff', color: '#0066cc',
              weight: 2, opacity: 0.8, fillOpacity: 0.5,
            });
            marker.bindPopup(`
              <div style="font-size:12px;font-family:Arial;min-width:130px">
                <strong style="color:#0066cc">🌆 ${c.city}</strong>
                <hr style="margin:5px 0;border:none;border-top:1px solid #ddd"/>
                <strong>Participants:</strong> ${c.count}
              </div>
            `);
            marker.on('mouseover', function () { this.setStyle({ fillOpacity: 0.8, weight: 3 }); });
            marker.on('mouseout', function () { this.setStyle({ fillOpacity: 0.5, weight: 2 }); });
            return marker;
          });

          geoJsonLayer.current = L.layerGroup(markers).addTo(map.current);
          try {
            map.current.fitBounds(L.featureGroup(markers).getBounds(), { padding: [50, 50], maxZoom: 10 });
          } catch (e) {}
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load map: ' + err.message);
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
        geoJsonLayer.current = null;
      }
    };
  }, [campaignId]);

  return (
    <div style={{ position: 'relative', height: `${height}px` }}>
      {/* Map container always rendered so ref is never null */}
      <div
        ref={mapContainer}
        style={{
          height: '100%', width: '100%',
          borderRadius: '8px', border: '1px solid #ddd',
          position: 'absolute', top: 0, left: 0, zIndex: 0,
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(245,245,245,0.85)', borderRadius: '8px',
        }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 'bold' }}>Loading map...</div>
            <div style={{ fontSize: '12px' }}>Fetching participant cities</div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {!loading && error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(255,238,238,0.92)', borderRadius: '8px',
          color: '#c33', textAlign: 'center', padding: '20px', flexDirection: 'column',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ {error}</div>
        </div>
      )}

      {/* No participants overlay */}
      {!loading && !error && stats && stats.participantCount === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.88)',
          padding: '12px 20px', borderRadius: '8px',
          fontSize: '13px', color: '#666', pointerEvents: 'none',
        }}>
          📍 No participants yet
        </div>
      )}

      {/* Stats box */}
      {!loading && !error && stats && stats.participantCount > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px', zIndex: 400,
          backgroundColor: 'rgba(255,255,255,0.92)',
          padding: '10px 15px', borderRadius: '6px',
          fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          <div><strong>👥 Participants:</strong> {stats.participantCount}</div>
          <div><strong>🌆 Cities:</strong> {stats.totalCities}</div>
        </div>
      )}
    </div>
  );
};

export default GeoJSONMap;
