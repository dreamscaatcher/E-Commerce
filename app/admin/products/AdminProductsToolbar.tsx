"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function AdminProductsToolbar() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link
          href="/admin/products/new"
          style={{
            display: "inline-block",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          + New Product
        </Link>
        <button
          type="button"
          onClick={() => router.refresh()}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
