import React, { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
      <div style={{ padding: "2rem", maxWidth: "420px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Admin Login</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
