import React, { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  connectionType: 'standard',
  host: 'localhost',
  port: 5432,
  database: '',
  user: '',
  password: '',
  connectionString: '',
};

const normalizeConfig = (value) => {
  const port = value?.port;
  const normalizedPort =
    typeof port === 'number'
      ? port
      : port
        ? Number.parseInt(port, 10) || ''
        : DEFAULT_CONFIG.port;

  const validConnectionType =
    value?.connectionType === 'connectionString' ? 'connectionString' : 'standard';

  return {
    ...DEFAULT_CONFIG,
    ...value,
    port: normalizedPort ?? DEFAULT_CONFIG.port,
    connectionType: validConnectionType,
  };
};

export default function Settings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [migrationStatus, setMigrationStatus] = useState([]);
  const [migrationMessage, setMigrationMessage] = useState('');
  const [isApplyingMigrations, setIsApplyingMigrations] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const saved = await window.api.database.getConfig();
      if (saved) {
        setConfig(normalizeConfig(saved));
      }

      await checkConnection();
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isConnected) {
      refreshMigrations();
    } else {
      setMigrationStatus([]);
    }
  }, [isConnected]);

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
      const normalized = normalizeConfig(config);
      setConfig(normalized);
      await window.api.database.setConfig(normalized);
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

  const refreshMigrations = async () => {
    const status = await window.api.migrations.status();
    setMigrationStatus(status);
  };

  const handleApplyMigrations = async () => {
    setMigrationMessage('Applying migrations...');
    setIsApplyingMigrations(true);
    try {
      const result = await window.api.migrations.apply();
      const appliedCount = result.applied?.length ?? 0;
      const suffix = appliedCount === 0 ? '' : ` (${appliedCount} applied)`;
      setMigrationMessage('✓ ' + (result.message || 'Migrations complete') + suffix);
      await refreshMigrations();
    } catch (error) {
      setMigrationMessage('✗ ' + error.message);
    } finally {
      setIsApplyingMigrations(false);
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

        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <label style={{ fontWeight: 500 }}>
            <input
              type="radio"
              name="connectionType"
              value="standard"
              checked={config.connectionType === 'standard'}
              onChange={handleChange}
              disabled={isConnected}
              style={{ marginRight: 6 }}
            />
            Host, port, database, user, password
          </label>
          <label style={{ fontWeight: 500 }}>
            <input
              type="radio"
              name="connectionType"
              value="connectionString"
              checked={config.connectionType === 'connectionString'}
              onChange={handleChange}
              disabled={isConnected}
              style={{ marginRight: 6 }}
            />
            Single connection string
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          {config.connectionType === 'connectionString' ? (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Connection string
              </label>
              <input
                type="text"
                name="connectionString"
                value={config.connectionString}
                onChange={handleChange}
                disabled={isConnected}
                style={inputStyle}
                placeholder="postgres://user:password@host:port/database"
              />
            </div>
          ) : (
            <>
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
            </>
          )}

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

      <div style={{ marginTop: 32 }}>
        <h2>Database Migrations</h2>
        <p style={{ color: '#6c757d', marginTop: 8 }}>
          Track and run schema migrations stored in the application.
        </p>

        <div style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: 4,
          maxWidth: 600,
        }}>
          {!isConnected && (
            <div style={{ color: '#721c24', marginBottom: 8 }}>
              Connect to the database to view and apply migrations.
            </div>
          )}

          {isConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 500 }}>Pending migrations: {migrationStatus.filter((m) => !m.appliedAt).length}</div>
              <button
                onClick={handleApplyMigrations}
                disabled={!isConnected || isApplyingMigrations}
                style={{ ...buttonStyle, opacity: !isConnected ? 0.6 : 1 }}
              >
                {isApplyingMigrations ? 'Applying...' : 'Run Migrations'}
              </button>
            </div>
          )}

          {migrationMessage && (
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 4,
              fontSize: 14,
            }}>
              {migrationMessage}
            </div>
          )}

          {isConnected && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {migrationStatus.length === 0 ? (
                <div style={{ color: '#6c757d' }}>No migrations found.</div>
              ) : (
                migrationStatus.map((migration) => (
                  <div
                    key={migration.id}
                    style={{
                      padding: 10,
                      border: '1px solid #e9ecef',
                      borderRadius: 4,
                      backgroundColor: migration.appliedAt ? '#e2f0d9' : '#fff3cd',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{migration.name}</div>
                      <div style={{ color: '#6c757d', fontSize: 14 }}>{migration.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14 }}>
                      {migration.appliedAt ? (
                        <span style={{ color: '#155724' }}>Applied</span>
                      ) : (
                        <span style={{ color: '#856404' }}>Pending</span>
                      )}
                    </div>
                  </div>
                ))
              )}
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
