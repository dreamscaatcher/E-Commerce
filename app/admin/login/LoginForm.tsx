"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = searchParams.get("from") || "/admin/products";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.replace(from);
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Username</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Password</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      {error ? (
        <div style={{ marginBottom: "0.75rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          border: "1px solid #111",
          background: loading ? "#ddd" : "#111",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

