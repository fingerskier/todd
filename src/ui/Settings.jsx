import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    checkConnection();
    // Load saved config from localStorage
    const saved = localStorage.getItem('dbConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const checkConnection = async () => {
    const connected = await window.api.database.isConnected();
    setIsConnected(connected);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || '' : value,
    }));
  };

  const handleTestConnection = async () => {
    setTestMessage('Testing connection...');
    const result = await window.api.database.testConnection(config);
    setTestMessage(result.success ? '✓ ' + result.message : '✗ ' + result.message);
  };

  const handleConnect = async () => {
    setMessage('Connecting...');
    const result = await window.api.database.connect(config);
    setMessage(result.success ? '✓ ' + result.message : '✗ ' + result.message);
    if (result.success) {
      localStorage.setItem('dbConfig', JSON.stringify(config));
      setIsConnected(true);
    }
  };

  const handleDisconnect = async () => {
    setMessage('Disconnecting...');
    const result = await window.api.database.disconnect();
    setMessage(result.success ? '✓ ' + result.message : '✗ ' + result.message);
    if (result.success) {
      setIsConnected(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Database Settings</h1>

      <div style={{
        marginTop: 20,
        padding: 12,
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: 4,
        color: isConnected ? '#155724' : '#721c24',
      }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>PostgreSQL Connection</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Host
            </label>
            <input
              type="text"
              name="host"
              value={config.host}
              onChange={handleChange}
              disabled={isConnected}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Port
            </label>
            <input
              type="number"
              name="port"
              value={config.port}
              onChange={handleChange}
              disabled={isConnected}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Database
            </label>
            <input
              type="text"
              name="database"
              value={config.database}
              onChange={handleChange}
              disabled={isConnected}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              User
            </label>
            <input
              type="text"
              name="user"
              value={config.user}
              onChange={handleChange}
              disabled={isConnected}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={config.password}
              onChange={handleChange}
              disabled={isConnected}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleTestConnection}
              disabled={isConnected}
              style={buttonStyle}
            >
              Test Connection
            </button>
            {!isConnected ? (
              <button
                onClick={handleConnect}
                style={{ ...buttonStyle, backgroundColor: '#28a745', borderColor: '#28a745' }}
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                style={{ ...buttonStyle, backgroundColor: '#dc3545', borderColor: '#dc3545' }}
              >
                Disconnect
              </button>
            )}
          </div>

          {testMessage && (
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 4,
              fontSize: 14,
            }}>
              {testMessage}
            </div>
          )}

          {message && (
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 4,
              fontSize: 14,
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: 8,
  border: '1px solid #ced4da',
  borderRadius: 4,
  fontSize: 14,
};

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: '1px solid #007bff',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};
