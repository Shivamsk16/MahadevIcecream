import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerBottomNav } from "@/components/layout/CustomerBottomNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-background pb-24 dark:bg-zinc-950">
      <CustomerHeader />
      <main className="mx-auto max-w-lg px-4 py-5 sm:px-5">{children}</main>
      <CustomerBottomNav />
    </section>
  );
}
