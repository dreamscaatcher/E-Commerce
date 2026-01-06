"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CreatedCustomer = Record<string, unknown> | null;

function getCustomerId(customer: CreatedCustomer): string {
  if (!customer) return "";
  const id = (customer.CustomerID ?? customer.customerId) as unknown;
  if (id && typeof id === "object") {
    const maybe = id as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

export default function CustomerRegistrationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<CreatedCustomer>(null);

  const createdId = useMemo(
    () => getCustomerId(createdCustomer),
    [createdCustomer]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreatedCustomer(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!shippingAddress.trim()) {
      setError("Shipping address is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const emailValue = email.trim();
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name.trim(),
          Email: emailValue,
          ShippingAddress: shippingAddress.trim(),
          Password: password,
          Phone: phone.trim(),
          City: city.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        customer?: CreatedCustomer;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setCreatedCustomer(data.customer ?? null);
      router.replace(
        `/check-email?email=${encodeURIComponent(emailValue)}`
      );
      router.refresh();
    } catch {
      setError("Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {createdCustomer ? (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          Registration successful{createdId ? ` (Customer ID: ${createdId})` : ""}.
        </div>
      ) : null}

      {error ? (
        <div style={{ marginBottom: "1rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <form onSubmit={submit}>
        <label style={{ display: "block", marginBottom: "0.85rem" }}>
          <div style={{ marginBottom: "0.25rem" }}>Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </label>

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
          <div style={{ marginBottom: "0.25rem" }}>Shipping Address</div>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            required
            autoComplete="shipping street-address"
            rows={3}
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
              resize: "vertical",
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
            autoComplete="new-password"
            minLength={8}
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "0.85rem" }}>
          <div style={{ marginBottom: "0.25rem" }}>Retype Password</div>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "0.85rem",
            marginBottom: "0.85rem",
          }}
        >
          <label style={{ display: "block" }}>
            <div style={{ marginBottom: "0.25rem" }}>Phone (optional)</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />
          </label>

          <label style={{ display: "block" }}>
            <div style={{ marginBottom: "0.25rem" }}>City (optional)</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
            {submitting ? "Submitting..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
}
