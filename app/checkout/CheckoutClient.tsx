"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearCart,
  getCartItems,
  getCartTotal,
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

type CheckoutClientProps = {
  customerEmail: string;
  initialShippingAddress: string;
};

type OrderResponse = {
  ok?: boolean;
  orderId?: string | number | null;
  error?: string;
};

type PaymentResponse = {
  ok?: boolean;
  paymentId?: string | number | null;
  error?: string;
};

function normalizeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export default function CheckoutClient({
  customerEmail,
  initialShippingAddress,
}: CheckoutClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState(
    initialShippingAddress ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState("DEV_CARD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getCartItems());
    refresh();
    return subscribeToCartUpdates(refresh);
  }, []);

  const total = useMemo(() => getCartTotal(items), [items]);

  const placeOrder = async () => {
    setError(null);
    setSuccess(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!shippingAddress.trim()) {
      setError("Shipping address is required.");
      return;
    }

    setSubmitting(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: shippingAddress.trim(),
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });

      const orderData = (await orderRes.json().catch(() => ({}))) as OrderResponse;
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create order.");
        return;
      }

      const orderId = normalizeId(orderData.orderId);
      if (!orderId) {
        setError("Order created, but order ID is missing.");
        return;
      }

      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          method: paymentMethod,
        }),
      });

      const payData = (await payRes.json().catch(() => ({}))) as PaymentResponse;
      if (!payRes.ok) {
        setError(payData.error || "Payment failed.");
        return;
      }

      clearCart();
      setSuccess({ orderId });
      router.refresh();
    } catch {
      setError("Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
          color: "#166534",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Order placed!</h2>
        <p style={{ marginBottom: "1rem" }}>
          Your order <strong>#{success.orderId}</strong> was created and marked
          as paid (dev simulation).
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <p style={{ color: "#444" }}>
          Your cart is empty. Add some products before checking out.
        </p>
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
      {error ? (
        <div style={{ marginBottom: "1rem", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        <div style={{ marginBottom: "0.5rem", color: "#444" }}>
          Logged in as <strong>{customerEmail}</strong>
        </div>

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
              background: "#fff",
            }}
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: "0.25rem" }}>Payment Method (dev)</div>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "320px",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            <option value="DEV_CARD">Dev Card</option>
            <option value="DEV_CASH">Cash on delivery (dev)</option>
            <option value="DEV_BANK">Bank transfer (dev)</option>
          </select>
        </label>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.5rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Item
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Link
                    href={`/products/${encodeURIComponent(item.id)}`}
                    style={{ color: "#111", textDecoration: "none" }}
                  >
                    {item.name}
                  </Link>
                </td>
                <td
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderBottom: "1px solid #f0f0f0",
                    textAlign: "right",
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderBottom: "1px solid #f0f0f0",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.price)}
                </td>
                <td
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderBottom: "1px solid #f0f0f0",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
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
            href="/cart"
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
            Back to Cart
          </Link>

          <button
            type="button"
            onClick={placeOrder}
            disabled={submitting}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #111",
              background: submitting ? "#ddd" : "#111",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting
              ? "Placing order..."
              : `Place Order (${formatCurrency(total)})`}
          </button>
        </div>

        <div
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "12px",
            border: "1px solid #eee",
            background: "#fafafa",
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
