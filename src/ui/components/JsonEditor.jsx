import React, { useEffect, useState } from 'react';

const containerStyle = {
  border: '1px solid #ced4da',
  borderRadius: 6,
  padding: 12,
  backgroundColor: '#f8f9fa',
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 140px 1fr',
  gap: 8,
  alignItems: 'center',
};

const labelStyle = {
  fontWeight: 600,
  marginBottom: 4,
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #ced4da',
};

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const createEmptyEntry = () => ({
  id: newId(),
  key: '',
  type: 'string',
  value: '',
});

export default function JsonEditor({ value, onChange, placeholder = '{ "name": "service" }' }) {
  const [entries, setEntries] = useState([createEmptyEntry()]);
  const [error, setError] = useState('');
  const [serializedJson, setSerializedJson] = useState('');

  const parseIncomingValue = () => {
    if (!value || !value.trim()) {
      return [createEmptyEntry()];
    }

    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return [createEmptyEntry()];
      }

      return Object.entries(parsed).map(([key, val]) => {
        if (Array.isArray(val)) {
          return { id: newId(), key, type: 'array', value: JSON.stringify(val) };
        }
        if (val !== null && typeof val === 'object') {
          return { id: newId(), key, type: 'object', value: JSON.stringify(val, null, 2) };
        }
        if (typeof val === 'number') {
          return { id: newId(), key, type: 'number', value: String(val) };
        }
        return { id: newId(), key, type: 'string', value: String(val) };
      });
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      return [createEmptyEntry()];
    }
  };

  useEffect(() => {
    setEntries(parseIncomingValue());
  }, [value]);

  useEffect(() => {
    const jsonObject = {};
    let errorMessage = '';

    for (const entry of entries) {
      if (!entry.key.trim()) continue;

      if (entry.type === 'number') {
        const num = Number(entry.value);
        if (Number.isNaN(num)) {
          errorMessage = `Value for "${entry.key}" must be numeric.`;
          break;
        }
        jsonObject[entry.key] = num;
      } else if (entry.type === 'string') {
        jsonObject[entry.key] = entry.value;
      } else if (entry.type === 'array' || entry.type === 'object') {
        try {
          const parsed = JSON.parse(entry.value || (entry.type === 'array' ? '[]' : '{}'));
          if (entry.type === 'array' && !Array.isArray(parsed)) {
            errorMessage = `Value for "${entry.key}" must be an array.`;
            break;
          }
          if (entry.type === 'object' && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) {
            errorMessage = `Value for "${entry.key}" must be an object.`;
            break;
          }
          jsonObject[entry.key] = parsed;
        } catch (err) {
          errorMessage = `Invalid JSON for "${entry.key}": ${err.message}`;
          break;
        }
      }
    }

    if (errorMessage) {
      setError(errorMessage);
      setSerializedJson('');
      onChange('');
      return;
    }

    const stringified = Object.keys(jsonObject).length ? JSON.stringify(jsonObject, null, 2) : '';
    setError('');
    setSerializedJson(stringified);
    onChange(stringified);
  }, [entries, onChange]);

  const updateEntry = (id, changes) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));
  };

  const addEntry = () => {
    setEntries((current) => [...current, createEmptyEntry()]);
  };

  const removeEntry = (id) => {
    setEntries((current) => (current.length > 1 ? current.filter((entry) => entry.id !== id) : current));
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...labelStyle, marginBottom: 8 }}>JSON properties</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={rowStyle}>
              <input
                type="text"
                value={entry.key}
                onChange={(e) => updateEntry(entry.id, { key: e.target.value })}
                placeholder="key"
                style={inputStyle}
              />
              <select
                value={entry.type}
                onChange={(e) => updateEntry(entry.id, { type: e.target.value })}
                style={{ ...inputStyle, height: 38 }}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </select>
              {entry.type === 'string' || entry.type === 'number' ? (
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => updateEntry(entry.id, { value: e.target.value })}
                  placeholder={entry.type === 'number' ? '42' : 'value'}
                  style={inputStyle}
                />
              ) : (
                <textarea
                  value={entry.value}
                  onChange={(e) => updateEntry(entry.id, { value: e.target.value })}
                  placeholder={entry.type === 'array' ? '[1, 2]' : '{ "nested": true }'}
                  style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace' }}
                />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  color: '#721c24',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          type="button"
          onClick={addEntry}
          style={{
            backgroundColor: '#0d6efd',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Add property
        </button>
        <div style={{ color: '#6c757d', alignSelf: 'center', fontSize: 13 }}>
          {placeholder}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: 6,
            border: '1px solid #f5c2c7',
            background: '#f8d7da',
            color: '#842029',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {serializedJson && !error && (
        <pre
          style={{
            marginTop: 10,
            marginBottom: 0,
            background: '#fff',
            padding: 10,
            borderRadius: 6,
            border: '1px solid #dee2e6',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          {serializedJson}
        </pre>
      )}
    </div>
  );
}
