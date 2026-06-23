import React, { useState } from 'react';

export default function OutageSearch({ onSearch }) {
  const [suburb, setSuburb] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [status, setStatus] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ suburb: suburb.trim(), municipality: municipality.trim(), status });
  };

  const handleClear = () => {
    setSuburb('');
    setMunicipality('');
    setStatus('');
    onSearch({});
  };

  return (
    <form onSubmit={handleSearch} style={styles.form}>
      <input placeholder="Suburb" value={suburb} onChange={e => setSuburb(e.target.value)} style={styles.input} />
      <input placeholder="Municipality" value={municipality} onChange={e => setMunicipality(e.target.value)} style={styles.input} />
      <select value={status} onChange={e => setStatus(e.target.value)} style={styles.input}>
        <option value="">All statuses</option>
        <option value="reported">Reported</option>
        <option value="confirmed">Confirmed</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
      <button type="submit" style={styles.btn}>Search</button>
      <button type="button" onClick={handleClear} style={styles.clearBtn}>Clear</button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderBottom: '1px solid #ddd' },
  input: { padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem', flex: '1 1 140px' },
  btn: { padding: '0.4rem 1rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  clearBtn: { padding: '0.4rem 1rem', background: '#fff', color: '#444', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
};
