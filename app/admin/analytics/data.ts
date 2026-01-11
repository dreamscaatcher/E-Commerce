import driver from "@/lib/neo4j";
import type { Record as Neo4jRecord } from "neo4j-driver";

export type CategoryCount = {
  category: string;
  count: number;
};

export type CityCount = {
  city: string;
  count: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type TopTransaction = {
  orderId: string;
  total: number;
  currency: string;
  status: string;
  customerEmail: string;
  orderDate: string;
};

export type MonthlySales = {
  month: string;
  total: number;
  payments: number;
};

export type DemandSeriesPoint = {
  period: string;
  orders: number;
  items: number;
  revenue: number;
};

export type LargestOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  category?: string;
  imageUrl?: string;
};

export type LargestOrderBreakdown = {
  orderId: string;
  total: number;
  currency: string;
  status: string;
  customerEmail: string;
  orderDate: string;
  items: LargestOrderItem[];
};

function normalizeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object") {
    const maybe = value as { low?: number };
    if (typeof maybe.low === "number") return String(maybe.low);
  }
  return "";
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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

function isoWeekStart(period: string): string | null {
  if (typeof period !== "string" || period.trim() === "") return null;
  const date = new Date(`${period}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return null;
  const mondayBased = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayBased);
  return date.toISOString().slice(0, 10);
}

export async function getCategoryCounts(): Promise<CategoryCount[]> {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product)
      WITH CASE
        WHEN p.Category IS NULL OR trim(toString(p.Category)) = "" THEN "Uncategorized"
        ELSE trim(toString(p.Category))
      END AS category
      RETURN category, toFloat(count(*)) AS count
      ORDER BY count DESC, category ASC
    `);

    return result.records
      .map((record: Neo4jRecord) => {
        const category = String(record.get("category") ?? "");
        const count = Number(record.get("count"));
        return { category, count: Number.isFinite(count) ? count : 0 };
      })
      .filter((entry) => entry.category && entry.count > 0);
  } finally {
    await session.close();
  }
}

export async function getCustomerCityCounts(): Promise<CityCount[]> {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (c:Customer)
      WITH CASE
        WHEN c.City IS NULL OR trim(toString(c.City)) = "" THEN "Unknown"
        ELSE trim(toString(c.City))
      END AS city
      RETURN city, toFloat(count(*)) AS count
      ORDER BY count DESC, city ASC
    `);

    return result.records
      .map((record: Neo4jRecord) => {
        const city = String(record.get("city") ?? "");
        const count = Number(record.get("count"));
        return { city, count: Number.isFinite(count) ? count : 0 };
      })
      .filter((entry) => entry.city && entry.count > 0);
  } finally {
    await session.close();
  }
}

export async function getTopSellingProducts(
  limit: number = 20
): Promise<TopProduct[]> {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (o:Order)
      WHERE o.ItemsJson IS NOT NULL AND trim(toString(o.ItemsJson)) <> ""
      RETURN o.ItemsJson AS itemsJson
    `);

    const totals = new Map<
      string,
      { productId: string; name: string; unitsSold: number; revenue: number }
    >();

    result.records.forEach((record: Neo4jRecord) => {
      const raw = record.get("itemsJson");
      if (typeof raw !== "string" || !raw.trim()) return;

      let items: unknown;
      try {
        items = JSON.parse(raw);
      } catch {
        return;
      }

      if (!Array.isArray(items)) return;

      for (const entry of items) {
        if (!entry || typeof entry !== "object") continue;
        const item = entry as Record<string, unknown>;
        const productId = normalizeId(item.productId ?? item.ProductID ?? item.id);
        if (!productId) continue;

        const quantity = pickNumber(item.quantity ?? item.qty) ?? 0;
        const price = pickNumber(item.price ?? item.Price) ?? 0;
        if (!Number.isFinite(quantity) || quantity <= 0) continue;

        const name = pickString(item.name ?? item.Name) ?? `Product ${productId}`;

        const existing = totals.get(productId) ?? {
          productId,
          name,
          unitsSold: 0,
          revenue: 0,
        };

        existing.unitsSold += Math.floor(quantity);
        existing.revenue += price * Math.floor(quantity);
        if (!existing.name && name) existing.name = name;
        totals.set(productId, existing);
      }
    });

    return Array.from(totals.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, Math.max(1, limit));
  } finally {
    await session.close();
  }
}

