import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Cliente Auth0 v4. Toma la configuracion de variables de entorno:
//   AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, APP_BASE_URL
// (reemplazan a las de v3: AUTH0_ISSUER_BASE_URL, AUTH0_BASE_URL, etc.).
export const auth0 = new Auth0Client();
