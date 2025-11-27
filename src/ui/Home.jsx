import React from 'react';

export default function Home() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Electron + Vite + React (JavaScript)</h1>
      <p>If you can read this, everything is wired correctly.</p>
      <pre style={{ marginTop: 16, opacity: 0.7 }}>
        window.api?.database =&gt; {typeof window !== "undefined" && window.api?.database ? "Available" : "Not available"}
      </pre>
    </div>
  );
}