export async function getTopTransactions(
  limit: number = 15
): Promise<TopTransaction[]> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (o:Order)
      WITH
        toString(o.OrderID) AS orderId,
        toFloat(coalesce(o.Total, 0)) AS total,
        coalesce(toString(o.Currency), "EUR") AS currency,
        coalesce(toString(o.Status), "") AS status,
        coalesce(toString(o.CustomerEmail), "") AS customerEmail,
        coalesce(toString(o.OrderDate), "") AS orderDate
      WHERE total > 0 AND orderId <> ""
      RETURN orderId, total, currency, status, customerEmail, orderDate
      ORDER BY total DESC, orderId DESC
      LIMIT toInteger($limit)
      `,
      { limit: Math.max(1, Math.floor(limit)) }
    );

    return result.records.map((record: Neo4jRecord) => {
      const orderId = String(record.get("orderId") ?? "");
      const totalValue = Number(record.get("total"));
      const currency = String(record.get("currency") ?? "EUR");
      const status = String(record.get("status") ?? "");
      const customerEmail = String(record.get("customerEmail") ?? "");
      const orderDate = String(record.get("orderDate") ?? "");

      return {
        orderId,
        total: Number.isFinite(totalValue) ? totalValue : 0,
        currency,
        status,
        customerEmail,
        orderDate,
      };
    });
  } finally {
    await session.close();
  }
}

export async function getMonthlySales(
  limit: number = 12
): Promise<MonthlySales[]> {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Payment)
      WITH
        coalesce(p.PaymentDate, p.CreatedAt) AS dt,
        toFloat(coalesce(p.Amount, 0)) AS amount
      WHERE dt IS NOT NULL AND amount > 0
      WITH
        substring(toString(dt), 0, 7) AS month,
        sum(amount) AS total,
        toInteger(count(*)) AS payments
      WHERE month IS NOT NULL AND month <> "" AND month <> "null"
      RETURN month, total, payments
      ORDER BY total DESC, month DESC
      LIMIT toInteger($limit)
      `,
      { limit: Math.max(1, Math.floor(limit)) }
    );

    return result.records
      .map((record: Neo4jRecord) => {
        const month = String(record.get("month") ?? "");
        const totalValue = Number(record.get("total"));
        const paymentsValue = pickNumber(record.get("payments")) ?? 0;

        return {
          month,
          total: Number.isFinite(totalValue) ? totalValue : 0,
          payments: Math.max(0, Math.floor(paymentsValue)),
        };
      })
      .filter((entry) => entry.month && entry.total > 0);
  } finally {
    await session.close();
  }
}

export async function getDailyDemandSeries(
  limit: number = 90
): Promise<DemandSeriesPoint[]> {
  const session = driver.session();
  try {
    const safeLimit = Math.max(1, Math.floor(limit));
    const result = await session.run(
      `
      MATCH (o:Order)
      WITH
        coalesce(o.OrderDate, o.CreatedAt) AS dt,
        toFloat(coalesce(o.Total, 0)) AS total,
        toFloat(coalesce(o.ItemCount, 0)) AS items
      WHERE dt IS NOT NULL AND items > 0
      WITH substring(toString(dt), 0, 10) AS period, total, items
      WHERE period IS NOT NULL AND period <> "" AND period <> "null"
      RETURN
        period,
        toFloat(count(*)) AS orders,
        sum(items) AS items,
        sum(total) AS revenue
      ORDER BY period DESC
      LIMIT toInteger($limit)
      `,
      { limit: safeLimit }
    );

    return result.records
      .map((record: Neo4jRecord) => {
        const period = String(record.get("period") ?? "");
        const ordersValue = Number(record.get("orders"));
        const itemsValue = Number(record.get("items"));
        const revenueValue = Number(record.get("revenue"));

        return {
          period,
          orders: Number.isFinite(ordersValue) ? Math.max(0, Math.floor(ordersValue)) : 0,
          items: Number.isFinite(itemsValue) ? Math.max(0, Math.floor(itemsValue)) : 0,
          revenue: Number.isFinite(revenueValue) ? Math.max(0, revenueValue) : 0,
        };
      })
      .filter((entry) => entry.period && entry.items > 0)
      .reverse();
  } finally {
    await session.close();
  }
}

