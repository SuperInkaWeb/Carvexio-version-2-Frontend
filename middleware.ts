import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// Auth0 v4 monta las rutas /auth/* (login, logout, callback, profile,
// access-token) y refresca la sesion en cada request. Reemplaza al antiguo
// app/api/auth/[...auth0]/route.ts de v3.
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
