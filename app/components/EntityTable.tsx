"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { getFieldValue } from "./entityFormat";

type Column = {
  key: string;
  label: string;
  format?: "text" | "image";
};

type EntityTableProps = {
  title: string;
  items?: Record<string, unknown>[];
  idKey: string;
  linkPrefix: string;
  columns: Column[];
  initialQuery?: string;
  initialField?: string;
};

export default function EntityTable({
  title,
  items,
  idKey,
  linkPrefix,
  columns,
  initialQuery,
  initialField,
}: EntityTableProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [field, setField] = useState(() => {
    const candidate = initialField ?? "all";
    if (candidate === "all") return "all";
    if (candidate === idKey) return candidate;
    if (columns.some((column) => column.key === candidate)) return candidate;
    return "all";
  });
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }

    if (field !== "all") {
      url.searchParams.set("field", field);
    } else {
      url.searchParams.delete("field");
    }

    window.history.replaceState(null, "", url.toString());
  }, [query, field]);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return safeItems;

    return safeItems.filter((item) => {
      const matchesField = (key: string) =>
        getFieldValue(item, key).toLowerCase().includes(normalizedQuery);

      if (field !== "all") {
        return matchesField(field);
      }

      return (
        matchesField(idKey) ||
        columns.some((column) => matchesField(column.key))
      );
    });
  }, [safeItems, normalizedQuery, field, idKey, columns]);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{title}</h1>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "1rem",
          }}
        />
        <select
          value={field}
          onChange={(event) => setField(event.target.value)}
          style={{
            minWidth: "180px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "1rem",
            background: "white",
          }}
        >
          <option value="all">All fields</option>
          <option value={idKey}>ID</option>
          {columns.map((column) => (
            <option key={column.key} value={column.key}>
              {column.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                ID
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}
                >
                  {column.label}
                </th>
              ))}
              <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td style={{ padding: "0.75rem" }} colSpan={columns.length + 2}>
                  No results found.
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => {
                const id = getFieldValue(item, idKey);
                const linkId = id || String(index);
                return (
                  <tr key={linkId}>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                      {id || "-"}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0" }}
                      >
                        {column.format === "image" ? (
                          getFieldValue(item, column.key) ? (
                            <img
                              src={getFieldValue(item, column.key)}
                              alt={`${column.label} for ${id || "item"}`}
                              style={{
                                width: "56px",
                                height: "56px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                border: "1px solid #eee",
                                display: "block",
                              }}
                            />
                          ) : (
                            "-"
                          )
                        ) : (
                          getFieldValue(item, column.key) || "-"
                        )}
                      </td>
                    ))}
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                      <Link href={`${linkPrefix}/${linkId}`}>View</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
