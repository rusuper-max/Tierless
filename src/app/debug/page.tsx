"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [email, setEmail] = useState("test@dev.local");
  const [cookiesStr, setCookiesStr] = useState("");

  async function checkStatus() {
    const r = await fetch("/api/auth/status", {
      credentials: "include",
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    setStatus(j);
    setCookiesStr(document.cookie || "");
  }

  async function devLogin() {
    await fetch("/api/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await checkStatus();
    window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
  }

  async function devLogout() {
    await fetch("/api/dev-logout", { method: "POST" });
    await checkStatus();
    window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
  }

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <main style={{ padding: 20, fontFamily: "ui-sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Session Debug (Client)</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          style={{
            padding: "8px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            minWidth: 260,
          }}
        />
        <button onClick={devLogin}  style={btnStyle}>Dev Login</button>
        <button onClick={devLogout} style={btnStyle}>Dev Logout</button>
        <button onClick={checkStatus} style={btnStyle}>Check /api/auth/status</button>
      </div>

      <p style={{ opacity: 0.8 }}>Client status (CSR):</p>
      <pre style={preStyle}>{JSON.stringify(status, null, 2)}</pre>

      <p style={{ opacity: 0.8 }}>document.cookie:</p>
      <pre style={preStyle}>{cookiesStr || "(empty)"}</pre>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #22d3ee",
  borderRadius: 8,
  background: "#06141d",
  color: "#e6fbff",
  cursor: "pointer",
};

const preStyle: React.CSSProperties = {
  background: "#0b1220",
  color: "#cfe9ff",
  padding: 12,
  borderRadius: 8,
  overflow: "auto",
};