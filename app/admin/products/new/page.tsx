import React from "react";
import ProductCreateForm from "./ProductCreateForm";

export default function NewProductPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "520px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>New Product</h1>
      <ProductCreateForm />
    </div>
  );
}

