import React, { useEffect, useMemo, useState } from 'react';
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

export default function Graphs() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeForm, setNodeForm] = useState({ label: '', properties: '' });
  const [edgeForm, setEdgeForm] = useState({ sourceId: '', targetId: '', label: '', properties: '', directed: true });
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetNodeForm = () => setNodeForm({ label: '', properties: '' });
  const resetEdgeForm = () => setEdgeForm({ sourceId: '', targetId: '', label: '', properties: '', directed: true });

  const parseRowJson = (value) => {
    if (value === null || value === undefined || value === '') return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      setStatus('Stored JSON is invalid: ' + error.message);
      return null;
    }
  };

  const refreshGraphData = async () => {
    setIsLoading(true);
    setStatus('');
    const nodeResult = await window.api.database.query(
      'SELECT id, label, properties FROM nodes ORDER BY id ASC',
    );
    const edgeResult = await window.api.database.query(
      'SELECT id, source_id, target_id, label, properties, directed FROM edges ORDER BY id ASC',
    );

    if (!nodeResult.success) {
      setStatus(nodeResult.message);
      setNodes([]);
      setEdges([]);
    } else if (!edgeResult.success) {
      setStatus(edgeResult.message);
      const parsedNodes = (nodeResult.data ?? []).map((node) => ({
        ...node,
        properties: parseRowJson(node.properties),
      }));
      setNodes(parsedNodes);
      setEdges([]);
    } else {
      const parsedNodes = (nodeResult.data ?? []).map((node) => ({
        ...node,
        properties: parseRowJson(node.properties),
      }));
      const parsedEdges = (edgeResult.data ?? []).map((edge) => ({
        ...edge,
        properties: parseRowJson(edge.properties),
      }));
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    refreshGraphData();
  }, []);

  const parseJson = (value, context) => {
    if (!value.trim()) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      setStatus(`${context} JSON invalid: ${error.message}`);
      throw error;
    }
  };

  const handleNodeSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    const properties = (() => {
      try {
        return parseJson(nodeForm.properties || '', 'Node properties');
      } catch {
        return undefined;
      }
    })();

    if (properties === undefined) {
      return;
    }

    if (editingNodeId) {
      const propertiesPayload = properties ? JSON.stringify(properties) : null;
      const result = await window.api.database.query(
        'UPDATE nodes SET label = ?, properties = ? WHERE id = ?',
        [nodeForm.label || null, propertiesPayload, editingNodeId],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setEditingNodeId(null);
    } else {
      const propertiesPayload = properties ? JSON.stringify(properties) : null;
      const result = await window.api.database.query(
        'INSERT INTO nodes (label, properties) VALUES (?, ?)',
        [nodeForm.label || null, propertiesPayload],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
    }

    resetNodeForm();
    refreshGraphData();
  };

  const handleEdgeSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    if (!edgeForm.sourceId || !edgeForm.targetId) {
      setStatus('Source and target nodes are required');
      return;
    }

    const properties = (() => {
      try {
        return parseJson(edgeForm.properties || '', 'Edge properties');
      } catch {
        return undefined;
      }
    })();

    if (properties === undefined) {
      return;
    }

    if (editingEdgeId) {
      const propertiesPayload = properties ? JSON.stringify(properties) : null;
      const result = await window.api.database.query(
        'UPDATE edges SET source_id = ?, target_id = ?, label = ?, properties = ?, directed = ? WHERE id = ?',
        [
          Number(edgeForm.sourceId),
          Number(edgeForm.targetId),
          edgeForm.label || null,
          propertiesPayload,
          edgeForm.directed,
          editingEdgeId,
        ],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
      setEditingEdgeId(null);
    } else {
      const propertiesPayload = properties ? JSON.stringify(properties) : null;
      const result = await window.api.database.query(
        'INSERT INTO edges (source_id, target_id, label, properties, directed) VALUES (?, ?, ?, ?, ?)',
        [
          Number(edgeForm.sourceId),
          Number(edgeForm.targetId),
          edgeForm.label || null,
          propertiesPayload,
          edgeForm.directed,
        ],
      );
      if (!result.success) {
        setStatus(result.message);
        return;
      }
    }

    resetEdgeForm();
    refreshGraphData();
  };

  const handleNodeEdit = (node) => {
    setEditingNodeId(node.id);
    setNodeForm({
      label: node.label ?? '',
      properties: node.properties ? JSON.stringify(node.properties, null, 2) : '',
    });
  };

  const handleEdgeEdit = (edge) => {
    setEditingEdgeId(edge.id);
    setEdgeForm({
      sourceId: edge.source_id,
      targetId: edge.target_id,
      label: edge.label ?? '',
      properties: edge.properties ? JSON.stringify(edge.properties, null, 2) : '',
      directed: edge.directed ?? true,
    });
  };

  const handleNodeDelete = async (id) => {
    setStatus('');
    const result = await window.api.database.query('DELETE FROM nodes WHERE id = ?', [id]);
    if (!result.success) {
      setStatus(result.message);
      return;
    }
    if (editingNodeId === id) {
      resetNodeForm();
      setEditingNodeId(null);
    }
    refreshGraphData();
  };

  const handleEdgeDelete = async (id) => {
    setStatus('');
    const result = await window.api.database.query('DELETE FROM edges WHERE id = ?', [id]);
    if (!result.success) {
      setStatus(result.message);
      return;
    }
    if (editingEdgeId === id) {
      resetEdgeForm();
      setEditingEdgeId(null);
    }
    refreshGraphData();
  };

  const nodeOptions = useMemo(() => nodes.map((node) => ({ value: node.id, label: node.label || `Node ${node.id}` })), [nodes]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, color: '#212529' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Graphs</h1>
        <Link to="/dashboard" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>
      <p style={{ color: '#6c757d', marginTop: 8 }}>
        Manage graph data using the <code>nodes</code> and <code>edges</code> tables defined by migrations.
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
        <form onSubmit={handleNodeSubmit} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingNodeId ? 'Edit node' : 'Add node'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Label</div>
              <input
                type="text"
                value={nodeForm.label}
                onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
                style={inputStyle}
                placeholder="service"
              />
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Properties (JSON)</div>
              <textarea
                value={nodeForm.properties}
                onChange={(e) => setNodeForm({ ...nodeForm, properties: e.target.value })}
                style={{ ...inputStyle, minHeight: 120, fontFamily: 'monospace' }}
                placeholder='{ "name": "payments" }'
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
              {editingNodeId ? 'Update node' : 'Create node'}
            </button>
            {editingNodeId && (
              <button
                type="button"
                onClick={() => {
                  resetNodeForm();
                  setEditingNodeId(null);
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
          <h2 style={{ marginTop: 0 }}>Nodes</h2>
          {isLoading ? (
            <p style={{ color: '#6c757d' }}>Loading graph data...</p>
          ) : nodes.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No nodes created yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {nodes.map((node) => (
                <li
                  key={node.id}
                  style={{
                    padding: 12,
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Node #{node.id}</div>
                      <div style={{ color: '#6c757d', fontSize: 13 }}>{node.label || 'No label'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleNodeEdit(node)}
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
                        onClick={() => handleNodeDelete(node.id)}
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
                  {node.properties && (
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
                      {JSON.stringify(node.properties, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <form onSubmit={handleEdgeSubmit} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingEdgeId ? 'Edit edge' : 'Add edge'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Source node</div>
              <select
                value={edgeForm.sourceId}
                onChange={(e) => setEdgeForm({ ...edgeForm, sourceId: e.target.value })}
                style={{ ...inputStyle, height: 38 }}
              >
                <option value="">Select a node</option>
                {nodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} (#{option.value})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Target node</div>
              <select
                value={edgeForm.targetId}
                onChange={(e) => setEdgeForm({ ...edgeForm, targetId: e.target.value })}
                style={{ ...inputStyle, height: 38 }}
              >
                <option value="">Select a node</option>
                {nodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} (#{option.value})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Label</div>
              <input
                type="text"
                value={edgeForm.label}
                onChange={(e) => setEdgeForm({ ...edgeForm, label: e.target.value })}
                style={inputStyle}
                placeholder="depends_on"
              />
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Directed</div>
              <select
                value={edgeForm.directed ? 'true' : 'false'}
                onChange={(e) => setEdgeForm({ ...edgeForm, directed: e.target.value === 'true' })}
                style={{ ...inputStyle, height: 38 }}
              >
                <option value="true">Directed</option>
                <option value="false">Undirected</option>
              </select>
            </label>
            <label>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Properties (JSON)</div>
              <textarea
                value={edgeForm.properties}
                onChange={(e) => setEdgeForm({ ...edgeForm, properties: e.target.value })}
                style={{ ...inputStyle, minHeight: 120, fontFamily: 'monospace' }}
                placeholder='{ "weight": 0.8 }'
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
              {editingEdgeId ? 'Update edge' : 'Create edge'}
            </button>
            {editingEdgeId && (
              <button
                type="button"
                onClick={() => {
                  resetEdgeForm();
                  setEditingEdgeId(null);
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
          <h2 style={{ marginTop: 0 }}>Edges</h2>
          {isLoading ? (
            <p style={{ color: '#6c757d' }}>Loading graph data...</p>
          ) : edges.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No edges created yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {edges.map((edge) => (
                <li
                  key={edge.id}
                  style={{
                    padding: 12,
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Edge #{edge.id}</div>
                      <div style={{ color: '#6c757d', fontSize: 13 }}>
                        {edge.source_id} → {edge.target_id} {edge.directed ? '' : '(undirected)'}
                      </div>
                      {edge.label && (
                        <div style={{ color: '#0d6efd', fontSize: 13 }}>{edge.label}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdgeEdit(edge)}
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
                        onClick={() => handleEdgeDelete(edge.id)}
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
                  {edge.properties && (
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
                      {JSON.stringify(edge.properties, null, 2)}
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
