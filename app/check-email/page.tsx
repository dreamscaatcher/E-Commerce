import React from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const email = typeof sp?.email === "string" ? sp.email : "";
  const emailVerificationDisabled =
    process.env.DISABLE_EMAIL_VERIFICATION === "true";
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
        {emailVerificationDisabled ? "You're all set" : "Confirm your email"}
      </h1>
      {emailVerificationDisabled ? (
        <p style={{ marginTop: 0, color: "var(--muted-foreground)" }}>
          Email verification is disabled, so you can log in immediately
          {email ? ` as ${email}` : ""}.
        </p>
      ) : (
        <>
          <p style={{ marginTop: 0, color: "var(--muted-foreground)" }}>
            We sent a confirmation link{email ? ` to ${email}` : ""}. Please open
            your email and click the link to verify your account.
          </p>
          <p style={{ color: "var(--muted-foreground)" }}>
            If you don’t see it, check your spam/junk folder.
          </p>
          {!smtpConfigured && process.env.NODE_ENV !== "production" ? (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
              }}
            >
              SMTP isn’t configured, so no real email was sent. In dev, the app
              prints the verification link in your terminal after you register.
            </div>
          ) : null}
        </>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link
          href="/register"
          style={{
            display: "inline-block",
            padding: "0.6rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Back to Register
        </Link>

        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "0.6rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
