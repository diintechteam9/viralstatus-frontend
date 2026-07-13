import React, { useEffect, useRef, useState, useMemo } from 'react';
import apiClient from '../../../utils/apiClient';

// Premium Location Pin SVG Icon Design
const USER_ICON_SVG = `data:image/svg+xml;utf-8,` + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ea580c"/>
  </svg>
`);

const HOVER_USER_ICON_SVG = `data:image/svg+xml;utf-8,` + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#f97316"/>
  </svg>
`);

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
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

const GOOGLE_DARK_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#484848" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

const THEME_STYLES = {
  standard: [],
  light: GOOGLE_LIGHT_STYLE,
  dark: GOOGLE_DARK_STYLE
};

const getStateFromAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const statePart = parts[parts.length - 2];
    return statePart.replace(/\d+/g, '').trim();
  }
  return '';
};

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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
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

// Extends Google Maps bounds to cover a GeoJSON Feature Polygon or MultiPolygon coordinates
const extendBoundsWithFeature = (bounds, feature) => {
  if (!feature || !feature.geometry) return;
  const coords = feature.geometry.coordinates;
  const type = feature.geometry.type;

  if (type === 'Polygon') {
    coords.forEach(ring => {
      ring.forEach(coord => {
        bounds.extend({ lng: parseFloat(coord[0]), lat: parseFloat(coord[1]) });
      });
    });
  } else if (type === 'MultiPolygon') {
    coords.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(coord => {
          bounds.extend({ lng: parseFloat(coord[0]), lat: parseFloat(coord[1]) });
        });
      });
    });
  }
};

