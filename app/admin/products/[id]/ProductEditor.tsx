"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

type Product = Record<string, unknown>;

function toStringValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  return String(value);
}

export default function ProductEditor({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        product?: Product;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Failed to load product");
        setProduct(null);
        return;
      }
      const p = data.product ?? null;
      setProduct(p);
      setName(toStringValue(p?.Name));
      setCategory(toStringValue(p?.Category));
      setPrice(toStringValue(p?.Price));
      setImageUrl(toStringValue(p?.ImageUrl ?? p?.imageUrl));
      setDescription(toStringValue(p?.Description ?? p?.description));
    } catch {
      setError("Failed to load product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name,
          Category: category,
          Price: price.trim() === "" ? undefined : Number(price),
          ImageUrl: imageUrl.trim() === "" ? null : imageUrl,
          Description: description.trim() === "" ? null : description,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        product?: Product;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || "Failed to save product");
        return;
      }

      setProduct(data.product ?? null);
    } catch {
      setError("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to delete product");
        return;
      }
      window.location.href = "/admin/products";
    } catch {
      setError("Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/products">← Back to Admin Products</Link>
      </div>

      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Edit Product</h1>
      <div style={{ marginBottom: "1rem", color: "#555" }}>ProductID: {id}</div>

      {loading ? <div>Loading...</div> : null}

      {!loading && !product ? <div>Not found.</div> : null}

      {error ? (
        <div style={{ marginBottom: "0.75rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      {product ? (
        <form onSubmit={save}>
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
            <div style={{ marginBottom: "0.25rem" }}>Image URL</div>
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
                  maxWidth: "360px",
                  height: "auto",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                  display: "block",
                }}
              />
            </div>
          ) : null}

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            <div style={{ marginBottom: "0.25rem" }}>Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #111",
                background: saving ? "#ddd" : "#111",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={remove}
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #b91c1c",
                background: "#fff",
                color: "#b91c1c",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
