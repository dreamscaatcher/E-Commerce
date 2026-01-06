"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/customer/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="navButton"
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

