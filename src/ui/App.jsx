import React from 'react'

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Electron + Vite + React (JavaScript)</h1>
      <p>If you can read this, everything is wired correctly.</p>
      <pre style={{ marginTop: 16, opacity: 0.7 }}>
        window.api?.ping() =&gt; {typeof window !== "undefined" && window.api ? window.api.ping() : "no preload api"}
      </pre>
    </div>
  )  
}
