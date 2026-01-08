"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  clearCart,
  getCartItems,
  getCartTotal,
  removeFromCart,
  setCartQuantity,
  subscribeToCartUpdates,
  type CartItem,
} from "../lib/cart";

function formatCurrency(value: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
    }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(getCartItems());
    refresh();
    return subscribeToCartUpdates(refresh);
  }, []);

  const total = useMemo(() => getCartTotal(items), [items]);

  if (items.length === 0) {
    return (
      <div>
        <p style={{ color: "var(--muted-foreground)" }}>Your cart is empty.</p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            padding: "0.6rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.5rem",
                  borderBottom: "1px solid #ddd",
                  width: "84px",
                }}
              >
                Item
              </th>
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Name
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Price
              </th>
              <th style={{ textAlign: "center", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Qty
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Subtotal
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const subtotal = item.price * item.quantity;
              return (
                <tr key={item.id}>
                  <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name ? `${item.name} image` : "Product image"}
                        style={{
                          width: "56px",
                          height: "56px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #eee",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "8px",
                          border: "1px solid #eee",
                          background: "#fafafa",
                        }}
                      />
                    )}
                  </td>
                  <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                    <Link
                      href={`/products/${encodeURIComponent(item.id)}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderBottom: "1px solid #f0f0f0",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={() => setCartQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity for ${item.name}`}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          background: "#fff",
                          color: "#111",
                          cursor: "pointer",
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setCartQuantity(item.id, Number(e.target.value))
                        }
                        style={{
                          width: "64px",
                          textAlign: "center",
                          padding: "0.45rem 0.5rem",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          background: "#fff",
                          color: "#111",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setCartQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity for ${item.name}`}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          background: "#fff",
                          color: "#111",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderBottom: "1px solid #f0f0f0",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(subtotal)}
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderBottom: "1px solid #f0f0f0",
                      textAlign: "right",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: "0.45rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #b91c1c",
                        background: "#fff",
                        color: "#b91c1c",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: "1.25rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#111",
              textDecoration: "none",
            }}
          >
            Continue Shopping
          </Link>
          <Link
            href="/checkout"
            style={{
              display: "inline-block",
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={() => clearCart()}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#111",
              cursor: "pointer",
            }}
          >
            Clear Cart
          </button>
        </div>

        <div
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "12px",
            border: "1px solid #eee",
            background: "#fafafa",
            color: "#111",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Total: {formatCurrency(total)}
        </div>
      </div>
    </div>
  );
}
