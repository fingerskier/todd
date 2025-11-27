import React from 'react';
import { Link } from 'react-router-dom';

const cardStyle = {
  padding: 16,
  border: '1px solid #e9ecef',
  borderRadius: 8,
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const navLinkStyle = {
  color: '#0d6efd',
  textDecoration: 'none',
  fontWeight: 600,
};

export default function Home() {
  const routes = [
    { path: '/dashboard', title: 'Dashboard', description: 'Overview of application activity.' },
    { path: '/logs', title: 'Logs', description: 'Create and manage log records.' },
    { path: '/graphs', title: 'Graphs', description: 'Define graph metadata for dashboards.' },
    { path: '/kv', title: 'Key/Value Data', description: 'Manage configuration-style data.' },
    { path: '/settings', title: 'Settings', description: 'Database configuration and migrations.' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>Todd</h1>

      <p style={{ color: '#6c757d', marginTop: 0 }}>If you can read this, everything is wired correctly.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
        {routes.map((route) => (
          <div key={route.path} style={cardStyle}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{route.title}</div>
            <div style={{ color: '#6c757d', marginBottom: 12 }}>{route.description}</div>
            <Link to={route.path} style={navLinkStyle}>
              Open {route.title.toLowerCase()} →
            </Link>
          </div>
        ))}
      </div>

      <pre style={{ marginTop: 16, opacity: 0.7 }}>
        window.api?.database =&gt; {typeof window !== 'undefined' && window.api?.database ? 'Available' : 'Not available'}
      </pre>
    </div>
  );
}
