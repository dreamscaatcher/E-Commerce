import React from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardCard = {
  title: string;
  description: string;
  href: string;
};

export default function BackendDashboardHomePage() {
  const cards: DashboardCard[] = [
    {
      title: "Products",
      description: "Create, edit, and manage product catalog entries.",
      href: "/admin/products",
    },
    {
      title: "Customers",
      description: "View customer profiles and contact details.",
      href: "/admin/customers",
    },
    {
      title: "Orders",
      description: "Review orders, statuses, and totals.",
      href: "/admin/orders",
    },
    {
      title: "Payments",
      description: "Track payment records and methods.",
      href: "/admin/payments",
    },
    {
      title: "Analytics",
      description: "Explore charts and dashboards powered by Neo4j.",
      href: "/admin/analytics",
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
        Backend Dashboard
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: "1.5rem",
          color: "var(--muted-foreground)",
          maxWidth: 720,
        }}
      >
        Manage products, customers, orders, payments, and analytics. This section
        is intended for internal use.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{ textDecoration: "none", color: "#111" }}
          >
            <div
              style={{
                height: "100%",
                border: "1px solid #ddd",
                borderRadius: "12px",
                background: "#fff",
                padding: "1rem",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {card.title}
              </div>
              <div style={{ marginTop: "0.5rem", color: "#444" }}>
                {card.description}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <span className="navLink">Open →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

