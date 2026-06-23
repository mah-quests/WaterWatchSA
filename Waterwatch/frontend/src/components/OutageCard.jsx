import React from 'react';

const STATUS_STYLES = {
  reported:    { background: '#fce8e6', color: '#c5221f' },
  confirmed:   { background: '#fef3e2', color: '#b06000' },
  in_progress: { background: '#fef9e7', color: '#856404' },
  resolved:    { background: '#e6f4ea', color: '#188038' },
};

export default function OutageCard({ outage, highlighted, onClick }) {
  const { suburb, municipality, description, status, created_at } = outage;
  const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.reported;

  return (
    <div onClick={onClick} style={{ ...styles.card, ...(highlighted ? styles.highlighted : {}) }}>
      <div style={styles.header}>
        <span style={styles.location}>{suburb}, {municipality}</span>
        <span style={{ ...styles.badge, ...badgeStyle }}>{status.replace('_', ' ')}</span>
      </div>
      <p style={styles.description}>{description}</p>
      <time style={styles.time}>{new Date(created_at).toLocaleString('en-ZA')}</time>
    </div>
  );
}

const styles = {
  card: { padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0', cursor: 'pointer', background: '#fff' },
  highlighted: { borderColor: '#1a73e8', boxShadow: '0 0 0 2px rgba(26,115,232,0.25)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  location: { fontWeight: 600, fontSize: '0.9rem' },
  badge: { padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 },
  description: { fontSize: '0.85rem', color: '#444', margin: '0 0 0.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  time: { fontSize: '0.75rem', color: '#888' },
};
