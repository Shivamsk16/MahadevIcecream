import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerBottomNav } from "@/components/layout/CustomerBottomNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-gray-50 pb-20">
      <CustomerHeader />
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <CustomerBottomNav />
    </section>
  );
}
