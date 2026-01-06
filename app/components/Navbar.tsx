import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer/session";
import NavbarClient from "./NavbarClient";

async function getIsAdminSession(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyAdminSessionToken(secret, token);
  return payload?.sub === "admin";
}

async function getIsCustomerSession(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyCustomerSessionToken(secret, token);
  return payload?.sub === "customer";
}

export default async function Navbar() {
  const isAdmin = await getIsAdminSession();
  const isCustomer = await getIsCustomerSession();
  return <NavbarClient isAdmin={isAdmin} isCustomer={isCustomer} />;
}
