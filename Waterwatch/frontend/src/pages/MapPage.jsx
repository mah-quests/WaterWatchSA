import React, { useState, useEffect } from 'react';
import OutageMap from '../components/OutageMap';
import OutageSearch from '../components/OutageSearch';
import OutageCard from '../components/OutageCard';
import { getOutages } from '../services/outageService';

export default function MapPage() {
  const [outages, setOutages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getOutages(filters)
      .then(setOutages)
      .catch(() => setError('Failed to load outages'))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div style={styles.container}>
      <OutageSearch onSearch={setFilters} />
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.body}>
        <div style={styles.map}>
          <OutageMap outages={outages} onSelect={setSelected} selectedOutage={selected} />
        </div>
        <div style={styles.sidebar}>
          {loading && <p>Loading outages...</p>}
          {!loading && outages.length === 0 && <p>No outages found.</p>}
          {outages.map(o => (
            <OutageCard
              key={o.id}
              outage={o}
              highlighted={selected?.id === o.id}
              onClick={() => setSelected(o)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  map: { flex: 1 },
  sidebar: { width: '320px', overflowY: 'auto', padding: '0.75rem', borderLeft: '1px solid #ddd' },
  error: { color: 'red', padding: '0.5rem 1rem' },
};
