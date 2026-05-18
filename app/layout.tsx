import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAHADEV Enterprises — Ice Cream Ordering",
  description: "B2B Ice Cream Ordering & Distribution Management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var k = 'mahadev-theme';
    var t = localStorage.getItem(k);
    var d = document.documentElement;
    if (t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      d.classList.add('dark');
    } else {
      d.classList.remove('dark');
    }
  } catch (e) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased theme-transition`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl border border-neutral-200 bg-surface shadow-card text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
