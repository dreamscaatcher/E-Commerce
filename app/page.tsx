import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import driver from "@/lib/neo4j";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer/session";
import CustomerLogoutButton from "./components/CustomerLogoutButton";

export const dynamic = "force-dynamic";

type CustomerSummary = {
  email: string;
  name?: string;
};

type ProductSummary = Record<string, unknown>;

type CategorySection = {
  category: string;
  products: ProductSummary[];
};

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

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

function getProductId(product: ProductSummary): string {
  return normalizeId(product.ProductID ?? product.productId ?? product.id);
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  if (value && typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return maybe.low;
  }
  return null;
}

function formatCurrency(value: unknown): string {
  const num = pickNumber(value);
  if (num == null) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
    }).format(num);
  } catch {
    return `€${num.toFixed(2)}`;
  }
}

async function getCustomerFromSession(): Promise<CustomerSummary | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyCustomerSessionToken(secret, token);
  if (!payload) return null;

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (c:Customer)
      WHERE toString(c.CustomerID) = $customerId
      RETURN c
      LIMIT 1
      `,
      { customerId: payload.customerId }
    );

    const customer =
      result.records.length > 0
        ? (result.records[0].get("c")?.properties as Record<string, unknown>)
        : null;

    return {
      email: payload.email,
      name: pickString(customer?.Name),
    };
  } finally {
    await session.close();
  }
}

async function getCategorySections(): Promise<CategorySection[]> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Product)
      WITH CASE
        WHEN p.Category IS NULL OR trim(toString(p.Category)) = "" THEN "Uncategorized"
        ELSE trim(toString(p.Category))
      END AS category, p
      ORDER BY category, p.ProductID ASC
      WITH category, collect(p{.*})[0..4] AS products
      RETURN category, products
      ORDER BY category
      `
    );

    const sections = result.records.map((record) => {
      const category = String(record.get("category") ?? "");
      const products = record.get("products") as unknown;
      return {
        category,
        products: Array.isArray(products) ? (products as ProductSummary[]) : [],
      };
    });

    return JSON.parse(JSON.stringify(sections)) as CategorySection[];
  } finally {
    await session.close();
  }
}

export default async function HomePage() {
  const customer = await getCustomerFromSession();
  const welcomeName = customer?.name ?? "";
  const categorySections = await getCategorySections();

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          padding: "1.5rem",
          border: "1px solid #eee",
          borderRadius: "12px",
          background: "#fafafa",
        }}
      >
        <h1 style={{ fontSize: "2.25rem", margin: 0 }}>
          {welcomeName ? `Welcome ${welcomeName}` : "Welcome"}
        </h1>
        <p style={{ marginTop: "0.75rem", marginBottom: 0, color: "#444" }}>
          How can we be of assistence to you today?
        </p>
        {customer?.email ? (
          <p style={{ marginTop: "0.5rem", marginBottom: 0, color: "#444" }}>
            Logged in as <strong>{customer.email}</strong>
          </p>
        ) : null}
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/products" className="navButton">
            Browse Products
          </Link>
          {customer ? (
            <>
              <Link href="/cart" className="navButton">
                Cart
              </Link>
              <CustomerLogoutButton />
            </>
          ) : (
            <>
              <Link href="/register" className="navButton">
                Register
              </Link>
              <Link href="/login" className="navButton">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: "2.25rem" }}>
        <h2 style={{ fontSize: "1.75rem", margin: 0, marginBottom: "1rem" }}>
          Shop by category
        </h2>

        {categorySections.length === 0 ? (
          <div style={{ color: "#444" }}>No products found.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {categorySections.map((section) => {
              const category = section.category || "Uncategorized";
              const href = `/products?category=${encodeURIComponent(category)}`;

              return (
                <section key={category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "1rem",
                      flexWrap: "wrap",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.35rem" }}>{category}</h3>
                    <Link href={href} className="navLink">
                      View all
                    </Link>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {section.products.map((product, index) => {
                      const productId = getProductId(product);
                      const name =
                        pickString(product.Name) ??
                        pickString(product.name) ??
                        (productId ? `Product ${productId}` : `Product ${index + 1}`);
                      const imageUrl =
                        pickString(product.ImageUrl) ??
                        pickString(product.imageUrl) ??
                        pickString(product.imageURL) ??
                        "";

                      return (
                        <div
                          key={productId || `${category}:${index}`}
                          style={{
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            background: "#fff",
                            padding: "1rem",
                          }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={name ? `${name} image` : "Product image"}
                              style={{
                                width: "100%",
                                height: "140px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "1px solid #eee",
                                display: "block",
                                marginBottom: "0.75rem",
                              }}
                            />
                          ) : null}

                          <Link
                            href={productId ? `/products/${encodeURIComponent(productId)}` : href}
                            style={{ textDecoration: "none", color: "#111" }}
                          >
                            <div style={{ fontWeight: 700 }}>{name}</div>
                          </Link>

                          <div style={{ marginTop: "0.5rem", color: "#444" }}>
                            {formatCurrency(product.Price ?? product.price)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
