import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={styles.nav}>
        <span style={styles.brand}>WaterWatch SA</span>
        <Link to="/" style={styles.link}>Live Map</Link>
        <Link to="/report" style={styles.link}>Report Outage</Link>
      </nav>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1.5rem', background: '#1a73e8', color: '#fff' },
  brand: { fontWeight: 700, fontSize: '1.1rem', marginRight: 'auto' },
  link: { color: '#fff', textDecoration: 'none', fontSize: '0.95rem' },
};
