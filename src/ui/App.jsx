import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Home';
import Settings from './Settings';
import Dashboard from './Dashboard';
import Logs from './Logs';
import Graphs from './Graphs';
import KeyValueData from './KeyValueData';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = window.api?.navigation?.onNavigate?.((path) => {
      if (path) {
        navigate(path);
      }
    });

    return () => unsubscribe?.();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/graphs" element={<Graphs />} />
        <Route path="/kv" element={<KeyValueData />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
