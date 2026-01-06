import React from "react";
import ProductSearch from "./ProductSearch";

type SearchParams = Record<string, string | string[] | undefined>;

async function getProducts() {
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });
  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialQuery = typeof sp?.q === "string" ? sp.q : "";
  const initialCategory = typeof sp?.category === "string" ? sp.category : "";
  const { products } = await getProducts();

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Products</h1>
      <ProductSearch
        products={products}
        initialQuery={initialQuery}
        initialCategory={initialCategory}
      />
    </div>
  );
}
