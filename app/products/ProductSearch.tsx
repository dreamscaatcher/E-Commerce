"use client";

import React, { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

type Product = {
  ProductID?: { low?: number } | number | string;
  Name?: string;
  Category?: string;
  ImageUrl?: string;
  imageUrl?: string;
  Price?: number | string;
};

type ProductSearchProps = {
  products?: Product[];
  initialQuery?: string;
  initialCategory?: string;
};

function toSearchText(value: unknown) {
  if (value == null) return "";
  return String(value).toLowerCase();
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object") {
    const maybeLow = (value as { low?: unknown }).low;
    if (typeof maybeLow === "number") return maybeLow;
    if (typeof maybeLow === "string") return Number(maybeLow);
  }
  return Number.NaN;
}

export default function ProductSearch({
  products,
  initialQuery,
  initialCategory,
}: ProductSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [selectedValue, setSelectedValue] = useState(
    initialCategory ? `category:${initialCategory}` : ""
  );
  const normalizedQuery = query.trim().toLowerCase();
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const selectedCategory = selectedValue.startsWith("category:")
    ? selectedValue.slice("category:".length)
    : "";
  const normalizedCategory = selectedCategory.trim().toLowerCase();

  useEffect(() => {
    const url = new URL(window.location.href);

    if (query.trim()) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }

    if (selectedCategory.trim()) {
      url.searchParams.set("category", selectedCategory);
    } else {
      url.searchParams.delete("category");
    }

    window.history.replaceState(null, "", url.toString());
  }, [query, selectedCategory]);

  const getProductId = (product: Product) => {
    if (typeof product.ProductID === "object") {
      return product.ProductID?.low;
    }
    return product.ProductID;
  };

  const filtered = useMemo(() => {
    const categoryFiltered = normalizedCategory
      ? safeProducts.filter((p) => {
          const category = p.Category ? String(p.Category) : "Uncategorized";
          return toSearchText(category) === normalizedCategory;
        })
      : safeProducts;

    if (!normalizedQuery) return categoryFiltered;
    return categoryFiltered.filter((p) => {
      return (
        toSearchText(getProductId(p)).includes(normalizedQuery) ||
        toSearchText(p.Name).includes(normalizedQuery) ||
        toSearchText(p.Category).includes(normalizedQuery) ||
        toSearchText(p.Price).includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, safeProducts, normalizedCategory]);

  const sortedByName = useMemo(() => {
    return [...safeProducts].sort((a, b) =>
      toSearchText(a.Name).localeCompare(toSearchText(b.Name))
    );
  }, [safeProducts]);

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, Product[]>();
    sortedByName.forEach((product) => {
      const category = product.Category ? String(product.Category) : "Uncategorized";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(product);
    });
    return Array.from(groups.entries()).sort((a, b) =>
      toSearchText(a[0]).localeCompare(toSearchText(b[0]))
    );
  }, [sortedByName]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedValue(value);
    if (value.startsWith("product:")) {
      const id = value.slice("product:".length);
      if (id) window.location.href = `/products/${id}`;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by ID, name, category, or price"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "1rem",
          }}
        />
        <select
          value={selectedValue}
          onChange={handleSelectChange}
          style={{
            minWidth: "220px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "1rem",
            background: "white",
          }}
        >
          <option value="">All products</option>
          {groupedByCategory.map(([category, items]) => (
            <React.Fragment key={category}>
              <option
                value={`category:${category}`}
                style={{
                  fontWeight: 700,
                  color: "#1d4ed8",
                  backgroundColor: "#eff6ff",
                }}
              >
                {category}
              </option>
              {items.map((p, index) => {
                const productId = getProductId(p);
                if (productId == null || productId === "") return null;
                return (
                  <option
                    key={`${category}:${String(productId)}:${index}`}
                    value={`product:${String(productId)}`}
                  >
                    {p.Name || `Product ${productId}`}
                  </option>
                );
              })}
            </React.Fragment>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        {filtered.length === 0 ? (
          <div>No products match your search.</div>
        ) : (
          filtered.map((p, index) => {
            const productId = getProductId(p);
            const imageSrc =
              typeof p.ImageUrl === "string" && p.ImageUrl.trim()
                ? p.ImageUrl
                : typeof p.imageUrl === "string" && p.imageUrl.trim()
                  ? p.imageUrl
                  : "";
            const productIdString = productId == null ? "" : String(productId);
            const priceNumber = toNumber((p as { Price?: unknown }).Price);
            const safePrice = Number.isFinite(priceNumber) ? priceNumber : 0;
            const safeName = p.Name?.trim() ? p.Name : `Product ${productIdString || index + 1}`;

            return (
              <div
                key={productId ?? index}
                style={{
                  border: "1px solid #ddd",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={p.Name ? `${p.Name} image` : "Product image"}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #eee",
                      display: "block",
                      marginBottom: "0.75rem",
                    }}
                  />
                ) : null}
                <a
                  href={productIdString ? `/products/${productIdString}` : "/products"}
                  style={{ textDecoration: "none", color: "black" }}
                >
                  <h2 style={{ margin: 0 }}>{safeName}</h2>
                </a>

                <p style={{ margin: "0.5rem 0" }}>
                  <strong>Category:</strong> {p.Category}
                </p>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>Price:</strong> €{p.Price}
                </p>
                <AddToCartButton
                  item={{
                    id: productIdString,
                    name: safeName,
                    price: safePrice,
                    imageUrl: imageSrc || undefined,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
