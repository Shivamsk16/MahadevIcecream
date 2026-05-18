import { AuthThemeSlot } from "@/components/layout/AuthThemeSlot";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-screen">
      <aside className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-12 text-white lg:flex">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            MAHADEV Enterprises
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Premium ice cream distribution, simplified.
          </h1>
          <p className="mt-4 max-w-sm text-neutral-400">
            Manage orders, inventory, and customers from one modern workspace.
          </p>
        </div>
        <p className="text-sm text-neutral-500">
          Trusted B2B ordering platform
        </p>
      </aside>
      <main className="relative flex w-full flex-1 items-center justify-center bg-background p-4 dark:bg-zinc-950 sm:p-8 lg:w-1/2">
        <AuthThemeSlot />
        {children}
      </main>
    </section>
  );
}
