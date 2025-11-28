import React, { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  url: '',
  authToken: '',
  sync: 'full',
};

const normalizeConfig = (value) => ({
  url: value?.url ?? DEFAULT_CONFIG.url,
  authToken: value?.authToken ?? DEFAULT_CONFIG.authToken,
  sync: value?.sync || DEFAULT_CONFIG.sync,
});

export default function Settings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isConnected, setIsConnected] = useState(false);
  const [dbPath, setDbPath] = useState('');
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [migrationStatus, setMigrationStatus] = useState([]);
  const [migrationMessage, setMigrationMessage] = useState('');
  const [isApplyingMigrations, setIsApplyingMigrations] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [queryResult, setQueryResult] = useState(null);

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

    if (connected) {
      const path = await window.api.database.getPath();
      setDbPath(path || '');
    } else {
      setDbPath('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
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
      setDbPath(result.path || (await window.api.database.getPath()) || '');
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
      setDbPath('');
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

  const handleRunQuery = async () => {
    if (!queryText.trim()) {
      setQueryMessage('✗ Enter a SQL query to run.');
      setQueryResult(null);
      return;
    }

    setQueryMessage('Running query...');
    setQueryResult(null);
    const result = await window.api.database.query(queryText);

    if (result.success) {
      const prefix = Array.isArray(result.data) ? `${result.data.length} row(s) returned.` : 'Query executed.';
      setQueryMessage('✓ ' + prefix);
      setQueryResult(result.data);
    } else {
      setQueryMessage('✗ ' + result.message);
    }
  };

  return (
    <div className="page">
      <h1>Database Settings</h1>

      <div
        className={`status-banner ${
          isConnected ? 'status-banner--connected' : 'status-banner--disconnected'
        }`}
      >
        <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div className="status-detail">
          <span>Database file:</span>
          <code className="code-pill">{dbPath || 'Not available'}</code>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Embedded Database</h2>
        <p className="section-subtitle">
          Configure the embedded database and optional sync settings.
        </p>

        <div className="card">
          <div className="form-grid">
            <div className="form-label">Database file</div>
            <div className="form-static">
              <code className="code-pill">{dbPath || 'Not connected'}</code>
            </div>

            <label className="form-label" htmlFor="url">
              Sync URL (optional)
            </label>
            <input
              className="form-control"
              type="text"
              id="url"
              name="url"
              value={config.url}
              onChange={handleChange}
              disabled={isConnected}
              placeholder="libsql://example.turso.io"
            />

            <label className="form-label" htmlFor="authToken">
              Auth Token (optional)
            </label>
            <input
              className="form-control"
              type="text"
              id="authToken"
              name="authToken"
              value={config.authToken}
              onChange={handleChange}
              disabled={isConnected}
              placeholder="Bearer token for sync"
            />

            <label className="form-label" htmlFor="sync">
              Sync Mode
            </label>
            <select
              className="form-control"
              id="sync"
              name="sync"
              value={config.sync}
              onChange={handleChange}
              disabled={isConnected}
            >
              <option value="full">Full</option>
              <option value="">Disabled</option>
            </select>
          </div>

          <div className="button-row">
            <button
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isConnected}
            >
              Test Connection
            </button>
            {!isConnected ? (
              <button className="btn btn-success" onClick={handleConnect}>
                Connect
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleDisconnect}>
                Disconnect
              </button>
            )}
          </div>

          {testMessage && <div className="notice">{testMessage}</div>}

          {message && <div className="notice">{message}</div>}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Database Migrations</h2>
        <p className="section-subtitle">
          Track and run schema migrations stored in the application.
        </p>

        <div className="card">
          {!isConnected && (
            <div className="notice">Connect to the database to view and apply migrations.</div>
          )}

          {isConnected && (
            <div className="card-row">
              <div className="text-strong">
                Pending migrations: {migrationStatus.filter((m) => !m.appliedAt).length}
              </div>
              <button
                className="btn"
                onClick={handleApplyMigrations}
                disabled={!isConnected || isApplyingMigrations}
              >
                {isApplyingMigrations ? 'Applying...' : 'Run Migrations'}
              </button>
            </div>
          )}

          {migrationMessage && <div className="notice">{migrationMessage}</div>}

          {isConnected && (
            <div className="migration-list">
              {migrationStatus.length === 0 ? (
                <div className="notice notice-muted">No migrations found.</div>
              ) : (
                migrationStatus.map((migration) => (
                  <div
                    key={migration.id}
                    className={`migration-item ${migration.appliedAt ? 'applied' : 'pending'}`}
                  >
                    <div>
                      <div className="text-strong">{migration.name}</div>
                      <div className="text-muted text-small">{migration.description}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={
                          migration.appliedAt ? 'badge badge-success' : 'badge badge-warning'
                        }
                      >
                        {migration.appliedAt ? 'Applied' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Query</h2>
        <p className="section-subtitle">
          Run an arbitrary SQL query against the connected database.
        </p>

        <div className="card">
          {!isConnected && <div className="notice">Connect to the database to run queries.</div>}

          <div className="form-grid">
            <label className="form-label" htmlFor="queryText">
              SQL Query
            </label>
            <textarea
              className="form-control textarea-control"
              value={queryText}
              id="queryText"
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="SELECT * FROM table_name LIMIT 10;"
              rows={5}
              disabled={!isConnected}
            />
          </div>

          <div className="button-row">
            <button className="btn" onClick={handleRunQuery} disabled={!isConnected}>
              Run Query
            </button>
          </div>

          {queryMessage && <div className="notice">{queryMessage}</div>}

          {queryResult !== null && (
            <pre className="code-block">{JSON.stringify(queryResult, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
