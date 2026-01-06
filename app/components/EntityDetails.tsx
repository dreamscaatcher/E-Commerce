import React from "react";
import Link from "next/link";
import { formatValueForKey } from "./entityFormat";

type EntityDetailsProps = {
  title: string;
  entity?: Record<string, unknown> | null;
  backHref: string;
  backLabel: string;
};

export default function EntityDetails({
  title,
  entity,
  backHref,
  backLabel,
}: EntityDetailsProps) {
  if (!entity) {
    return <div style={{ padding: "2rem" }}>Not found.</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{title}</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Object.entries(entity).map(([key, value]) => (
            <tr key={key}>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0", width: "200px" }}>
                <strong>{key}</strong>
              </td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #f0f0f0" }}>
                {formatValueForKey(key, value) || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        href={backHref}
        style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#eee",
          borderRadius: "6px",
        }}
      >
        ← Back to {backLabel}
      </Link>
    </div>
  );
}
