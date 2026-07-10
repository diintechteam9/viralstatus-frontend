import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../../../utils/apiClient';

const THEME_URLS = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const THEME_ATTRIBUTIONS = {
  standard: '&copy; OpenStreetMap contributors',
  light: '&copy; OpenStreetMap &copy; CartoDB',
  dark: '&copy; OpenStreetMap &copy; CartoDB',
};

const GeoJSONMap = ({ campaignId, height = 500 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const tileLayer = useRef(null);
  const geoJsonLayer = useRef(null);
  const markersLayer = useRef(null);

  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Sync theme changes instantly without rebuilding the map
  useEffect(() => {
    if (map.current && tileLayer.current) {
      tileLayer.current.setUrl(THEME_URLS[theme]);
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        if (cancelled || !mapContainer.current) return;

        // Initialize Leaflet map once
        if (!map.current) {
          map.current = L.map(mapContainer.current, {
            zoomControl: false, // Custom position below
          }).setView([20.5937, 78.9629], 5);

          // Add Zoom control at top-left
          L.control.zoom({ position: 'topleft' }).addTo(map.current);

          // Add default tile layer
          tileLayer.current = L.tileLayer(THEME_URLS[theme], {
            attribution: THEME_ATTRIBUTIONS[theme],
            maxZoom: 19,
          }).addTo(map.current);
        }

        if (!campaignId) {
          setLoading(false);
          return;
        }

        // Fetch campaign-specific geojson boundaries and participant locations using central apiClient
        console.log('[GeoJSONMap] Requesting data for campaign:', campaignId);
        const response = await apiClient.get(`/api/auth/user/campaign/${campaignId}/geojson`);
        const data = response.data;

        if (cancelled) return;

        if (!data || !data.success) {
          setError(data?.message || 'Failed to load map data');
          setLoading(false);
          return;
        }

        console.log('[GeoJSONMap] Data received. Participants:', data.participants?.length, 'Pincodes:', data.pincodeCount);

        // Clear previous layers
        if (geoJsonLayer.current) {
          map.current.removeLayer(geoJsonLayer.current);
          geoJsonLayer.current = null;
        }
        if (markersLayer.current) {
          map.current.removeLayer(markersLayer.current);
          markersLayer.current = null;
        }

        const participants = data.participants || [];
        const geojsonData = data.geojson || { type: 'FeatureCollection', features: [] };

        // Save stats
        setStats({
          participantCount: participants.length,
          pincodeCount: data.pincodeCount || 0,
          cities: [...new Set(participants.map(p => p.city).filter(Boolean))].length
        });

        // 1. Draw Pincode Boundaries (Polygons)
        if (geojsonData.features && geojsonData.features.length > 0) {
          geoJsonLayer.current = L.geoJSON(geojsonData, {
            style: () => ({
              color: '#ea580c', // Dark orange borders
              weight: 2,
              opacity: 0.8,
              fillColor: '#f97316', // Orange fill
              fillOpacity: 0.35,
            }),
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const pin = props.pincode;

              // Filter participants in this pincode
              const localUsers = participants.filter(p => String(p.pincode) === String(pin));
              const usersListHtml = localUsers.length > 0 
                ? `<div style="max-height: 80px; overflow-y: auto; margin-top: 5px; font-size: 11px;">
                    ${localUsers.map(u => `• <strong>${u.name}</strong> (${u.city})`).join('<br/>')}
                   </div>`
                : '<div style="color: #888; font-size: 11px; margin-top: 4px;">No precise GPS data for users in this zone.</div>';

              // Bind premium styled popup
              layer.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 180px; color: #1f2937;">
                  <div style="font-weight: bold; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 6px; font-size: 13px; color: #ea580c;">
                    📮 Pincode: ${pin}
                  </div>
                  <div><strong>Area:</strong> ${props.area || 'Unknown'}</div>
                  <div><strong>City:</strong> ${props.city || 'Unknown'}</div>
                  <div><strong>State:</strong> ${props.state || 'Unknown'}</div>
                  <div style="margin-top: 6px; font-weight: 600; color: #4b5563;">👥 Participants (${localUsers.length}):</div>
                  ${usersListHtml}
                </div>
              `);

              // Hover/interaction events
              layer.on({
                mouseover: (e) => {
                  const target = e.target;
                  target.setStyle({
                    fillOpacity: 0.65,
                    weight: 3.5,
                    color: '#c2410c'
                  });
                  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    target.bringToFront();
                  }
                },
                mouseout: (e) => {
                  if (geoJsonLayer.current) {
                    geoJsonLayer.current.resetStyle(e.target);
                  }
                }
              });
            }
          }).addTo(map.current);
        }

        // 2. Draw Precise Participant Locations (Teal Markers)
        const validMarkers = [];
        const markerGroup = L.layerGroup();

        participants.forEach(p => {
          if (p.lat !== null && p.lng !== null) {
            // Circle Marker with halo styling
            const marker = L.circleMarker([p.lat, p.lng], {
              radius: 7,
              fillColor: '#3b82f6', // Premium blue dot
              color: '#ffffff', // White border
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.9,
            });

            marker.bindPopup(`
              <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 160px; color: #1f2937;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px; color: #2563eb; display: flex; align-items: center; gap: 4px;">
                  📍 ${p.name}
                </div>
                <hr style="margin: 6px 0; border: none; border-top: 1px solid #e5e7eb;"/>
                <div><strong>Email:</strong> ${p.email || '-'}</div>
                <div><strong>City:</strong> ${p.city || '-'} (${p.pincode || '-'})</div>
                ${p.address ? `<div style="font-size: 10px; color: #6b7280; margin-top: 4px;"><strong>Address:</strong> ${p.address}</div>` : ''}
              </div>
            `);

            marker.on('mouseover', function () {
              this.setStyle({ fillOpacity: 1, radius: 9, weight: 2 });
            });
            marker.on('mouseout', function () {
              this.setStyle({ fillOpacity: 0.9, radius: 7, weight: 1.5 });
            });

            marker.addTo(markerGroup);
            validMarkers.push(marker);
          }
        });

        if (validMarkers.length > 0) {
          markersLayer.current = markerGroup.addTo(map.current);
        }

        // 3. Smart Autofit Camera Bounds
        let boundsFitted = false;
        if (data.bounds && data.bounds.southwest && data.bounds.northeast) {
          try {
            const sw = data.bounds.southwest;
            const ne = data.bounds.northeast;
            map.current.fitBounds([
              [sw.lat, sw.lng],
              [ne.lat, ne.lng]
            ], { padding: [50, 50], maxZoom: 13 });
            boundsFitted = true;
          } catch (e) {
            console.warn('Failed fitting GeoJSON bounds:', e);
          }
        }

        if (!boundsFitted && validMarkers.length > 0) {
          try {
            map.current.fitBounds(L.featureGroup(validMarkers).getBounds(), { padding: [50, 50], maxZoom: 13 });
            boundsFitted = true;
          } catch (e) {}
        }

        if (!boundsFitted && geoJsonLayer.current) {
          try {
            map.current.fitBounds(geoJsonLayer.current.getBounds(), { padding: [40, 40], maxZoom: 13 });
            boundsFitted = true;
          } catch (e) {}
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load Map:', err);
          setError('Failed to load map: ' + err.message);
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (map.current) {
        // Destroy layers safely
        if (geoJsonLayer.current) {
          map.current.removeLayer(geoJsonLayer.current);
          geoJsonLayer.current = null;
        }
        if (markersLayer.current) {
          map.current.removeLayer(markersLayer.current);
          markersLayer.current = null;
        }
        map.current.remove();
        map.current = null;
      }
    };
  }, [campaignId]);

  return (
    <div style={{ position: 'relative', height: `${height}px`, width: '100%' }} className="rounded-xl overflow-hidden shadow-inner border border-gray-200">
      {/* Map container element */}
      <div
        ref={mapContainer}
        style={{
          height: '100%', width: '100%',
          position: 'absolute', top: 0, left: 0, zIndex: 0,
        }}
      />

      {/* Modern Overlay Control: Theme Switcher & Stats Panel */}
      {!loading && !error && (
        <>
          {/* Top-Right Theme Selector */}
          <div style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 400,
            display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '4px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.06)'
          }}>
            {Object.keys(THEME_URLS).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                  theme === t
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Bottom-Right Stats & Mapped Area Details */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px', zIndex: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 16px', borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            fontSize: '12px', fontFamily: "'Inter', sans-serif",
            backdropFilter: 'blur(6px)', border: '1px solid rgba(0,0,0,0.08)',
            color: '#1f2937', minWidth: '160px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', color: '#111827', fontSize: '13px' }}>
              📊 Campaign Coverage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4b5563' }}>👥 Participants:</span>
                <strong style={{ color: '#111827' }}>{stats?.participantCount || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4b5563' }}>🗺️ Pincodes:</span>
                <strong style={{ color: '#ea580c' }}>{stats?.pincodeCount || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4b5563' }}>🌆 Cities:</span>
                <strong style={{ color: '#2563eb' }}>{stats?.cities || 0}</strong>
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fdba74', border: '1.5px solid #ea580c', borderRadius: '2px' }} />
                <span>Pincode Boundary</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', border: '1.5px solid #ffffff', borderRadius: '50%' }} />
                <span>GPS User Location</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(2px)'
        }}>
          <div style={{ textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
            <div className="animate-spin" style={{
              width: '32px', height: '32px', border: '3px solid #f97316',
              borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto'
            }} />
            <div style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '14px' }}>Loading Coverage Map...</div>
            <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>Processing boundaries & coordinate mappings</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {!loading && error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(254, 242, 242, 0.95)',
        }}>
          <div style={{ textAlign: 'center', padding: '24px', color: '#dc2626', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Map Display Error</div>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>{error}</div>
          </div>
        </div>
      )}

      {/* No Data Overlay */}
      {!loading && !error && stats && stats.participantCount === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb',
          padding: '16px 24px', borderRadius: '12px', textAlign: 'center',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>📍</div>
          <div style={{ fontSize: '13px', fontWeight: 'semibold', color: '#374151' }}>No Mapped Locations Yet</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Participants must specify addresses to build boundaries.</div>
        </div>
      )}
    </div>
  );
};

export default GeoJSONMap;
