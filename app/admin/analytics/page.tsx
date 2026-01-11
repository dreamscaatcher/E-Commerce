import React from "react";
import Link from "next/link";
import {
  CategoryPieChartThumbnail,
  CustomerCityBarChartThumbnail,
  TopSellingProductsBarChartThumbnail,
  TopTransactionsBarChartThumbnail,
  LargestOrderBreakdownThumbnail,
  MonthlySalesBarChartThumbnail,
  SupplyPlanningThumbnail,
} from "./VisualizationThumbnails";
import {
  getCategoryCounts,
  getCustomerCityCounts,
  getTopSellingProducts,
  getTopTransactions,
  getLargestOrderBreakdown,
  getMonthlySales,
} from "./data";

export const dynamic = "force-dynamic";

type AnalyticsCard = {
  title: string;
  description: string;
  href: string;
  thumbnail: React.ReactNode;
};

export default async function AdminAnalyticsPage() {
  const [
    categoryCounts,
    cityCounts,
    topProducts,
    topTransactions,
    largestOrder,
    monthlySales,
  ] = await Promise.all([
    getCategoryCounts(),
    getCustomerCityCounts(),
    getTopSellingProducts(12),
    getTopTransactions(12),
    getLargestOrderBreakdown(),
    getMonthlySales(12),
  ]);

  const cards: AnalyticsCard[] = [
    {
      title: "Products by Category",
      description: "Pie chart showing product distribution across categories.",
      href: "/admin/analytics/products-by-category",
      thumbnail: <CategoryPieChartThumbnail data={categoryCounts} />,
    },
    {
      title: "Customers by City",
      description: "Bar chart showing customer count per city.",
      href: "/admin/analytics/customers-by-city",
      thumbnail: <CustomerCityBarChartThumbnail data={cityCounts} />,
    },
    {
      title: "Top Selling Products",
      description: "Ranked by units sold (descending).",
      href: "/admin/analytics/top-selling-products",
      thumbnail: <TopSellingProductsBarChartThumbnail data={topProducts} />,
    },
    {
      title: "Top Transactions",
      description: "Largest orders by total amount.",
      href: "/admin/analytics/top-transactions",
      thumbnail: <TopTransactionsBarChartThumbnail data={topTransactions} />,
    },
    {
      title: "Largest Order Breakdown",
      description: "Which products made up the biggest order.",
      href: "/admin/analytics/largest-order-breakdown",
      thumbnail: (
        <LargestOrderBreakdownThumbnail items={largestOrder?.items ?? []} />
      ),
    },
    {
      title: "Sales by Month",
      description: "Highest sales month (sorted desc).",
      href: "/admin/analytics/sales-by-month",
      thumbnail: <MonthlySalesBarChartThumbnail data={monthlySales} />,
    },
    {
      title: "Supply Planning",
      description: "Demand by day/week + utilization + what-if capacity.",
      href: "/admin/analytics/supply-planning",
      thumbnail: <SupplyPlanningThumbnail />,
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
        Backend Dashboard · Analytics
      </h1>
      <p style={{ marginTop: 0, marginBottom: "1.5rem", color: "var(--muted-foreground)" }}>
        Choose a visualization to explore your Neo4j data.
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
              <div
                style={{
                  height: 110,
                  border: "1px solid #eee",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  overflow: "hidden",
                  padding: "0.5rem",
                }}
              >
                {card.thumbnail}
              </div>
              <div
                style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "0.75rem" }}
              >
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
