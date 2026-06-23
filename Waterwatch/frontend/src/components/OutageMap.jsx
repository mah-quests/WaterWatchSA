import React, { useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const SA_CENTER = { lat: -29.0, lng: 25.0 };
const STATUS_ICONS = {
  reported:    'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  confirmed:   'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  in_progress: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  resolved:    'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
};
const BADGE_COLORS = {
  reported: '#ea4335', confirmed: '#fa7b17', in_progress: '#fbbc04', resolved: '#34a853',
};

export default function OutageMap({ outages, onSelect, selectedOutage }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const onLoad = useCallback((map) => {
    if (outages.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    outages.forEach(o => bounds.extend({ lat: o.latitude, lng: o.longitude }));
    map.fitBounds(bounds);
  }, [outages]);

  if (!isLoaded) return <div style={styles.loading}>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={styles.map} center={SA_CENTER} zoom={6} onLoad={onLoad}>
      {outages.map(outage => (
        <Marker
          key={outage.id}
          position={{ lat: outage.latitude, lng: outage.longitude }}
          icon={STATUS_ICONS[outage.status] || STATUS_ICONS.reported}
          onClick={() => onSelect(outage)}
        />
      ))}
      {selectedOutage && (
        <InfoWindow
          position={{ lat: selectedOutage.latitude, lng: selectedOutage.longitude }}
          onCloseClick={() => onSelect(null)}
        >
          <div>
            <strong>{selectedOutage.suburb}, {selectedOutage.municipality}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{selectedOutage.description}</p>
            <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '12px', color: '#fff', fontSize: '0.75rem', background: BADGE_COLORS[selectedOutage.status] || BADGE_COLORS.reported }}>
              {selectedOutage.status.replace('_', ' ')}
            </span>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

const styles = {
  map: { width: '100%', height: '100%' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' },
};
