import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function MenuBar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={getLinkStyle(isActive('/'))}>
          Home
        </Link>
        <Link to="/settings" style={getLinkStyle(isActive('/settings'))}>
          Settings
        </Link>
      </div>
    </nav>
  );
}

const navStyle = {
  backgroundColor: '#343a40',
  padding: '0 24px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const containerStyle = {
  display: 'flex',
  gap: 24,
  maxWidth: 1200,
};

const getLinkStyle = (active) => ({
  color: active ? '#fff' : '#adb5bd',
  textDecoration: 'none',
  padding: '16px 0',
  display: 'inline-block',
  fontWeight: active ? 600 : 400,
  borderBottom: active ? '3px solid #007bff' : '3px solid transparent',
  transition: 'all 0.2s',
});
