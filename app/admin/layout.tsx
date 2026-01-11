import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backend Dashboard",
  description: "Internal dashboard for managing data",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

