import { AuthThemeSlot } from "@/components/layout/AuthThemeSlot";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-background p-4 dark:bg-zinc-950 sm:p-8">
      <AuthThemeSlot />
      {children}
    </section>
  );
}
