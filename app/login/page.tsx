import React from "react";
import CustomerLoginForm from "./CustomerLoginForm";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const initialEmail = typeof sp?.email === "string" ? sp.email : "";
  const verified = typeof sp?.verified === "string" ? sp.verified === "1" : false;
  const verifyStatus = typeof sp?.verify === "string" ? sp.verify : "";
  const next = typeof sp?.next === "string" ? sp.next : "";

  return (
    <div style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
        Customer Login
      </h1>
      {verified ? (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          Email verified. Please log in.
        </div>
      ) : null}
      {verifyStatus ? (
        <div style={{ marginBottom: "1rem", color: "#b91c1c" }}>
          {verifyStatus === "missing"
            ? "Verification link is missing."
            : verifyStatus === "invalid"
              ? "Verification link is invalid or expired."
              : "Verification failed. Please try again."}
        </div>
      ) : null}
      <CustomerLoginForm initialEmail={initialEmail} redirectTo={next} />
    </div>
  );
}
