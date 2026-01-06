"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NavbarLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      style={{
        padding: "0.45rem 0.75rem",
        borderRadius: "8px",
        border: "1px solid #ccc",
        background: "#fff",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

