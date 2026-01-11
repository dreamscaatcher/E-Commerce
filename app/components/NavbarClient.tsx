"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CustomerLogoutButton from "./CustomerLogoutButton";
import { getCartCount, getCartItems, subscribeToCartUpdates } from "../lib/cart";

export default function NavbarClient({
  isAdmin,
  isCustomer,
}: {
  isAdmin: boolean;
  isCustomer: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const showAdminNav = isAdmin && isAdminArea;
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCartCount(getCartCount(getCartItems()));
    refresh();
    return subscribeToCartUpdates(refresh);
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "1px solid #eee",
        background: "#fff",
        color: "#111",
      }}
    >
      <Link
        href={isAdminArea ? "/admin" : "/"}
        className="navLink"
        style={{ fontWeight: 600 }}
      >
        {isAdminArea ? "Backend Dashboard" : "Customer App"}
      </Link>

      <Link href={isAdminArea ? "/admin" : "/"} className="navLink">
        {isAdminArea ? "Overview" : "Home"}
      </Link>

      {showAdminNav ? (
        <>
          <Link href="/admin/products" className="navLink">
            Products
          </Link>
          <Link href="/admin/customers" className="navLink">
            Customers
          </Link>
          <Link href="/admin/orders" className="navLink">
            Orders
          </Link>
          <Link href="/admin/payments" className="navLink">
            Payments
          </Link>
          <Link href="/admin/analytics" className="navLink">
            Analytics
          </Link>

          <div style={{ marginLeft: "auto" }}>
            <Link href="/" className="navButton">
              Customer App
            </Link>
          </div>
        </>
      ) : (
        <>
          <Link href="/products" className="navLink">
            Products
          </Link>
          <a href="/admin" className="navLink">
            Backend Dashboard
          </a>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/cart" className="navButton">
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
            {isCustomer ? (
              <CustomerLogoutButton />
            ) : (
              <>
                <Link href="/register" className="navButton">
                  Register
                </Link>
                <Link href="/login" className="navButton">
                  Login
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
