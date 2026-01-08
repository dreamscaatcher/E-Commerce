import React from "react";
import CustomerRegistrationForm from "./CustomerRegistrationForm";

export default function RegisterPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "720px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
        Customer Registration
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: "1.5rem",
          color: "var(--muted-foreground)",
        }}
      >
        Register your details so the store owner can manage orders and payments
        for you.
      </p>

      <CustomerRegistrationForm />
    </div>
  );
}
