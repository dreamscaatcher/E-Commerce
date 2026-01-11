import { cookies } from "next/headers";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer/session";
import NavbarClient from "./NavbarClient";

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
  const isCustomer = await getIsCustomerSession();
  return <NavbarClient isAdmin={true} isCustomer={isCustomer} />;
}
