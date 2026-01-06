import React from "react";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Shopping Cart</h1>
      <CartClient />
    </div>
  );
}

