import React from "react";
import ProductEditor from "./ProductEditor";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div style={{ padding: "2rem", maxWidth: "640px" }}>
      <ProductEditor id={id} />
    </div>
  );
}

