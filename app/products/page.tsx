import React from "react";
import { headers } from "next/headers";
import ProductSearch from "./ProductSearch";

type SearchParams = Record<string, string | string[] | undefined>;

async function getBaseUrl() {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/+$/, "");

  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

async function getProducts(baseUrl: string) {
  const url = new URL("/api/products", baseUrl);
  const res = await fetch(url, {
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
  const { products } = await getProducts(await getBaseUrl());

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
