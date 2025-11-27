import React from 'react';

export default function Dashboard() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>The dashboard will provide an overview of application activity and model status.</p>
      <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f0f4f8', borderRadius: 8 }}>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Placeholder content: stats, activity logs, and model summaries will appear here.
        </p>
      </div>
    </div>
  );
}
