import React from 'react';
import ReportOutageForm from '../components/ReportOutageForm';

export default function ReportPage() {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Report a Water Outage</h2>
      <ReportOutageForm />
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' },
  heading: { marginBottom: '1.5rem', color: '#1a73e8' },
};
