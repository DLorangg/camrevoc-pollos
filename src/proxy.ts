import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo evaluar rutas que empiecen con /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isAuthenticated =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "authenticated";

  // 1. Manejo de la ruta de login
  if (isLoginRoute) {
    if (isAuthenticated) {
      // Si ya está autenticado, redirigir directo al dashboard
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/admin";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
    // Si no está autenticado, permitir ver el formulario de login
    return NextResponse.next();
  }

  // 2. Manejo de rutas administrativas protegidas
  if (!isAuthenticated) {
    // Redirigir al login guardando el destino original (solo si no es login)
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    if (pathname && !pathname.startsWith("/admin/login")) {
      const fullPath = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("from", fullPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Usuario autenticado accediendo a ruta protegida
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
