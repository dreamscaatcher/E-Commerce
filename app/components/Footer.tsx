"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function Footer() {
  const pathname = usePathname() ?? "/";
  if (isAdminPath(pathname)) return null;

  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid #eee",
        background: "#fff",
      }}
    >
      <div
        style={{
          padding: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "2.5rem",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: "220px" }}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
            Neo4j Dashboard
          </div>
          <p style={{ marginTop: "0.5rem", marginBottom: 0, color: "#444" }}>
            Browse products, manage your cart, and checkout with confidence.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2.75rem" }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.6rem" }}>Shop</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <Link href="/" className="navLink">
                Home
              </Link>
              <Link href="/products" className="navLink">
                Products
              </Link>
              <Link href="/cart" className="navLink">
                Cart
              </Link>
              <Link href="/checkout" className="navLink">
                Checkout
              </Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.6rem" }}>
              Account
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <Link href="/login" className="navLink">
                Login
              </Link>
              <Link href="/register" className="navLink">
                Register
              </Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.6rem" }}>Help</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <a href="mailto:support@example.com" className="navLink">
                support@example.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "1rem 2rem",
          borderTop: "1px solid #eee",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "space-between",
          color: "#444",
          fontSize: "0.875rem",
        }}
      >
        <span>© {year} Neo4j Dashboard. All rights reserved.</span>
        <span>Built with Next.js + Neo4j</span>
      </div>
    </footer>
  );
}

