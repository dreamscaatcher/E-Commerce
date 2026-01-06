"use client";

import Link from "next/link";
import React, { useState } from "react";

function extractId(value: unknown): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  return null;
}

export default function ProductCreateForm() {
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        Name: name,
        Category: category,
      };

      if (price.trim() !== "") payload.Price = Number(price);
      if (productId.trim() !== "") payload.ProductID = Number(productId);
      if (imageUrl.trim() !== "") payload.ImageUrl = imageUrl.trim();
      if (description.trim() !== "") payload.Description = description.trim();

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        product?: Record<string, unknown>;
      };

      if (!res.ok) {
        setError(data.error || "Failed to create product");
        return;
      }

      const createdId = extractId(data.product?.ProductID);
      window.location.href = createdId
        ? `/admin/products/${createdId}`
        : "/admin/products";
    } catch {
      setError("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Product ID (optional)</div>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          inputMode="numeric"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Category</div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Price</div>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Image URL (optional)</div>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </label>

      {imageUrl.trim() ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ marginBottom: "0.25rem", color: "#555" }}>
            Preview
          </div>
          <img
            src={imageUrl}
            alt={name ? `${name} preview` : "Product preview"}
            style={{
              width: "100%",
              maxWidth: "320px",
              height: "auto",
              borderRadius: "8px",
              border: "1px solid #eee",
              display: "block",
            }}
          />
        </div>
      ) : null}

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={{ marginBottom: "0.25rem" }}>Description (optional)</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            resize: "vertical",
          }}
        />
      </label>

      {error ? (
        <div style={{ marginBottom: "0.75rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.6rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid #111",
            background: loading ? "#ddd" : "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <Link
          href="/admin/products"
          style={{
            display: "inline-block",
            padding: "0.6rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
