import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e9ecef',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #ced4da',
};

export default function Logs() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ level: 'info', message: '', metadata: '' });
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => setForm({ level: 'info', message: '', metadata: '' });

  const refreshLogs = async () => {
    setIsLoading(true);
    setStatus('');
    const result = await window.api.database.query(
      'SELECT id, level, message, metadata, created_at FROM logs ORDER BY created_at DESC',
    );
    if (result.success) {
      const parsedRows = (result.data ?? []).map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
      setEntries(parsedRows);
    } else {
      setStatus(result.message);
      setEntries([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const parseMetadata = () => {
    if (!form.metadata.trim()) return null;
    try {
      return JSON.parse(form.metadata);
    } catch (error) {
      setStatus('Invalid metadata JSON: ' + error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!form.message.trim()) {
      setStatus('Message is required');
      return;
    }

    let metadata;
    try {
      metadata = parseMetadata();
    } catch {
      return;
    }

    const metadataPayload = metadata ? JSON.stringify(metadata) : null;

    if (editingId) {
      const result = await window.api.database.query(
        'UPDATE logs SET level = ?, message = ?, metadata = ? WHERE id = ?',
        [form.level, form.message, metadataPayload, editingId],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setEditingId(null);
    } else {
      const result = await window.api.database.query(
        'INSERT INTO logs (level, message, metadata) VALUES (?, ?, ?)',
        [form.level, form.message, metadataPayload],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
    }

    resetForm();
    refreshLogs();
  };

  const handleEdit = (entry) => {
    setForm({
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata ? JSON.stringify(entry.metadata, null, 2) : '',
    });
    setEditingId(entry.id);
  };

  const handleDelete = async (id) => {
    setStatus('');
    const result = await window.api.database.query('DELETE FROM logs WHERE id = ?', [id]);
    if (!result.success) {
      setStatus(result.message);
      return;
    }

    if (editingId === id) {
      resetForm();
      setEditingId(null);
    }

    refreshLogs();
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, color: '#212529' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Logs</h1>
        <Link to="/dashboard" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>
      <p style={{ color: '#6c757d', marginTop: 8 }}>
        Create, update, and remove log records stored in the <code>logs</code> table.
      </p>

      {status && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 6,
            border: '1px solid #f5c2c7',
            background: '#f8d7da',
            color: '#842029',
          }}
        >
          {status}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <form onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit log' : 'Add new log'}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Level</div>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                style={{ ...inputStyle, height: 38 }}
              >
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Message</div>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ ...inputStyle, minHeight: 80 }}
                placeholder="Describe the event..."
              />
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Metadata (JSON)</div>
              <textarea
                value={form.metadata}
                onChange={(e) => setForm({ ...form, metadata: e.target.value })}
                style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace' }}
                placeholder="{ &quot;requestId&quot;: &quot;abc123&quot; }"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#0d6efd',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update log' : 'Create log'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                }}
                style={{
                  backgroundColor: '#e9ecef',
                  color: '#212529',
                  border: '1px solid #ced4da',
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Existing logs</h2>
          {isLoading ? (
            <p style={{ color: '#6c757d' }}>Loading logs...</p>
          ) : entries.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No logs created yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    padding: 12,
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0d6efd' }}>{entry.level.toUpperCase()}</div>
                      <div style={{ color: '#6c757d', fontSize: 13 }}>
                        Created: {new Date(entry.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeeba',
                          color: '#856404',
                          padding: '6px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{
                          backgroundColor: '#f8d7da',
                          border: '1px solid #f5c6cb',
                          color: '#721c24',
                          padding: '6px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p style={{ marginTop: 8, marginBottom: 0, color: '#343a40' }}>{entry.message}</p>
                  {entry.metadata && (
                    <pre
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        background: '#fff',
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid #dee2e6',
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