export async function getWeeklyDemandSeries(
  limitWeeks: number = 26
): Promise<DemandSeriesPoint[]> {
  const safeWeeks = Math.max(1, Math.floor(limitWeeks));
  const daily = await getDailyDemandSeries(safeWeeks * 14);

  const totals = new Map<string, DemandSeriesPoint>();
  daily.forEach((entry) => {
    const weekStart = isoWeekStart(entry.period);
    if (!weekStart) return;

    const existing = totals.get(weekStart) ?? {
      period: weekStart,
      orders: 0,
      items: 0,
      revenue: 0,
    };

    existing.orders += entry.orders;
    existing.items += entry.items;
    existing.revenue += entry.revenue;
    totals.set(weekStart, existing);
  });

  const series = Array.from(totals.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  return series.slice(Math.max(0, series.length - safeWeeks));
}

export async function getLargestOrderBreakdown(): Promise<LargestOrderBreakdown | null> {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (o:Order)
      WITH o, toFloat(coalesce(o.Total, 0)) AS total
      WHERE total > 0 AND o.OrderID IS NOT NULL
      OPTIONAL MATCH (o)-[rel:CONTAINS]->(p:Product)
      WITH
        o,
        total,
        collect({
          productId: toString(coalesce(p.ProductID, "")),
          name: toString(coalesce(p.Name, "")),
          price: toFloat(coalesce(rel.price, p.Price, 0)),
          quantity: toInteger(coalesce(rel.quantity, 1)),
          category: toString(coalesce(p.Category, "")),
          imageUrl: toString(coalesce(p.ImageUrl, ""))
        }) AS relItems
      RETURN
        toString(o.OrderID) AS orderId,
        total,
        coalesce(toString(o.Currency), "EUR") AS currency,
        coalesce(toString(o.Status), "") AS status,
        coalesce(toString(o.CustomerEmail), "") AS customerEmail,
        coalesce(toString(o.OrderDate), "") AS orderDate,
        coalesce(toString(o.ItemsJson), "") AS itemsJson,
        relItems
      ORDER BY total DESC, orderId DESC
      LIMIT 1
    `);

    if (result.records.length === 0) return null;

    const record = result.records[0] as Neo4jRecord;
    const orderId = String(record.get("orderId") ?? "");
    const totalValue = Number(record.get("total"));
    const total = Number.isFinite(totalValue) ? totalValue : 0;
    const currency = String(record.get("currency") ?? "EUR");
    const status = String(record.get("status") ?? "");
    const customerEmail = String(record.get("customerEmail") ?? "");
    const orderDate = String(record.get("orderDate") ?? "");
    const itemsJson = String(record.get("itemsJson") ?? "");

    let rawItems: unknown = null;
    try {
      rawItems = itemsJson ? JSON.parse(itemsJson) : null;
    } catch {
      rawItems = null;
    }

    let itemList: Record<string, unknown>[] = [];
    if (Array.isArray(rawItems)) {
      itemList = rawItems.filter(
        (entry) => entry && typeof entry === "object"
      ) as Record<string, unknown>[];
    }

    if (itemList.length === 0) {
      const relItems = record.get("relItems");
      if (Array.isArray(relItems)) {
        itemList = relItems.filter(
          (entry) => entry && typeof entry === "object"
        ) as Record<string, unknown>[];
      }
    }

    const aggregated = new Map<
      string,
      {
        productId: string;
        name: string;
        quantity: number;
        lineTotal: number;
        category?: string;
        imageUrl?: string;
      }
    >();

    itemList.forEach((item) => {
      const productId = normalizeId(item.productId ?? item.ProductID ?? item.id);
      if (!productId) return;

      const quantityRaw = pickNumber(item.quantity ?? item.qty ?? item.Quantity) ?? 0;
      const quantity = Math.max(0, Math.floor(quantityRaw));
      if (quantity <= 0) return;

      const priceRaw =
        pickNumber(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice) ??
        0;
      const lineTotalRaw = pickNumber(item.lineTotal ?? item.LineTotal);
      const lineTotal = Number.isFinite(lineTotalRaw ?? Number.NaN)
        ? (lineTotalRaw as number)
        : priceRaw * quantity;

      const name = pickString(item.name ?? item.Name) ?? `Product ${productId}`;
      const category = pickString(item.category ?? item.Category);
      const imageUrl = pickString(item.imageUrl ?? item.ImageUrl);

      const existing = aggregated.get(productId) ?? {
        productId,
        name,
        quantity: 0,
        lineTotal: 0,
        category,
        imageUrl,
      };

      existing.quantity += quantity;
      existing.lineTotal += Number.isFinite(lineTotal) ? lineTotal : 0;
      if (!existing.name && name) existing.name = name;
      if (!existing.category && category) existing.category = category;
      if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;

      aggregated.set(productId, existing);
    });

    const items: LargestOrderItem[] = Array.from(aggregated.values())
      .map((entry) => ({
        ...entry,
        unitPrice:
          entry.quantity > 0 && Number.isFinite(entry.lineTotal)
            ? entry.lineTotal / entry.quantity
            : 0,
      }))
      .filter((entry) => entry.productId && entry.quantity > 0)
      .sort((a, b) => b.lineTotal - a.lineTotal || b.quantity - a.quantity);

    return {
      orderId,
      total,
      currency,
      status,
      customerEmail,
      orderDate,
      items,
    };
  } finally {
    await session.close();
  }
}
