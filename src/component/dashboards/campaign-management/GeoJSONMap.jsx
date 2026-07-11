import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../../../utils/apiClient';

const GOOGLE_LIGHT_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  }
];

const GOOGLE_DARK_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const THEME_STYLES = {
  standard: [],
  light: GOOGLE_LIGHT_STYLE,
  dark: GOOGLE_DARK_STYLE
};

// Helper function to dynamically load the Google Maps API script
const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    existingScript.addEventListener('load', () => callback());
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API Key is missing in environment variables.');
    return;
  }

  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
  script.async = true;
  script.defer = true;
  script.addEventListener('load', () => {
    callback();
  });
  document.head.appendChild(script);
};

const GeoJSONMap = ({ campaignId, height = 500 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Sync theme changes instantly
  useEffect(() => {
    if (map.current) {
      map.current.setOptions({ styles: THEME_STYLES[theme] });
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const clearMarkers = () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };

    const clearGeoJson = () => {
      if (map.current) {
        map.current.data.forEach((feature) => {
          map.current.data.remove(feature);
        });
      }
    };

    const initMap = async () => {
      try {
        if (cancelled || !mapContainer.current) return;

        // Fetch campaign map data
        if (!campaignId) {
          setLoading(false);
          return;
        }

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

        const participants = data.participants || [];
        const geojsonData = data.geojson || { type: 'FeatureCollection', features: [] };

        // Save stats
        setStats({
          participantCount: participants.length,
          pincodeCount: data.pincodeCount || 0,
          cities: [...new Set(participants.map(p => p.city).filter(Boolean))].length
        });

        // Initialize Google Map if not done already
        loadGoogleMapsScript(() => {
          if (cancelled || !mapContainer.current) return;

          if (!map.current) {
            map.current = new window.google.maps.Map(mapContainer.current, {
              center: { lat: 20.5937, lng: 78.9629 },
              zoom: 5,
              zoomControl: true,
              zoomControlOptions: {
                position: window.google.maps.ControlPosition.LEFT_TOP
              },
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: THEME_STYLES[theme]
            });
          }

          // Clear previous layers & markers
          clearMarkers();
          clearGeoJson();

          const infoWindow = new window.google.maps.InfoWindow();

          // 1. Draw Pincode Boundaries (Polygons)
          if (geojsonData.features && geojsonData.features.length > 0) {
            map.current.data.addGeoJson(geojsonData);

            map.current.data.setStyle(() => ({
              strokeColor: '#ea580c', // Dark orange borders
              strokeWeight: 2,
              strokeOpacity: 0.8,
              fillColor: '#f97316', // Orange fill
              fillOpacity: 0.35,
            }));

            // Click interaction inside Pincode polygons
            map.current.data.addListener('click', (event) => {
              const feature = event.feature;
              const pin = feature.getProperty('pincode');
              const area = feature.getProperty('area') || 'Unknown';
              const city = feature.getProperty('city') || 'Unknown';
              const state = feature.getProperty('state') || 'Unknown';

              const localUsers = participants.filter(p => String(p.pincode) === String(pin));
              const usersListHtml = localUsers.length > 0 
                ? `<div style="max-height: 80px; overflow-y: auto; margin-top: 5px; font-size: 11px;">
                    ${localUsers.map(u => `• <strong>${u.name}</strong> (${u.city})`).join('<br/>')}
                   </div>`
                : '<div style="color: #888; font-size: 11px; margin-top: 4px;">No precise GPS data for users in this zone.</div>';

              const contentString = `
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 180px; color: #1f2937; line-height: 1.4;">
                  <div style="font-weight: bold; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 6px; font-size: 13px; color: #ea580c;">
                    📮 Pincode: ${pin}
                  </div>
                  <div><strong>Area:</strong> ${area}</div>
                  <div><strong>City:</strong> ${city}</div>
                  <div><strong>State:</strong> ${state}</div>
                  <div style="margin-top: 6px; font-weight: 600; color: #4b5563;">👥 Participants (${localUsers.length}):</div>
                  ${usersListHtml}
                </div>
              `;

              infoWindow.setContent(contentString);
              infoWindow.setPosition(event.latLng);
              infoWindow.open(map.current);
            });

            // Hover interactions inside polygons
            map.current.data.addListener('mouseover', (event) => {
              map.current.data.overrideStyle(event.feature, {
                fillOpacity: 0.65,
                strokeWeight: 3.5,
                strokeColor: '#c2410c'
              });
            });

            map.current.data.addListener('mouseout', (event) => {
              map.current.data.revertStyle();
            });
          }

          // 2. Draw Precise Participant Locations (Teal Markers)
          participants.forEach(p => {
            if (p.lat !== null && p.lng !== null) {
              const marker = new window.google.maps.Marker({
                position: { lat: parseFloat(p.lat), lng: parseFloat(p.lng) },
                map: map.current,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#3b82f6', // Premium blue dot
                  fillOpacity: 0.9,
                  scale: 7,
                  strokeColor: '#ffffff',
                  strokeWeight: 1.5
                }
              });

              // Hover scale effect
              marker.addListener('mouseover', () => {
                marker.setIcon({
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  scale: 9,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                });
              });

              marker.addListener('mouseout', () => {
                marker.setIcon({
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.9,
                  scale: 7,
                  strokeColor: '#ffffff',
                  strokeWeight: 1.5
                });
              });

              // Info window on click
              marker.addListener('click', () => {
                const contentString = `
                  <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 160px; color: #1f2937; line-height: 1.4;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px; color: #2563eb; display: flex; align-items: center; gap: 4px;">
                      📍 ${p.name}
                    </div>
                    <hr style="margin: 6px 0; border: none; border-top: 1px solid #e5e7eb;"/>
                    <div><strong>Email:</strong> ${p.email || '-'}</div>
                    <div><strong>City:</strong> ${p.city || '-'} (${p.pincode || '-'})</div>
                    ${p.address ? `<div style="font-size: 10px; color: #6b7280; margin-top: 4px;"><strong>Address:</strong> ${p.address}</div>` : ''}
                  </div>
                `;
                infoWindow.setContent(contentString);
                infoWindow.open(map.current, marker);
              });

              markersRef.current.push(marker);
            }
          });

          // 3. Smart Autofit Camera Bounds
          let boundsFitted = false;
          const gBounds = new window.google.maps.LatLngBounds();

          if (data.bounds && data.bounds.southwest && data.bounds.northeast) {
            try {
              const sw = data.bounds.southwest;
              const ne = data.bounds.northeast;
              gBounds.extend(new window.google.maps.LatLng(parseFloat(sw.lat), parseFloat(sw.lng)));
              gBounds.extend(new window.google.maps.LatLng(parseFloat(ne.lat), parseFloat(ne.lng)));
              map.current.fitBounds(gBounds);
              boundsFitted = true;
            } catch (e) {
              console.warn('Failed fitting GeoJSON bounds:', e);
            }
          }

          if (!boundsFitted) {
            let hasPoints = false;
            // Extend bounds by marker points
            markersRef.current.forEach(m => {
              gBounds.extend(m.getPosition());
              hasPoints = true;
            });

            // Extend bounds by geojson polygons coordinates
            if (geojsonData.features) {
              geojsonData.features.forEach(f => {
                if (f.geometry && f.geometry.type === 'Polygon') {
                  f.geometry.coordinates[0].forEach(coord => {
                    gBounds.extend(new window.google.maps.LatLng(parseFloat(coord[1]), parseFloat(coord[0])));
                    hasPoints = true;
                  });
                }
              });
            }

            if (hasPoints) {
              map.current.fitBounds(gBounds);
              boundsFitted = true;
            }
          }

          setLoading(false);
        });
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
      clearMarkers();
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
            {Object.keys(THEME_STYLES).map((t) => (
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
