import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

const ROLE_CLAIM = "https://api.carvexio.com/roles";
const ALLOWED_ROLES = ["CLIENTE", "EMPRESA"] as const;
const CONFIGURED_ROLES = ["ADMIN", "EMPRESA", "CLIENTE"];

export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentRoles = session.user[ROLE_CLAIM];
    const normalizedRoles = Array.isArray(currentRoles)
      ? currentRoles.filter((role): role is string => typeof role === "string")
      : [];

    if (
      normalizedRoles.some((role) =>
        CONFIGURED_ROLES.includes(role.toUpperCase()),
      )
    ) {
      return NextResponse.json(
        { error: "El rol de la cuenta ya fue configurado" },
        { status: 409 },
      );
    }

    const body: unknown = await req.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("role" in body) ||
      typeof body.role !== "string" ||
      !ALLOWED_ROLES.some((allowedRole) => allowedRole === body.role)
    ) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const role = body.role;
    const userId = session.user.sub;

    if (typeof userId !== "string" || !userId.trim()) {
      console.error("set-role: sesión sin identificador de usuario");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    const issuerRaw = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_M2M_CLIENT_ID;
    const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;

    if (!issuerRaw || !clientId || !clientSecret) {
      console.error("set-role: configuración M2M de Auth0 incompleta");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    let issuerOrigin: string;
    try {
      const issuer = new URL(issuerRaw);
      if (
        issuer.protocol !== "https:" ||
        issuer.username ||
        issuer.password ||
        issuer.search ||
        issuer.hash
      ) {
        throw new Error("Issuer de Auth0 inválido");
      }
      issuerOrigin = issuer.origin;
    } catch {
      console.error("set-role: AUTH0_ISSUER_BASE_URL no es una URL HTTPS válida");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    const tokenRes = await fetch(`${issuerOrigin}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `${issuerOrigin}/api/v2/`,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      console.error("set-role: Auth0 rechazó la solicitud de token M2M");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    const tokenData: unknown = await tokenRes.json();
    if (
      typeof tokenData !== "object" ||
      tokenData === null ||
      !("access_token" in tokenData) ||
      typeof tokenData.access_token !== "string" ||
      !tokenData.access_token
    ) {
      console.error("set-role: Auth0 no devolvió un token M2M válido");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    const assignRes = await fetch(
      `${issuerOrigin}/api/v2/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_metadata: {
            roles: [role],
          },
        }),
      },
    );

    if (!assignRes.ok) {
      console.error("set-role: Auth0 rechazó la asignación del rol");
      return NextResponse.json(
        { error: "No se pudo completar la configuración de la cuenta" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("set-role: error interno");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}