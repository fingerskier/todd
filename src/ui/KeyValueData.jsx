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

export default function KeyValueData() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ key: '', value: '' });
  const [editingKey, setEditingKey] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => setForm({ key: '', value: '' });

  const refreshRecords = async () => {
    setIsLoading(true);
    setStatus('');
    const result = await window.api.database.query(
      'SELECT key, value, updated_at FROM kv ORDER BY key ASC',
    );
    if (result.success) {
      setRecords(result.data);
    } else {
      setStatus(result.message);
      setRecords([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshRecords();
  }, []);

  const parseValue = () => {
    if (!form.value.trim()) return null;
    try {
      return JSON.parse(form.value);
    } catch (error) {
      setStatus('Value must be valid JSON: ' + error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!form.key.trim()) {
      setStatus('Key is required');
      return;
    }

    let parsedValue;
    try {
      parsedValue = parseValue();
    } catch {
      return;
    }

    if (editingKey) {
      const result = await window.api.database.query(
        'UPDATE kv SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING key',
        [parsedValue, editingKey],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setEditingKey(null);
    } else {
      const result = await window.api.database.query(
        'INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW() RETURNING key',
        [form.key, parsedValue],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
    }

    resetForm();
    refreshRecords();
  };

  const handleEdit = (record) => {
    setForm({ key: record.key, value: record.value ? JSON.stringify(record.value, null, 2) : '' });
    setEditingKey(record.key);
  };

  const handleDelete = async (key) => {
    setStatus('');
    const result = await window.api.database.query('DELETE FROM kv WHERE key = $1', [key]);
    if (!result.success) {
      setStatus(result.message);
      return;
    }
    if (editingKey === key) {
      resetForm();
      setEditingKey(null);
    }
    refreshRecords();
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, color: '#212529' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Key/Value Data</h1>
        <Link to="/dashboard" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>
      <p style={{ color: '#6c757d', marginTop: 8 }}>
        Manage configuration-style key/value pairs stored in the <code>kv</code> table.
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
          <h2 style={{ marginTop: 0 }}>{editingKey ? 'Edit entry' : 'Add new entry'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Key</div>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                style={inputStyle}
                placeholder="feature_flag"
                disabled={Boolean(editingKey)}
              />
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Value</div>
              <input
                type="text"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                placeholder='{ "enabled": true }'
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
              {editingKey ? 'Update entry' : 'Create entry'}
            </button>
            {editingKey && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditingKey(null);
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
          <h2 style={{ marginTop: 0 }}>Stored entries</h2>
          {isLoading ? (
            <p style={{ color: '#6c757d' }}>Loading entries...</p>
          ) : records.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No entries created yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {records.map((record) => (
                <li
                  key={record.key}
                  style={{
                    padding: 12,
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{record.key}</div>
                      <div style={{ color: '#6c757d', fontSize: 13 }}>
                        Updated: {new Date(record.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(record)}
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
                        onClick={() => handleDelete(record.key)}
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
                  {record.value && (
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
                      {JSON.stringify(record.value, null, 2)}
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
