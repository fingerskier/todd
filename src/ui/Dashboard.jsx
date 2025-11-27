import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>The dashboard will provide an overview of application activity and model status.</p>
      <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f0f4f8', borderRadius: 8 }}>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Placeholder content: stats, activity logs, and model summaries will appear here.
        </p>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/logs" style={linkStyle}>Manage logs</Link>
        <Link to="/graphs" style={linkStyle}>Graph catalog</Link>
        <Link to="/kv" style={linkStyle}>Key/value data</Link>
      </div>
    </div>
  );
}

const linkStyle = {
  padding: '10px 14px',
  backgroundColor: '#fff',
  border: '1px solid #e9ecef',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#0d6efd',
  fontWeight: 600,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};
