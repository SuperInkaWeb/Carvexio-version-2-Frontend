import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Middleware: sesion Auth0 v4 + Content-Security-Policy con nonce.
 *
 * Auth0 v4 monta las rutas /auth/* (login, logout, callback, profile,
 * access-token) y refresca la sesion en cada request.
 *
 * CSP en modo Report-Only: el navegador NO bloquea nada, solo reporta las
 * violaciones (consola de DevTools). Es el primer paso no disruptivo; una vez
 * validado el trafico real se endurece a enforce renombrando la cabecera de
 * respuesta a "Content-Security-Policy".
 *
 * El nonce se genera por request. Se pone en la cabecera de REQUEST
 * "Content-Security-Policy" (que Next.js consume internamente para inyectar el
 * nonce en sus propios <script>; nunca llega al navegador) y la politica se
 * expone al navegador en la cabecera de RESPUESTA "...-Report-Only".
 */

function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.auth0.com https://api.mercadopago.com https://api.cloudinary.com",
    "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  // Las rutas /auth/* pueden redirigir (callback, logout): se devuelven tal cual.
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authResponse;
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  // Cabecera de request consumida por Next para propagar el nonce a sus scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Preservar las cookies de sesion que Auth0 haya refrescado en este request.
  for (const cookie of authResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  // Report-Only: el navegador reporta violaciones sin bloquear.
  response.headers.set("Content-Security-Policy-Report-Only", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
