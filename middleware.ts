import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIXES = [
  "/dashboard",
  "/admin",
  "/inventory",
  "/customers",
  "/categories",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/verify-otp");

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/login?error=inactive", request.url)
      );
    }

    if (isAuthPage) {
      const dest =
        profile?.role === "admin" ? "/dashboard" : "/home";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
    if (isAdminRoute && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    if (profile?.role === "admin" && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (!user && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/") {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals, favicon, auth API, and root-level static assets
     * (e.g. /mahadev-hero-banner.jpg). Otherwise `next/image` server-side
     * fetch hits this middleware without session cookies, gets HTML from
     * /login, and the optimizer fails with "isn't a valid image".
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|[^/]+\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$).*)",
  ],
};
