import React, { useState, useEffect } from 'react';
import { createOutage } from '../services/outageService';

const initialForm = { suburb: '', municipality: '', description: '', latitude: '', longitude: '', photo: null };

export default function ReportOutageForm() {
  const [form, setForm] = useState(initialForm);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setForm(f => ({ ...f, latitude: coords.latitude, longitude: coords.longitude })),
        () => {}
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => { if (val !== null && val !== '') data.append(key, val); });

    try {
      await createOutage(data);
      setSubmitStatus({ type: 'success', message: 'Outage reported successfully.' });
      setForm(initialForm);
    } catch {
      setSubmitStatus({ type: 'error', message: 'Failed to submit report. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {submitStatus && (
        <p style={submitStatus.type === 'success' ? styles.success : styles.error}>{submitStatus.message}</p>
      )}
      <label style={styles.label}>Suburb *
        <input name="suburb" value={form.suburb} onChange={handleChange} required style={styles.input} />
      </label>
      <label style={styles.label}>Municipality *
        <input name="municipality" value={form.municipality} onChange={handleChange} required style={styles.input} />
      </label>
      <label style={styles.label}>Description *
        <textarea name="description" value={form.description} onChange={handleChange} required maxLength={1000} rows={4} style={styles.input} />
      </label>
      <div style={styles.row}>
        <label style={{ ...styles.label, flex: 1 }}>Latitude *
          <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} required style={styles.input} />
        </label>
        <label style={{ ...styles.label, flex: 1 }}>Longitude *
          <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} required style={styles.input} />
        </label>
      </div>
      <label style={styles.label}>Photo (optional)
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} style={styles.input} />
      </label>
      <button type="submit" disabled={submitting} style={styles.button}>
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500 },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '1rem' },
  button: { padding: '0.65rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
  success: { color: '#188038', background: '#e6f4ea', padding: '0.5rem 0.75rem', borderRadius: '4px' },
  error: { color: '#c5221f', background: '#fce8e6', padding: '0.5rem 0.75rem', borderRadius: '4px' },
};
