import React from "react";
import Link from "next/link";
import AddToCartButton from "@/app/components/AddToCartButton";

async function getProduct(id: string) {
  const res = await fetch(`http://localhost:3000/api/products/${id}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product } = await getProduct(id);

  if (!product) {
    return <div style={{ padding: "2rem" }}>Product not found.</div>;
  }

  const productId =
    typeof product.ProductID === "object"
      ? product.ProductID?.low
      : product.ProductID;
  const imageUrl =
    typeof product.ImageUrl === "string" && product.ImageUrl.trim()
      ? product.ImageUrl
      : typeof product.imageUrl === "string" && product.imageUrl.trim()
        ? product.imageUrl
        : "";
  const description =
    typeof product.Description === "string" && product.Description.trim()
      ? product.Description
      : typeof product.description === "string" && product.description.trim()
        ? product.description
        : "";
  const price =
    typeof product.Price === "number"
      ? product.Price
      : typeof product.Price === "string"
        ? Number(product.Price)
        : Number.NaN;
  const safePrice = Number.isFinite(price) ? price : 0;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        {product.Name}
      </h1>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.Name ? `${product.Name} image` : "Product image"}
          style={{
            width: "100%",
            maxWidth: "520px",
            height: "auto",
            borderRadius: "8px",
            border: "1px solid #eee",
            display: "block",
            marginBottom: "1rem",
          }}
        />
      ) : null}

      <p><strong>Category:</strong> {product.Category}</p>
      <p><strong>Price:</strong> €{product.Price}</p>
      {description ? <p><strong>Description:</strong> {description}</p> : null}
      <p><strong>Product ID:</strong> {productId}</p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <AddToCartButton
          item={{
            id,
            name: product.Name || `Product ${id}`,
            price: safePrice,
            imageUrl: imageUrl || undefined,
          }}
        />
        <Link
          href="/cart"
          style={{
            display: "inline-block",
            marginTop: "0.75rem",
            padding: "0.55rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          View Cart
        </Link>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            marginTop: "0.75rem",
            padding: "0.55rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
          }}
        >
          ← Back to Products
        </Link>
      </div>
    </div>
  );
}