// Premium Custom Searchable Select / Multi-Select Dropdown Component
const SearchableSelect = ({ 
  label, 
  value, // string (single-select) or array (multi-select)
  onChange, 
  options, 
  placeholder, 
  emptyMessage = "No option found",
  isMulti = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Sync internal search input with value from parent (for single-select)
  useEffect(() => {
    if (!isMulti) {
      setSearch(value || '');
    }
  }, [value, isMulti]);

  // Close list on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch(''); // Clear search on close for multi-select
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(q));
  }, [options, search]);

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (opt) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(opt)) {
        onChange(currentValues.filter(val => val !== opt));
      } else {
        onChange([...currentValues, opt]);
      }
    } else {
      onChange(opt);
      setSearch(opt);
      setIsOpen(false);
    }
  };

  const isSelected = (opt) => {
    if (isMulti) {
      return Array.isArray(value) && value.includes(opt);
    }
    return value === opt;
  };

  const handleRemoveChip = (opt, e) => {
    e.stopPropagation();
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      onChange(currentValues.filter(val => val !== opt));
    }
  };

  return (
    <div className="flex flex-col relative" ref={containerRef}>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</span>
      
      {/* Selected Items Chips / Badges Container for Multi-Select */}
      {isMulti && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5 max-h-24 overflow-y-auto p-1 bg-gray-100 rounded border border-gray-200">
          {value.map(opt => (
            <span 
              key={opt} 
              className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-orange-200"
            >
              {opt}
              <button
                type="button"
                onClick={(e) => handleRemoveChip(opt, e)}
                className="text-orange-500 hover:text-orange-800 font-bold focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={isMulti ? search : (search || value || '')}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={isMulti && Array.isArray(value) && value.length > 0 ? "Add more..." : placeholder}
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 pr-8 text-xs bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-gray-400 font-medium"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const selected = isSelected(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 hover:text-orange-950 transition-colors flex items-center justify-between ${
                    selected ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <span>{opt}</span>
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-gray-400 italic bg-gray-50 text-center font-medium">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GeoJSONMap = ({ campaignId, campaignName = '', height = 500, onOpenUserDetails }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Map Data States
  const [participants, setParticipants] = useState([]);
  const [geojsonData, setGeojsonData] = useState(null);

  // Filter & Expand States (Upgraded state, city, and pincode filters to arrays)
  const [filterCountry, setFilterCountry] = useState('');
  const [filterState, setFilterState] = useState([]);
  const [filterCity, setFilterCity] = useState([]);
  const [filterPincode, setFilterPincode] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Refs to prevent React stale closures inside Google Maps listeners and styling callbacks
  const showBoundariesRef = useRef(showBoundaries);
  const participantsRef = useRef(participants);
  const filterStateRef = useRef(filterState);
  const filterCityRef = useRef(filterCity);
  const filterPincodeRef = useRef(filterPincode);

  useEffect(() => {
    showBoundariesRef.current = showBoundaries;
  }, [showBoundaries]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    filterStateRef.current = filterState;
  }, [filterState]);

  useEffect(() => {
    filterCityRef.current = filterCity;
  }, [filterCity]);

  useEffect(() => {
    filterPincodeRef.current = filterPincode;
  }, [filterPincode]);

  // Extract Filter Options dynamically from all loaded GeoJSON boundary features
  const uniqueStates = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    const states = geojsonData.features.map(f => {
      const st = f.properties?.state || '';
      return st.trim();
    }).filter(Boolean);
    return [...new Set(states)].sort();
  }, [geojsonData]);

  const uniqueCities = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    const filtered = geojsonData.features.filter(f => {
      if (filterState.length === 0) return true;
      const st = (f.properties?.state || '').trim().toLowerCase();
      return filterState.some(fs => st === fs.toLowerCase());
    });
    const cities = filtered.map(f => {
      const ct = f.properties?.city || '';
      return ct.trim();
    }).filter(Boolean);
    return [...new Set(cities)].sort();
  }, [geojsonData, filterState]);

  const uniquePincodes = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    const filtered = geojsonData.features.filter(f => {
      // Check multiple states
      if (filterState.length > 0) {
        const st = (f.properties?.state || '').trim().toLowerCase();
        const stateMatch = filterState.some(fs => st === fs.toLowerCase());
        if (!stateMatch) return false;
      }
      // Check multiple cities
      if (filterCity.length > 0) {
        const ct = (f.properties?.city || '').trim().toLowerCase();
        const cityMatch = filterCity.some(fc => ct === fc.toLowerCase());
        if (!cityMatch) return false;
      }
      return true;
    });
    const pincodes = filtered.map(f => f.properties?.pincode).filter(Boolean);
    return [...new Set(pincodes.map(String))].sort();
  }, [geojsonData, filterState, filterCity]);

  // Filter matching subset of participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchCountry = !filterCountry || filterCountry.toLowerCase() === 'india';
      
      const matchState = filterState.length === 0 || filterState.some(fs => 
        getStateFromAddress(p.address).toLowerCase().includes(fs.toLowerCase())
      );
      
      const matchCity = filterCity.length === 0 || filterCity.some(fc => 
        p.city.toLowerCase().includes(fc.toLowerCase())
      );
      
      const matchPincode = filterPincode.length === 0 || filterPincode.some(fp => 
        String(p.pincode).includes(String(fp))
      );
      
      return matchCountry && matchState && matchCity && matchPincode;
    });
  }, [participants, filterCountry, filterState, filterCity, filterPincode]);

  // Helper to update Google Maps Data Layer Polygon styles dynamically based on zoom scale and filters
  const updateDataLayerStyle = () => {
    if (!map.current) return;
    const z = map.current.getZoom();
    const isLowZoom = z <= 8; // If zoomed out (e.g. Country level), make polygons highly visible
    map.current.data.setStyle((feature) => {
      const fState = (feature.getProperty('state') || '').trim();
      const fCity = (feature.getProperty('city') || '').trim();
      const fPincode = String(feature.getProperty('pincode') || '').trim();

      let isVisible = showBoundariesRef.current;

      // Filter polygons based on frontend selection (State, City, Pincode Arrays)
      if (isVisible) {
        if (filterStateRef.current && filterStateRef.current.length > 0) {
          const matchState = filterStateRef.current.some(fs => 
            fState.toLowerCase() === fs.toLowerCase()
          );
          if (!matchState) isVisible = false;
        }
        
        if (isVisible && filterCityRef.current && filterCityRef.current.length > 0) {
          const matchCity = filterCityRef.current.some(fc => 
            fCity.toLowerCase() === fc.toLowerCase()
          );
          if (!matchCity) isVisible = false;
        }
        
        if (isVisible && filterPincodeRef.current && filterPincodeRef.current.length > 0) {
          const matchPincode = filterPincodeRef.current.some(fp => 
            fPincode === String(fp)
          );
          if (!matchPincode) isVisible = false;
        }
      }

      return {
        visible: isVisible,
        strokeColor: '#ea580c',
        strokeWeight: isLowZoom ? 5 : 2,
        strokeOpacity: isLowZoom ? 1.0 : 0.8,
        fillColor: '#f97316',
        fillOpacity: isLowZoom ? 0.75 : 0.35,
      };
    });
  };

  // Sync theme changes instantly
  useEffect(() => {
    if (map.current) {
      map.current.setOptions({ styles: THEME_STYLES[theme] });
    }
  }, [theme]);

  // Toggle boundary style visibility reactively when showBoundaries checkbox toggles
  useEffect(() => {
    updateDataLayerStyle();
  }, [showBoundaries]);

  // Trigger boundary styling updates whenever search filters change
  useEffect(() => {
    updateDataLayerStyle();
  }, [filterState, filterCity, filterPincode]);

  // Load Initial GeoJSON and Participants List
  useEffect(() => {
    let cancelled = false;

    const fetchMapData = async () => {
      try {
        if (!campaignId) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get(`/api/auth/user/campaign/${campaignId}/geojson`);
        const data = response.data;

        if (cancelled) return;

        if (!data || !data.success) {
          setError(data?.message || 'Failed to load map data');
          setLoading(false);
          return;
        }

        const list = data.participants || [];
        const geojson = data.geojson || { type: 'FeatureCollection', features: [] };

        setParticipants(list);
        setGeojsonData(geojson);
        setStats({
          participantCount: list.length,
          pincodeCount: data.pincodeCount || 0,
          cities: [...new Set(list.map(p => p.city).filter(Boolean))].length
        });
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to connect to map services');
          setLoading(false);
        }
      }
    };

    fetchMapData();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // Render Google Map & Polygons
  useEffect(() => {
    if (loading || error || !geojsonData) return;
    let cancelled = false;

    loadGoogleMapsScript(() => {
      if (cancelled || !mapContainer.current) return;

      if (!map.current) {
        map.current = new window.google.maps.Map(mapContainer.current, {
          center: { lat: 28.5842, lng: 77.3150 }, // Focus on Noida region by default
          zoom: 12,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.LEFT_TOP
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: THEME_STYLES[theme]
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();

        // Zoom changed listener to update styling reactively (handles high contrast highlights)
        map.current.addListener('zoom_changed', () => {
          updateDataLayerStyle();
        });

        // Click interaction inside Pincode polygons: zooms in and counts participants
        map.current.data.addListener('click', (event) => {
          const feature = event.feature;
          const pin = feature.getProperty('pincode');
          
          if (map.current) {
            map.current.setZoom(13);
            map.current.panTo(event.latLng);
          }

          const localUsers = participantsRef.current.filter(p => String(p.pincode) === String(pin));
          const usersListHtml = localUsers.length > 0 
            ? `<div style="max-height: 85px; overflow-y: auto; margin-top: 5px; font-size: 11px;">
                ${localUsers.map(u => `• <strong>${u.name}</strong> (${u.city})`).join('<br/>')}
               </div>`
            : '<div style="color: #ef4444; font-size: 11px; margin-top: 4px; font-weight: 600;">⚠️ 0 Users in this boundary</div>';

          const contentString = `
            <div style="font-family: 'Inter', sans-serif; font-size: 12px; min-width: 180px; color: #1f2937; line-height: 1.4;">
              <div style="font-weight: bold; margin-bottom: 2px; color: #ea580c;">📮 Pincode: ${pin}</div>
              <div style="font-size: 11px; color: #4b5563;"><strong>Zone:</strong> ${feature.getProperty('area') || 'Sector 2'}, ${feature.getProperty('city') || 'Noida'}</div>
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #e5e7eb;"/>
              <div style="font-weight: 600; margin-bottom: 2px;">Participants in Zone: ${localUsers.length}</div>
              ${usersListHtml}
            </div>
          `;

          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.setPosition(event.latLng);
            infoWindowRef.current.open(map.current);
          }
        });

        // Hover interactions inside polygons
        map.current.data.addListener('mouseover', (event) => {
          map.current.data.overrideStyle(event.feature, {
            fillOpacity: 0.85,
            strokeWeight: 4.5,
            strokeColor: '#c2410c'
          });
        });

        map.current.data.addListener('mouseout', (event) => {
          map.current.data.revertStyle();
          updateDataLayerStyle(); // revert to zoom-aware styles
        });
      }

      // Draw and sync the boundaries
      map.current.data.forEach((feature) => {
        map.current.data.remove(feature);
      });

      if (geojsonData.features && geojsonData.features.length > 0) {
        map.current.data.addGeoJson(geojsonData);
        updateDataLayerStyle();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loading, error, geojsonData]);

  // Render & Sync Markers based on active location filters (Auto-Zoom bounds & Geocoder logic inside)
  useEffect(() => {
    if (!map.current || loading || error) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const coordinateCounts = {};
    filteredParticipants.forEach(p => {
      if (p.lat !== null && p.lng !== null) {
        const key = `${parseFloat(p.lat).toFixed(5)},${parseFloat(p.lng).toFixed(5)}`;
        coordinateCounts[key] = (coordinateCounts[key] || 0) + 1;
      }
    });

    const coordinateOffsets = {};
    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // 1. Zoom to matching participants markers
    filteredParticipants.forEach(p => {
      if (p.lat !== null && p.lng !== null) {
        const key = `${parseFloat(p.lat).toFixed(5)},${parseFloat(p.lng).toFixed(5)}`;
        let finalLat = parseFloat(p.lat);
        let finalLng = parseFloat(p.lng);

        if (coordinateCounts[key] > 1) {
          const index = coordinateOffsets[key] || 0;
          coordinateOffsets[key] = index + 1;

          // Push apart overlapping markers in a circle
          const angle = (index * 2 * Math.PI) / coordinateCounts[key];
          const offsetRadius = 0.00008;
          finalLat += offsetRadius * Math.sin(angle);
          finalLng += offsetRadius * Math.cos(angle);
        }

        const positionObj = { lat: finalLat, lng: finalLng };
        bounds.extend(positionObj);
        hasCoords = true;

        const marker = new window.google.maps.Marker({
          position: positionObj,
          map: map.current,
          title: p.name, // Native hover tooltip shows the user's name
          icon: {
            url: USER_ICON_SVG,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 36) // Bottom-middle pin anchor
          }
        });

        // Hover color & scale effects
        marker.addListener('mouseover', () => {
          marker.setIcon({
            url: HOVER_USER_ICON_SVG,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40)
          });
        });

        marker.addListener('mouseout', () => {
          marker.setIcon({
            url: USER_ICON_SVG,
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 36)
          });
        });

        // Click handler: zoom in first, then show InfoWindow with "View Insights" button
        marker.addListener('click', () => {
          if (map.current) {
            map.current.setZoom(16);
            map.current.panTo(marker.getPosition());
          }

          const contentString = `
            <div style="font-family: 'Inter', sans-serif; font-size: 13px; padding: 6px; text-align: center; min-width: 140px; color: #1f2937;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #ea580c;">👤 ${p.name}</div>
              <button 
                id="view-details-btn-${p.id}"
                style="background-color: #ea580c; color: white; border: none; padding: 5px 12px; font-size: 11px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);"
                onmouseover="this.style.backgroundColor='#c2410c'"
                onmouseout="this.style.backgroundColor='#ea580c'"
              >
                View Insights
              </button>
            </div>
          `;

          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(map.current, marker);

            // Bind click to open detailed popup modal
            window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
              const btn = document.getElementById(`view-details-btn-${p.id}`);
              if (btn) {
                btn.addEventListener('click', () => {
                  onOpenUserDetails(p.id);
                  infoWindowRef.current.close();
                });
              }
            });
          }
        });

        markersRef.current.push(marker);
      }
    });

    // 2. Zoom to matching GeoJSON boundary polygon coordinates (if filtering zones)
    if (geojsonData && geojsonData.features) {
      geojsonData.features.forEach(feature => {
        const props = feature.properties || {};
        const matchCountry = !filterCountry || filterCountry.toLowerCase() === 'india';
        
        const matchState = filterState.length === 0 || filterState.some(fs => 
          (props.state && props.state.toLowerCase().includes(fs.toLowerCase()))
        );
        
        const matchCity = filterCity.length === 0 || filterCity.some(fc => 
          (props.city && props.city.toLowerCase().includes(fc.toLowerCase()))
        );
        
        const matchPincode = filterPincode.length === 0 || filterPincode.some(fp => 
          (props.pincode && String(props.pincode).includes(String(fp)))
        );

        if (matchCountry && matchState && matchCity && matchPincode) {
          extendBoundsWithFeature(bounds, feature);
          hasCoords = true;
        }
      });
    }

    // Auto-Zoom / Focus center logic
    if (map.current) {
      if (filterCountry === 'India' && filterState.length === 0 && filterCity.length === 0 && filterPincode.length === 0) {
        // Zoom out to show the entire country of India!
        map.current.setCenter({ lat: 20.5937, lng: 78.9629 });
        map.current.setZoom(5);
      } else if (filteredParticipants.length === 0 && (filterPincode.length > 0 || filterCity.length > 0 || filterState.length > 0)) {
        // Fallback: If no participants are found for search input, use Google Geocoder client-side to locate it
        const searchQuery = `${filterPincode.join(' ')} ${filterCity.join(' ')} ${filterState.join(' ')}, India`.trim();
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results[0] && map.current) {
            const loc = results[0].geometry.location;
            map.current.setCenter(loc);
            map.current.setZoom(filterPincode.length > 0 ? 14 : 11);
          }
        });
      } else if (hasCoords) {
        // Standard fit bounds to zoom in on filtered state/city/pincode
        map.current.fitBounds(bounds);

        // Handle close zoom-in offsets
        const listener = window.google.maps.event.addListener(map.current, 'idle', () => {
          if (map.current.getZoom() > 16) {
            map.current.setZoom(16);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }

  }, [filteredParticipants, geojsonData, filterCountry, filterState, filterCity, filterPincode, loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500 font-medium">
        Loading coverage maps...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium">
        Error loading maps: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full items-stretch">
      {/* 1. Left Column: Stats & Location Filters Sidebar (Visible only when not expanded) */}
      {!isExpanded && (
        <div className="w-full md:w-[260px] flex flex-col gap-4 p-5 bg-gray-50 border border-gray-150 rounded-2xl shrink-0 animate-in slide-in-from-left duration-200">
          
          {/* Stats section at the top of the sidebar */}
          {stats && (
            <div className="flex flex-col gap-2.5 bg-white p-3.5 border border-gray-150 rounded-xl shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                📊 Campaign Coverage
              </h4>
              {campaignName && (
                <div className="text-[11px] font-bold text-gray-800 truncate" title={campaignName}>
                  🎯 {campaignName}
                </div>
              )}
              <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between gap-4">
                  <span>👥 Active Users:</span>
                  <strong className="font-semibold text-gray-900">{filteredParticipants.length}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>📮 Active Pincodes:</span>
                  <strong className="font-semibold text-gray-900">{stats.pincodeCount}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>🏙️ Active Cities:</span>
                  <strong className="font-semibold text-gray-900">{stats.cities}</strong>
                </div>
              </div>
              
              {/* Color Legend inside the stats box */}
              <div className="mt-1 pt-2 border-t border-gray-100 flex flex-col gap-1.5 text-[9px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#fdba74', border: '1px solid #ea580c', borderRadius: '2px' }} />
                  <span>Pincode Boundary</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" style={{ display: 'block' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ea580c"/>
                  </svg>
                  <span>GPS User Location</span>
                </div>
              </div>
            </div>
          )}

          {/* Map Filters section below the stats */}
          <div className="flex flex-col gap-3 mt-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 border-b border-gray-200 pb-1.5">
              🔍 Map Filters
            </h4>
            
            {/* Searchable Country Filter */}
            <SearchableSelect
              label="Country"
              value={filterCountry}
              onChange={(val) => {
                setFilterCountry(val);
                if (val === 'India') {
                  setFilterState([]);
                  setFilterCity([]);
                  setFilterPincode([]);
                }
              }}
              options={['India']}
              placeholder="Search / Select Country"
              emptyMessage="No country found"
            />

            {/* Searchable State Filter (Upgraded to Multi-Select) */}
            <SearchableSelect
              label="State"
              value={filterState}
              onChange={(val) => {
                setFilterState(val);
                setFilterCity([]);
                setFilterPincode([]);
              }}
              options={uniqueStates}
              placeholder="Search / Select State"
              emptyMessage="No state found"
              isMulti={true}
            />

            {/* Searchable City Filter (Upgraded to Multi-Select) */}
            <SearchableSelect
              label="City"
              value={filterCity}
              onChange={(val) => {
                setFilterCity(val);
                setFilterPincode([]);
              }}
              options={uniqueCities}
              placeholder="Search / Select City"
              emptyMessage="No city found"
              isMulti={true}
            />

            {/* Searchable Pincode Filter (Upgraded to Multi-Select) */}
            <SearchableSelect
              label="Pincode"
              value={filterPincode}
              onChange={setFilterPincode}
              options={uniquePincodes}
              placeholder="Search / Select Pincode"
              emptyMessage="No pincode found"
              isMulti={true}
            />
            
            {/* Boundary Visibility Checkbox Toggle */}
            <div className="flex items-center gap-2 py-2 border-t border-gray-200 mt-2">
              <input
                id="show-boundaries-checkbox"
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
                className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="show-boundaries-checkbox" className="text-[11px] font-semibold text-gray-600 cursor-pointer select-none">
                Show Pincode Boundaries
              </label>
            </div>
            
            {/* Reset Filters */}
            {(filterCountry || filterState.length > 0 || filterCity.length > 0 || filterPincode.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setFilterCountry('');
                  setFilterState([]);
                  setFilterCity([]);
                  setFilterPincode([]);
                }}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 underline focus:outline-none self-start"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Right Column: Google Map Canvas (Full width when expanded & Stretches dynamically to match layout) */}
      <div 
        className="relative flex-1 rounded-2xl border border-gray-200 overflow-hidden bg-slate-50 shadow-sm flex flex-col transition-all duration-200" 
        style={{ minHeight: isExpanded ? '640px' : '480px' }}
      >
        <div 
          ref={mapContainer} 
          className="w-full flex-1"
          style={{ 
            minHeight: isExpanded ? '640px' : '480px', 
            transition: 'min-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />

        {/* Floating Controls at Top-Right Corner inside Map Container */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Map Layout Style Switcher */}
          <div className="flex bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 p-0.5 shadow-md">
            {['standard', 'light', 'dark'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                  theme === t
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Floating Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(prev => !prev);
              setTimeout(() => {
                if (map.current) {
                  window.google.maps.event.trigger(map.current, "resize");
                }
              }, 250);
            }}
            title={isExpanded ? "Collapse Map View" : "Expand Map View"}
            className="p-2 bg-white/95 backdrop-blur-sm hover:bg-gray-50 text-gray-700 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-colors"
            style={{ width: '38px', height: '38px' }}
          >
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoJSONMap;
