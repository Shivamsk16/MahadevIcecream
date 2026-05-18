import { ProductsView } from "@/components/products/ProductsView";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ProductsView initialCategory={category} />;
}
