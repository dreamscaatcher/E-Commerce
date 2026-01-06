"use client";

import React, { useMemo, useState } from "react";
import { addToCart } from "../lib/cart";

type AddToCartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
};

type AddToCartButtonProps = {
  item: AddToCartItem;
  quantity?: number;
};

export default function AddToCartButton({
  item,
  quantity = 1,
}: AddToCartButtonProps) {
  const [wasAdded, setWasAdded] = useState(false);

  const disabled = useMemo(() => {
    return (
      !item ||
      typeof item.id !== "string" ||
      item.id.trim() === "" ||
      typeof item.name !== "string" ||
      item.name.trim() === "" ||
      typeof item.price !== "number" ||
      !Number.isFinite(item.price)
    );
  }, [item]);

  const label = wasAdded ? "Added" : "Add to Cart";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        addToCart(item, quantity);
        setWasAdded(true);
        window.setTimeout(() => setWasAdded(false), 1200);
      }}
      style={{
        marginTop: "0.75rem",
        padding: "0.55rem 0.9rem",
        borderRadius: "10px",
        border: `1px solid ${wasAdded ? "#16a34a" : "var(--foreground)"}`,
        background: wasAdded ? "#16a34a" : "var(--foreground)",
        color: wasAdded ? "#fff" : "var(--background)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
