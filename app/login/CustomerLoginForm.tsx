"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLoginForm({
  initialEmail,
  redirectTo,
}: {
  initialEmail?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email.trim(),
          Password: password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const safeNext =
        typeof redirectTo === "string" && redirectTo.startsWith("/")
          ? redirectTo
          : "";
      router.replace(safeNext || "/products");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error ? (
        <div style={{ marginBottom: "1rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <label style={{ display: "block", marginBottom: "0.85rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Email</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="email"
          style={{
            width: "100%",
            padding: "0.55rem 0.75rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.85rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Password</div>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "0.55rem 0.75rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "0.6rem 0.9rem",
          borderRadius: "10px",
          border: "1px solid #111",
          background: submitting ? "#ddd" : "#111",
          color: "#fff",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
